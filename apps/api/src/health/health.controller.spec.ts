import { describe, it, expect, vi } from "vitest";
import { HealthController } from "./health.controller";
import { PrismaService } from "../prisma/prisma.service";

describe("HealthController", () => {
  it("returns ok status and service reports", async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    } as unknown as PrismaService;

    const controller = new HealthController(mockPrisma);
    const mockRes = { status: vi.fn() };
    const result = await controller.check(mockRes as any);

    expect(result.status).toBeDefined();
    expect(result.version).toBe("0.2.1");
    expect(result.services).toBeDefined();
    expect(result.services.database).toBeDefined();
    expect(result.services.redis).toBeDefined();
  });

  it("returns HTTP 503 and degraded status when database is failing", async () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/mocklab";
    const mockPrisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("DB connection failure")),
    } as unknown as PrismaService;

    const controller = new HealthController(mockPrisma);
    const mockRes = { status: vi.fn() };
    const result = await controller.check(mockRes as any);

    expect(result.status).toBe("degraded");
    expect(result.services.database).toBe("offline");
    expect(mockRes.status).toHaveBeenCalledWith(503);
    delete process.env.DATABASE_URL;
  });
});
