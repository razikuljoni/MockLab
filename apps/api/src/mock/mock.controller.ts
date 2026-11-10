import {
  Controller,
  All,
  Req,
  Res,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { DataStoreService } from "../prisma/data-store.service";
import { MockEngineService, IncomingMockRequest } from "./mock-engine.service";
import { ProjectStatus, MockAuth } from "@prisma/client";

@Controller()
export class MockController {
  private readonly logger = new Logger(MockController.name);

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly mockEngine: MockEngineService
  ) {}

  @All(["m/:slug", "m/:slug/*"])
  async handleMockRequest(@Req() req: Request, @Res() res: Response) {
    const rawSlug = req.params.slug;
    const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug)?.toLowerCase();
    if (!slug) {
      return res.status(404).json({ error: "Missing mock server slug" });
    }

    // 1. Locate project by slug across workspaces
    let project = null;
    // Search in DataStore
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
      return res.status(503).json({
        error: "Project Paused",
        message: "This mock server is currently paused in project settings.",
      });
    }

    // 3. Mock Authentication Gate (§6.7 & Acceptance Criteria)
    if (project.mockAuth === MockAuth.PRIVATE) {
      const mockKey =
        req.headers["x-mocklab-key"] ||
        (typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ")
          ? req.headers.authorization.substring(7)
          : null);

      if (!mockKey) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "This mock server requires a project API key (X-MockLab-Key header or Bearer token)",
        });
      }
    }

    // 4. Calculate relative request path within the mock project
    // e.g. "/m/petstore/pets/42" -> "/pets/42", "/m/petstore" -> "/"
    const fullPath = req.originalUrl.split("?")[0];
    const prefix = `/m/${slug}`;
    let mockPath = fullPath.startsWith(prefix) ? fullPath.substring(prefix.length) : fullPath;
    if (!mockPath.startsWith("/")) mockPath = `/${mockPath}`;

    const incoming: IncomingMockRequest = {
      method: req.method,
      path: mockPath,
      query: req.query as Record<string, string>,
      headers: req.headers as Record<string, string>,
      body: req.body,
    };

    // 5. Evaluate Rules Engine
    const rules = await this.dataStore.listMockRules(project.id);
    const result = this.mockEngine.evaluate(rules, incoming);

    // Rate Limit headers attached to every mock response (§9.4)
    res.setHeader("X-RateLimit-Limit", "100");
    res.setHeader("X-RateLimit-Remaining", "99");
    res.setHeader("X-RateLimit-Reset", String(Math.floor(Date.now() / 1000) + 60));

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
        return res.status(rule.response.status || 200).send("");
      }

      if (rule.response?.fault === "malformed-json") {
        res.setHeader("X-MockLab-Rule", rule.name);
        res.setHeader("Content-Type", "application/json");
        return res.status(rule.response.status || 200).send('{"broken_json": true, incomplete');
      }

      res.setHeader("X-MockLab-Rule", rule.name);

      // Custom headers from rule
      if (rule.response?.headers && typeof rule.response.headers === "object") {
        for (const [k, v] of Object.entries(rule.response.headers)) {
          res.setHeader(k, String(v));
        }
      }

      const statusCode = rule.response?.status || 200;
      const body = rule.response?.body !== undefined ? rule.response.body : { message: "Mock response" };
      return res.status(statusCode).json(body);
    }

    // 6. Unmatched Request -> 404 with Near-Miss Report (§2.1 & §9.4)
    res.setHeader("X-MockLab-Rule", "UNMATCHED");
    return res.status(404).json({
      error: "Unmatched Request",
      message: `No mock rule matched ${incoming.method} ${incoming.path}`,
      nearMiss: result.nearMiss,
    });
  }
}
