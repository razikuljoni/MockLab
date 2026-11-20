import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DataStoreService } from "../prisma/data-store.service";
import { SpecParserUtil, SpecValidationIssue } from "./spec-parser.util";

@Injectable()
export class SpecsService {
  constructor(private readonly dataStore: DataStoreService) {}

  async fetchSpecFromUrl(urlStr: string): Promise<string> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      throw new BadRequestException("Invalid spec URL format");
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new BadRequestException("Only http and https protocols are supported for spec URLs");
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // SSRF Guard: Block localhost, loopbacks, internal/private IPv4 and metadata addresses
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname === "169.254.169.254" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".localhost")
    ) {
      throw new BadRequestException("Access to loopback, local or metadata IPs is forbidden");
    }

    // Check private IPv4 ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const octet1 = parseInt(match[1], 10);
      const octet2 = parseInt(match[2], 10);
      if (
        octet1 === 10 ||
        octet1 === 127 ||
        (octet1 === 172 && octet2 >= 16 && octet2 <= 31) ||
        (octet1 === 192 && octet2 === 168) ||
        (octet1 === 169 && octet2 === 254) ||
        octet1 === 0
      ) {
        throw new BadRequestException("Access to private/internal network addresses is forbidden");
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(urlStr, {
        signal: controller.signal,
        headers: {
          Accept: "application/json, application/x-yaml, text/yaml, text/plain, */*",
          "User-Agent": "MockLab-SpecFetcher/1.0",
        },
      });

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
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        throw new BadRequestException("Fetch request timed out after 10 seconds");
      }
      throw err;
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
      mockUrl: `https://${project.slug}.mocklab.dev`,
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
