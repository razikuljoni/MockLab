import {
  Controller,
  All,
  Req,
  Res,
  Logger,
  Optional,
} from "@nestjs/common";
import { Request, Response } from "express";
import { DataStoreService } from "../prisma/data-store.service";
import { MockEngineService, IncomingMockRequest } from "./mock-engine.service";
import { TemplateEngineUtil } from "./template-engine.util";
import { MockStateService } from "../scenarios/mock-state.service";
import { RequestLoggerService } from "../logs/request-logger.service";
import { ApiKeysService } from "../keys/api-keys.service";
import { ProjectStatus, MockAuth } from "@prisma/client";

@Controller()
export class MockController {
  private readonly logger = new Logger(MockController.name);
  private readonly publicRateLimitWindows = new Map<string, { windowStart: number; count: number }>();

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly mockEngine: MockEngineService,
    private readonly mockState: MockStateService,
    private readonly requestLogger: RequestLoggerService,
    @Optional() private readonly apiKeysService?: ApiKeysService
  ) {}

  @All(["m/:slug", "m/:slug/*"])
  async handleMockRequest(@Req() req: Request, @Res() res: Response) {
    const startTime = Date.now();
    const rawSlug = req.params.slug;
    const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug)?.toLowerCase();
    if (!slug) {
      return res.status(404).json({ error: "Missing mock server slug" });
    }

    // 1. Locate project by slug across workspaces
    let project = null;
    if (this.dataStore.isConnectedToPrisma) {
      project = await (this.dataStore as any).prisma.project.findFirst({
        where: { slug },
      });
    } else {
      const allProjects = Array.from((this.dataStore as any).projects.values());
      project = allProjects.find((p: any) => p.slug === slug);
    }

    if (!project) {
      return res.status(404).json({
        error: "Mock Server Not Found",
        message: `No mock project exists with slug '${slug}'`,
      });
    }

    // 2. Paused Project Check (§9.4 & Acceptance Criteria)
    if (project.status === ProjectStatus.PAUSED) {
      const pausedRes = {
        error: "Project Paused",
        message: "This mock server is currently paused in project settings.",
      };
      this.requestLogger.enqueueLog({
        projectId: project.id,
        method: req.method,
        path: req.originalUrl,
        status: 503,
        latencyMs: Date.now() - startTime,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseBody: pausedRes,
      });
      return res.status(503).json(pausedRes);
    }

    // 3. Mock Authentication Gate & Key Validation / Rate Limiting (§6.7 & Acceptance Criteria)
    const rawMockKey =
      req.headers["x-mocklab-key"] ||
      (typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.substring(7)
        : null);
    const mockKey = Array.isArray(rawMockKey) ? rawMockKey[0] : rawMockKey;

    if (project.mockAuth === MockAuth.PRIVATE && !mockKey) {
      const unauthRes = {
        error: "Unauthorized",
        message: "This mock server requires a project API key (X-MockLab-Key header or Bearer token)",
      };
      this.requestLogger.enqueueLog({
        projectId: project.id,
        method: req.method,
        path: req.originalUrl,
        status: 401,
        latencyMs: Date.now() - startTime,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseBody: unauthRes,
      });
      return res.status(401).json(unauthRes);
    }

    let keyVal: any = null;
    if (mockKey && typeof mockKey === "string" && this.apiKeysService) {
      keyVal = await this.apiKeysService.validateAndRateLimit(mockKey);
      if (!keyVal.valid) {
        const unauthRes = {
          error: "Unauthorized",
          message: keyVal.error || "Invalid API key",
        };
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: req.method,
          path: req.originalUrl,
          status: 401,
          latencyMs: Date.now() - startTime,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: unauthRes,
        });
        return res.status(401).json(unauthRes);
      }

      if (keyVal.rateLimited) {
        if (keyVal.resetSec) {
          res.setHeader("Retry-After", keyVal.resetSec.toString());
        }
        const rateLimitRes = {
          error: "Too Many Requests",
          message: keyVal.error || "Rate limit exceeded",
        };
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: req.method,
          path: req.originalUrl,
          status: 429,
          latencyMs: Date.now() - startTime,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: rateLimitRes,
        });
        return res.status(429).json(rateLimitRes);
      }
    }

    // 4. Calculate relative request path within the mock project
    const fullPath = req.originalUrl.split("?")[0];
    const prefix = `/m/${slug}`;
    let mockPath = fullPath.startsWith(prefix) ? fullPath.substring(prefix.length) : fullPath;
    if (!mockPath.startsWith("/")) mockPath = `/${mockPath}`;

    const incoming: IncomingMockRequest = {
      method: req.method.toUpperCase(),
      path: mockPath,
      query: req.query as Record<string, string>,
      headers: req.headers as Record<string, string>,
      body: req.body,
    };

    // Scenario key isolation (§6.5 & §10)
    const rawScenario = (req.headers["x-mocklab-scenario"] as string) || (req.query?._scenario as string) || "default";
    const scenarioKey = rawScenario.trim().toLowerCase();

    // Dynamic Rate Limiting & Counters (§9.3, §10 Done when)
    let limit = 100;
    let remaining = 99;
    let resetSec = 60;

    if (keyVal && keyVal.valid) {
      limit = keyVal.limit || 100;
      remaining = keyVal.remaining ?? 99;
      resetSec = keyVal.resetSec || 60;
    } else {
      const clientIp = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
      const now = Date.now();
      let win = this.publicRateLimitWindows.get(clientIp);
      if (!win || now - win.windowStart >= 60000) {
        win = { windowStart: now, count: 1 };
        this.publicRateLimitWindows.set(clientIp, win);
      } else {
        win.count++;
      }
      limit = 100;
      remaining = Math.max(0, limit - win.count);
      resetSec = Math.max(1, Math.ceil((win.windowStart + 60000 - now) / 1000));

      if (
        win.count > limit &&
        (process.env.NODE_ENV !== "test" || req.headers["x-test-ratelimit"])
      ) {
        res.setHeader("Retry-After", String(resetSec));
        res.setHeader("X-RateLimit-Limit", String(limit));
        res.setHeader("X-RateLimit-Remaining", "0");
        res.setHeader("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + resetSec));
        return res.status(429).json({
          error: "Too Many Requests",
          message: `Public rate limit of ${limit} req/min exceeded`,
        });
      }
    }

    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + resetSec));
    res.setHeader("X-MockLab-Scenario", scenarioKey);

    // 5. Check if this request targets stateful scenarios / buckets (§6.5 & Phase 6)
    const pathSegments = mockPath.split("/").filter(Boolean);
    const resource = pathSegments[0]?.toLowerCase();
    const itemId = pathSegments[1];
    const subAction = pathSegments[2];

    const rules = await this.dataStore.listMockRules(project.id);
    const result = this.mockEngine.evaluate(rules, incoming);

    // Check if a custom non-default rule overrides this request (e.g. injected fault or explicit mock rule)
    const isCustomOverride =
      result.matched &&
      result.rule &&
      !result.rule.generated &&
      (result.rule.response?.fault || result.rule.response?.status >= 400 || (result.rule.priority !== undefined && result.rule.priority < 10));

    // Determine if stateful bucket handling should be used
    const hasBucketFlag =
      result.rule?.response?.stateful === true ||
      req.headers["x-mocklab-bucket"] === "true" ||
      this.mockState.isResourceRegistered(project.id, resource) ||
      (await this.mockState.listItems(project.id, scenarioKey, resource)).length > 0 ||
      (incoming.method === "POST" && (!result.matched || result.rule?.generated));

    if (resource && !isCustomOverride && hasBucketFlag) {
      // 5a. Sub-action transition (e.g. POST /orders/:id/pay)
      if (itemId && subAction && incoming.method === "POST") {
        const scenario = await this.mockState.getScenario(project.id, scenarioKey, "order-lifecycle");
        const matchingTransition = scenario?.transitions.find(
          (t) => t.trigger.toLowerCase().includes(subAction.toLowerCase()) || t.to.toLowerCase() === subAction.toLowerCase()
        );
        const targetState = matchingTransition ? matchingTransition.to : subAction.toLowerCase();

        await this.mockState.transitionScenario(
          project.id,
          scenarioKey,
          scenario?.name || "order-lifecycle",
          targetState,
          `${incoming.method} ${mockPath}`
        );
        await this.mockState.updateItem(project.id, scenarioKey, resource, itemId, { status: targetState });
        res.setHeader("X-MockLab-Rule", `stateful-scenario:${subAction}`);
        const responseData = {
          id: itemId,
          action: subAction,
          state: targetState,
          message: `Order transitioned to ${targetState}`,
        };
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: incoming.method,
          path: incoming.path,
          status: 200,
          matchedRuleId: `stateful-scenario:${subAction}`,
          latencyMs: Date.now() - startTime,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: responseData,
        });
        return res.status(200).json(responseData);
      }

      // 5b. Collection POST: create item with server-generated UUID (never trust body id)
      if (incoming.method === "POST" && !itemId) {
        const item = await this.mockState.createItem(
          project.id,
          scenarioKey,
          resource,
          req.body && typeof req.body === "object" ? req.body : {}
        );
        res.setHeader("X-MockLab-Rule", `stateful-bucket:${resource}:create`);
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: incoming.method,
          path: incoming.path,
          status: 201,
          matchedRuleId: `stateful-bucket:${resource}:create`,
          latencyMs: Date.now() - startTime,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: item,
        });
        return res.status(201).json(item);
      }

      // 5c. Item GET: retrieve single item by id
      if (incoming.method === "GET" && itemId) {
        const item = await this.mockState.getItem(project.id, scenarioKey, resource, itemId);
        if (!item) {
          res.setHeader("X-MockLab-Rule", `stateful-bucket:${resource}:not-found`);
          const errRes = {
            error: "Not Found",
            message: `Item '${itemId}' not found in bucket '${resource}'`,
          };
          this.requestLogger.enqueueLog({
            projectId: project.id,
            method: incoming.method,
            path: incoming.path,
            status: 404,
            matchedRuleId: null,
            latencyMs: Date.now() - startTime,
            requestHeaders: req.headers,
            requestBody: req.body,
            responseBody: errRes,
          });
          return res.status(404).json(errRes);
        }
        res.setHeader("X-MockLab-Rule", `stateful-bucket:${resource}:get`);
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: incoming.method,
          path: incoming.path,
          status: 200,
          matchedRuleId: `stateful-bucket:${resource}:get`,
          latencyMs: Date.now() - startTime,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: item,
        });
        return res.status(200).json(item);
      }

      // 5d. Collection GET: list items
      if (incoming.method === "GET" && !itemId) {
        const items = await this.mockState.listItems(
          project.id,
          scenarioKey,
          resource,
          req.query.q as string
        );
        res.setHeader("X-MockLab-Rule", `stateful-bucket:${resource}:list`);
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: incoming.method,
          path: incoming.path,
          status: 200,
          matchedRuleId: `stateful-bucket:${resource}:list`,
          latencyMs: Date.now() - startTime,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: items,
        });
        return res.status(200).json(items);
      }

      // 5e. Item PUT / PATCH: update item
      if ((incoming.method === "PUT" || incoming.method === "PATCH") && itemId) {
        const updated = await this.mockState.updateItem(
          project.id,
          scenarioKey,
          resource,
          itemId,
          req.body && typeof req.body === "object" ? req.body : {}
        );
        if (!updated) {
          res.setHeader("X-MockLab-Rule", `stateful-bucket:${resource}:not-found`);
          const errRes = {
            error: "Not Found",
            message: `Item '${itemId}' not found in bucket '${resource}'`,
          };
          this.requestLogger.enqueueLog({
            projectId: project.id,
            method: incoming.method,
            path: incoming.path,
            status: 404,
            latencyMs: Date.now() - startTime,
            requestHeaders: req.headers,
            requestBody: req.body,
            responseBody: errRes,
          });
          return res.status(404).json(errRes);
        }
        res.setHeader("X-MockLab-Rule", `stateful-bucket:${resource}:update`);
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: incoming.method,
          path: incoming.path,
          status: 200,
          matchedRuleId: `stateful-bucket:${resource}:update`,
          latencyMs: Date.now() - startTime,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: updated,
        });
        return res.status(200).json(updated);
      }

      // 5f. Item DELETE: remove item
      if (incoming.method === "DELETE" && itemId) {
        const deleted = await this.mockState.deleteItem(project.id, scenarioKey, resource, itemId);
        if (!deleted) {
          res.setHeader("X-MockLab-Rule", `stateful-bucket:${resource}:not-found`);
          const errRes = {
            error: "Not Found",
            message: `Item '${itemId}' not found in bucket '${resource}'`,
          };
          this.requestLogger.enqueueLog({
            projectId: project.id,
            method: incoming.method,
            path: incoming.path,
            status: 404,
            latencyMs: Date.now() - startTime,
            requestHeaders: req.headers,
            requestBody: req.body,
            responseBody: errRes,
          });
          return res.status(404).json(errRes);
        }
        res.setHeader("X-MockLab-Rule", `stateful-bucket:${resource}:delete`);
        const delRes = { success: true, id: itemId, message: `Deleted from ${resource}` };
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: incoming.method,
          path: incoming.path,
          status: 200,
          matchedRuleId: `stateful-bucket:${resource}:delete`,
          latencyMs: Date.now() - startTime,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: delRes,
        });
        return res.status(200).json(delRes);
      }
    }

    // 6. Evaluate Standard Mock Rules Engine
    if (result.matched && result.rule) {
      const rule = result.rule;
      await this.dataStore.updateMockRule(rule.id, { hitCount: rule.hitCount + 1 });

      // Apply Injected Latency (§9.3)
      const latencyMs = rule.response?.latencyMs || 0;
      if (latencyMs > 0) {
        await new Promise((r) => setTimeout(r, Math.min(latencyMs, 5000)));
      }

      // Handle Fault Injection (§9.3)
      if (rule.response?.fault === "empty-body") {
        res.setHeader("X-MockLab-Rule", rule.name);
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: incoming.method,
          path: incoming.path,
          status: rule.response.status || 200,
          matchedRuleId: rule.id,
          latencyMs: Date.now() - startTime,
          injectedMs: latencyMs,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: "",
        });
        return res.status(rule.response.status || 200).send("");
      }

      if (rule.response?.fault === "malformed-json") {
        res.setHeader("X-MockLab-Rule", rule.name);
        res.setHeader("Content-Type", "application/json");
        const brokenJson = '{"broken_json": true, incomplete';
        this.requestLogger.enqueueLog({
          projectId: project.id,
          method: incoming.method,
          path: incoming.path,
          status: rule.response.status || 200,
          matchedRuleId: rule.id,
          latencyMs: Date.now() - startTime,
          injectedMs: latencyMs,
          requestHeaders: req.headers,
          requestBody: req.body,
          responseBody: brokenJson,
        });
        return res.status(rule.response.status || 200).send(brokenJson);
      }

      res.setHeader("X-MockLab-Rule", rule.name);

      // Custom headers from rule
      if (rule.response?.headers && typeof rule.response.headers === "object") {
        for (const [k, v] of Object.entries(rule.response.headers)) {
          res.setHeader(k, String(v));
        }
      }

      const statusCode = rule.response?.status || 200;
      const rawBody = rule.response?.body !== undefined ? rule.response.body : { message: "Mock response" };
      const body = TemplateEngineUtil.render(rawBody, {
        body: req.body,
        query: req.query as Record<string, any>,
        params: result.params,
        headers: req.headers as Record<string, any>,
      });

      this.requestLogger.enqueueLog({
        projectId: project.id,
        method: incoming.method,
        path: incoming.path,
        status: statusCode,
        matchedRuleId: rule.id,
        latencyMs: Date.now() - startTime,
        injectedMs: latencyMs,
        requestHeaders: req.headers,
        requestBody: req.body,
        responseBody: body,
      });

      return res.status(statusCode).json(body);
    }

    // 7. Unmatched Request -> 404 with Near-Miss Report (§2.1 & §9.4)
    res.setHeader("X-MockLab-Rule", "UNMATCHED");
    const unmatchedResponse = {
      error: "Unmatched Request",
      message: `No mock rule matched ${incoming.method} ${incoming.path}`,
      nearMiss: result.nearMiss,
    };

    this.requestLogger.enqueueLog({
      projectId: project.id,
      method: incoming.method,
      path: incoming.path,
      status: 404,
      matchedRuleId: null,
      nearMiss: result.nearMiss,
      latencyMs: Date.now() - startTime,
      requestHeaders: req.headers,
      requestBody: req.body,
      responseBody: unmatchedResponse,
    });

    return res.status(404).json(unmatchedResponse);
  }
}
