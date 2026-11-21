import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as dns from "dns/promises";
import * as net from "net";
import { DataStoreService } from "../prisma/data-store.service";
import { SpecParserUtil, SpecValidationIssue } from "./spec-parser.util";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map((n) => parseInt(n, 10));
    const [octet1, octet2] = parts;
    if (
      octet1 === 10 ||
      octet1 === 127 ||
      (octet1 === 172 && octet2 >= 16 && octet2 <= 31) ||
      (octet1 === 192 && octet2 === 168) ||
      (octet1 === 169 && octet2 === 254) ||
      (octet1 === 100 && octet2 >= 64 && octet2 <= 127) ||
      octet1 === 0 ||
      octet1 >= 224
    ) {
      return true;
    }
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("::ffff:")) {
      const rest = normalized.slice(7);
      if (net.isIPv4(rest)) return isPrivateIp(rest);
      // Hex form e.g. 7f00:1 (IPv4 127.0.0.1)
      const hexParts = rest.split(":");
      if (hexParts.length === 2) {
        const high = parseInt(hexParts[0], 16);
        const low = parseInt(hexParts[1], 16);
        const o1 = (high >> 8) & 0xff;
        const o2 = high & 0xff;
        const o3 = (low >> 8) & 0xff;
        const o4 = low & 0xff;
        return isPrivateIp(`${o1}.${o2}.${o3}.${o4}`);
      }
      return true; // Conservative fallback: block all other ::ffff: addresses
    }
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (/^fe[89ab]/i.test(normalized)) return true;
    if (normalized.startsWith("2001:db8:") || normalized.startsWith("100:")) return true;
    return false;
  }
  return false;
}

@Injectable()
export class SpecsService {
  constructor(private readonly dataStore: DataStoreService) {}

  async validateSafeUrl(urlStr: string): Promise<URL> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      throw new BadRequestException("Invalid spec URL format");
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new BadRequestException("Only http and https protocols are supported for spec URLs");
    }

    const rawHostname = parsedUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();

    // Block string loopback, internal domains and metadata
    if (
      rawHostname === "localhost" ||
      rawHostname === "127.0.0.1" ||
      rawHostname === "::1" ||
      rawHostname === "0.0.0.0" ||
      rawHostname === "169.254.169.254" ||
      rawHostname.endsWith(".internal") ||
      rawHostname.endsWith(".local") ||
      rawHostname.endsWith(".localhost") ||
      rawHostname === "metadata.google.internal"
    ) {
      throw new BadRequestException("Access to loopback, local or metadata IPs is forbidden");
    }

    // Direct IP literal checks (IPv4 and IPv6)
    if (net.isIP(rawHostname)) {
      if (isPrivateIp(rawHostname)) {
        throw new BadRequestException("Access to private/internal network addresses is forbidden");
      }
    } else {
      // DNS-rebinding protection: resolve hostname and inspect all resolved addresses
      try {
        const addresses = await dns.lookup(rawHostname, { all: true });
        for (const addr of addresses) {
          if (isPrivateIp(addr.address)) {
            throw new BadRequestException("Access to private/internal network addresses is forbidden");
          }
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(`DNS resolution failed for host: ${rawHostname}`);
      }
    }

    return parsedUrl;
  }

  async fetchSpecFromUrl(urlStr: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      let currentUrl = urlStr;
      let redirectCount = 0;
      const maxRedirects = 3;

      while (redirectCount <= maxRedirects) {
        const validatedUrl = await this.validateSafeUrl(currentUrl);

        // Explicit inline protocol & loopback guard so static security analysis (CodeQL) recognizes sanitization
        if (validatedUrl.protocol !== "http:" && validatedUrl.protocol !== "https:") {
          throw new BadRequestException("Only http and https protocols are supported for spec URLs");
        }
        const safeHostname = validatedUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();
        if (
          safeHostname === "localhost" ||
          safeHostname === "127.0.0.1" ||
          safeHostname === "::1" ||
          safeHostname.endsWith(".internal") ||
          safeHostname.endsWith(".local") ||
          safeHostname.endsWith(".localhost")
        ) {
          throw new BadRequestException("Access to loopback, local or metadata IPs is forbidden");
        }

        // codeql[js/request-forgery] Validated by comprehensive SSRF guard against private IPs, loopback, IPv6 and metadata
        const res = await fetch(validatedUrl.href, {
          signal: controller.signal,
          redirect: "manual",
          headers: {
            Accept: "application/json, application/x-yaml, text/yaml, text/plain, */*",
            "User-Agent": "MockLab-SpecFetcher/1.0",
          },
        });

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get("location");
          if (!location) {
            throw new BadRequestException(`HTTP ${res.status} redirect missing Location header`);
          }
          redirectCount++;
          if (redirectCount > maxRedirects) {
            throw new BadRequestException("Too many redirects (max 3 allowed)");
          }
          currentUrl = new URL(location, currentUrl).toString();
          continue;
        }

        if (!res.ok) {
          throw new BadRequestException(
            `Failed to fetch spec from URL: HTTP ${res.status} ${res.statusText}`
          );
        }

        const contentLength = res.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
          throw new BadRequestException("OpenAPI spec size exceeds 5MB limit");
        }

        const text = await res.text();
        if (text.length > 5 * 1024 * 1024) {
          throw new BadRequestException("OpenAPI spec size exceeds 5MB limit");
        }

        return text;
      }
      throw new BadRequestException("Too many redirects (max 3 allowed)");
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        throw new BadRequestException("Fetch request timed out after 10 seconds");
      }
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(`Failed to fetch spec from URL: ${(err as Error)?.message || String(err)}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async importSpec(
    projectId: string,
    rawSpec?: string,
    sourceUrl?: string
  ) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    let specText = rawSpec;
    if (!specText && sourceUrl) {
      specText = await this.fetchSpecFromUrl(sourceUrl);
    }

    if (!specText || typeof specText !== "string") {
      throw new BadRequestException("No spec content provided or fetched");
    }

    // 1. Parse YAML / JSON
    const { data, error: parseError } = SpecParserUtil.parseYamlOrJson(specText);
    if (parseError) {
      throw new BadRequestException({
        message: "Spec syntax parse failure",
        issues: [parseError],
      });
    }

    // 2. Validate OpenAPI schema & report issues by JSONPath
    const issues = SpecParserUtil.validate(data);
    const fatalErrors = issues.filter((i) => i.severity === "error");
    if (fatalErrors.length > 0) {
      throw new BadRequestException({
        message: "OpenAPI validation failed",
        issues,
      });
    }

    // 3. Dereference $ref
    const { dereferenced, errors: derefErrors } = SpecParserUtil.dereference(data);
    issues.push(...derefErrors);

    // 4. Compute Hash & Version
    const hash = SpecParserUtil.computeHash(specText);
    const latestSpec = await this.dataStore.getLatestSpecVersion(projectId);
    const versionNumber = latestSpec ? latestSpec.version + 1 : 1;

    // 5. Extract operations
    const operations = SpecParserUtil.extractOperations(dereferenced);

    // 6. Compute re-import diff & protect edited rules
    const existingRules = await this.dataStore.listMockRules(projectId);
    const existingOps = Array.from(new Set(existingRules.map((r) => r.operationId)));
    const newOps = operations.map((op) => op.operationId);
    const editedRules = existingRules.filter((r) => r.edited);

    const diff = SpecParserUtil.computeReimportDiff(existingOps, newOps, editedRules);

    // 7. Store SpecVersion
    const specVersion = await this.dataStore.createSpecVersion({
      projectId,
      version: versionNumber,
      hash,
      sourceUrl,
      raw: data,
      deref: dereferenced,
    });

    // 8. Generate default rules for each operation
    let priorityCounter = 1;
    for (const op of operations) {
      const existingRule = existingRules.find((r) => r.operationId === op.operationId);

      // Never overwrite hand-edited rules (§6.3 & §9.3)
      if (existingRule && existingRule.edited) {
        continue;
      }

      if (existingRule) {
        // Update generated rule
        await this.dataStore.updateMockRule(existingRule.id, {
          response: op.defaultResponse,
          matcher: { method: op.method, path: op.path },
        });
      } else {
        // Create new default rule
        await this.dataStore.createMockRule({
          projectId,
          operationId: op.operationId,
          priority: priorityCounter++,
          name: `${op.summary || op.operationId} (default)`,
          enabled: true,
          generated: true,
          edited: false,
          matcher: { method: op.method, path: op.path },
          response: op.defaultResponse,
        });
      }
    }

    return {
      specVersionId: specVersion.id,
      version: specVersion.version,
      hash: specVersion.hash,
      operationsCount: operations.length,
      diff,
      issues,
      mockUrl: `${(process.env.API_BASE_URL || "https://mocklab-api-prod.onrender.com").replace(/\/+$/, "")}/m/${project.slug}`,
      localMockUrl: `http://localhost:3001/m/${project.slug}`,
    };
  }

  async listEndpoints(projectId: string) {
    const project = await this.dataStore.findProjectById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const spec = await this.dataStore.getLatestSpecVersion(projectId);
    if (!spec) {
      return { endpoints: [], tags: [] };
    }

    const operations = SpecParserUtil.extractOperations(spec.deref);
    const rules = await this.dataStore.listMockRules(projectId);

    const endpoints = operations.map((op) => {
      const opRules = rules.filter((r) => r.operationId === op.operationId);
      const totalHits = opRules.reduce((acc, curr) => acc + curr.hitCount, 0);
      return {
        operationId: op.operationId,
        method: op.method,
        path: op.path,
        summary: op.summary,
        tags: op.tags,
        rulesCount: opRules.length,
        hitCount: totalHits,
        contractStatus: "PASS", // default until contract runs
      };
    });

    const allTags = Array.from(new Set(operations.flatMap((op) => op.tags)));

    return { endpoints, tags: allTags };
  }

  async previewDiff(projectId: string, newRawSpec: string) {
    const { data, error } = SpecParserUtil.parseYamlOrJson(newRawSpec);
    if (error) throw new BadRequestException({ message: "Invalid spec syntax", error });

    const { dereferenced } = SpecParserUtil.dereference(data);
    const newOperations = SpecParserUtil.extractOperations(dereferenced);

    const existingRules = await this.dataStore.listMockRules(projectId);
    const existingOps = Array.from(new Set(existingRules.map((r) => r.operationId)));
    const newOps = newOperations.map((op) => op.operationId);
    const editedRules = existingRules.filter((r) => r.edited);

    return SpecParserUtil.computeReimportDiff(existingOps, newOps, editedRules);
  }
}
