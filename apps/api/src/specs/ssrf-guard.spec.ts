import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SpecsService } from "./specs.service";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";

describe("OpenAPI Spec Import SSRF Guard Suite", () => {
  let specsService: SpecsService;
  let dataStore: DataStoreService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    dataStore = new DataStoreService({} as PrismaService);
    dataStore.clear();
    specsService = new SpecsService(dataStore);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("blocks non-http/https protocols", async () => {
    await expect(specsService.fetchSpecFromUrl("file:///etc/passwd")).rejects.toThrow(
      BadRequestException
    );
    await expect(specsService.fetchSpecFromUrl("ftp://ftp.example.com/spec.yaml")).rejects.toThrow(
      BadRequestException
    );
  });

  it("blocks loopback, localhost, and metadata IPs", async () => {
    await expect(specsService.fetchSpecFromUrl("http://localhost:3000/spec.json")).rejects.toThrow(
      BadRequestException
    );
    await expect(specsService.fetchSpecFromUrl("http://127.0.0.1:8080/spec.yaml")).rejects.toThrow(
      BadRequestException
    );
    await expect(specsService.fetchSpecFromUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      BadRequestException
    );
    await expect(specsService.fetchSpecFromUrl("http://0.0.0.0/spec")).rejects.toThrow(
      BadRequestException
    );
  });

  it("blocks private network CIDR addresses", async () => {
    await expect(specsService.fetchSpecFromUrl("http://10.0.1.20/spec.json")).rejects.toThrow(
      BadRequestException
    );
    await expect(specsService.fetchSpecFromUrl("http://192.168.1.1/swagger.json")).rejects.toThrow(
      BadRequestException
    );
    await expect(specsService.fetchSpecFromUrl("http://172.16.0.5/api-docs")).rejects.toThrow(
      BadRequestException
    );
  });

  it("successfully fetches valid public spec within 5MB limit", async () => {
    const validSpec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Remote Test API", version: "1.0.0" },
      paths: {},
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-length": String(validSpec.length) }),
      text: () => Promise.resolve(validSpec),
    } as Response);

    const result = await specsService.fetchSpecFromUrl("https://petstore.swagger.io/v2/swagger.json");
    expect(result).toBe(validSpec);
  });

  it("rejects spec that exceeds 5MB limit", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-length": String(6 * 1024 * 1024) }),
      text: () => Promise.resolve("huge payload"),
    } as Response);

    await expect(
      specsService.fetchSpecFromUrl("https://example.com/oversized-spec.json")
    ).rejects.toThrow(BadRequestException);
  });
});
