import { describe, it, expect, vi } from "vitest";
import { HealthController } from "./health.controller";
import { PrismaService } from "../prisma/prisma.service";

describe("HealthController", () => {
  it("returns ok status and service reports", async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    } as unknown as PrismaService;

    const controller = new HealthController(mockPrisma);
    const result = await controller.check();

    expect(result.status).toBe("ok");
    expect(result.version).toBe("0.1.0");
    expect(result.services).toBeDefined();
  });
});
