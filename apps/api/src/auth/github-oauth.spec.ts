import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthService } from "./auth.service";
import { DataStoreService } from "../prisma/data-store.service";
import { PrismaService } from "../prisma/prisma.service";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";

describe("GitHub OAuth Flow Suite", () => {
  let authService: AuthService;
  let dataStore: DataStoreService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    const mockPrisma = {} as PrismaService;
    dataStore = new DataStoreService(mockPrisma);
    dataStore.clear();
    authService = new AuthService(dataStore);

    process.env.GITHUB_CLIENT_ID = "test-client-id";
    process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    vi.restoreAllMocks();
  });

  it("throws BadRequestException if GITHUB_CLIENT_ID or SECRET is missing", async () => {
    delete process.env.GITHUB_CLIENT_ID;
    await expect(authService.loginWithGitHub("sample-code")).rejects.toThrow(
      BadRequestException
    );
  });

  it("exchanges code, retrieves profile, creates new user and workspace", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("github.com/login/oauth/access_token")) {
        return Promise.resolve({
          json: () => Promise.resolve({ access_token: "gho_mock_access_token_123" }),
        } as Response);
      }
      if (url.includes("api.github.com/user/emails")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { email: "github.dev@example.com", primary: true, verified: true },
            ]),
        } as Response);
      }
      if (url.includes("api.github.com/user")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              login: "octocat",
              name: "The Octocat",
              avatar_url: "https://avatars.githubusercontent.com/u/583231",
              email: null,
            }),
        } as Response);
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    const result = await authService.loginWithGitHub("valid-auth-code");
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("github.dev@example.com");
    expect(result.user.name).toBe("The Octocat");
    expect(result.workspaces.length).toBe(1);
    expect(result.workspaces[0].name).toContain("Octocat");
  });

  it("links existing user with matching email rather than duplicating", async () => {
    await dataStore.createUser({
      email: "existing@example.com",
      name: "Existing User",
    });

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("access_token")) {
        return Promise.resolve({
          json: () => Promise.resolve({ access_token: "gho_mock_token" }),
        } as Response);
      }
      if (url.includes("api.github.com/user")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              login: "existinguser",
              name: "Existing User",
              email: "existing@example.com",
            }),
        } as Response);
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    const result = await authService.loginWithGitHub("valid-code");
    expect(result.user.email).toBe("existing@example.com");
  });

  it("throws UnauthorizedException if token exchange fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ error: "bad_verification_code" }),
    } as Response);

    await expect(authService.loginWithGitHub("bad-code")).rejects.toThrow(
      UnauthorizedException
    );
  });
});
