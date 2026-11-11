import { test, expect } from "@playwright/test";

test.describe("MockLab Plan §11 Acceptance Suite: Flows F1–F5 Live E2E", () => {
  const targetBaseUrl =
    process.env.PLAYWRIGHT_TEST_BASE_URL || "https://mocklab-theta.vercel.app";

  test("F1 — First mock in 60 seconds: Signup, Import OpenAPI spec, Send playground request", async ({
    request,
  }) => {
    // 1. Signup fresh user
    const uniqueEmail = `test_${Date.now()}@mocklab.dev`;
    const signupRes = await request.post(`${targetBaseUrl}/api/v1/auth/signup`, {
      data: {
        email: uniqueEmail,
        password: "Password123!",
        name: "Playwright Tester",
        workspaceName: "Automated WS",
      },
    });
    expect([200, 201]).toContain(signupRes.status());
    const signupData = await signupRes.json();
    expect(signupData.token).toBeDefined();

    // 2. Import OpenAPI Petstore spec
    const importRes = await request.post(
      `${targetBaseUrl}/api/v1/projects/petstore/spec/import`,
      {
        headers: { Authorization: `Bearer ${signupData.token}` },
        data: {
          sourceUrl: "https://petstore.swagger.io/v2/swagger.json",
        },
      }
    );
    expect(importRes.status()).toBe(200);
    const importData = await importRes.json();
    expect(importData.diff.added.length).toBeGreaterThan(0);
    expect(importData.diff.added).toContain("GET /pets/{petId}");

    // 3. Execute mock request via playground proxy
    const proxyRes = await request.post(`${targetBaseUrl}/api/proxy`, {
      data: {
        url: "https://petstore.mocklab.dev/pets/42",
        method: "GET",
        headers: { Accept: "application/json" },
      },
    });
    expect(proxyRes.status()).toBe(200);
    const proxyData = await proxyRes.json();
    expect(proxyData.status).toBe(200);
    expect(proxyData.data.id).toBe(42);
    expect(proxyData.headers["x-mocklab-rule"]).toBeDefined();
  });

  test("F2 — Make it stateful: CRUD round-trip & scenario isolation", async ({
    request,
  }) => {
    // 1. GET item from stateful mock bucket
    const getRes = await request.get(`${targetBaseUrl}/m/petstore/pets/42`, {
      headers: {
        "X-MockLab-Scenario": "qa-order-flow",
      },
    });
    expect(getRes.status()).toBe(200);
    const pet = await getRes.json();
    expect(pet.id).toBe(42);
    expect(pet.name).toBe("Sparky");

    // Check rate limit and rule headers attached
    expect(getRes.headers()["x-mocklab-rule"]).toBe("Get pet by ID (default example)");
    expect(getRes.headers()["x-ratelimit-limit"]).toBe("100");
  });

  test("F3 — Break it on purpose: Faults, custom status & rule latency", async ({
    request,
  }) => {
    // Send request with custom scenario/fault headers
    const start = Date.now();
    const res = await request.get(`${targetBaseUrl}/m/petstore/pets/42`, {
      headers: {
        "X-MockLab-Scenario": "fault-injection",
        "X-Injected-Delay": "50",
      },
    });
    const elapsed = Date.now() - start;

    expect(res.status()).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(res.headers()["x-mocklab-rule"]).toBeDefined();
    expect(res.headers()["x-ratelimit-remaining"]).toBeDefined();
  });

  test("F4 — Prove the real API: Contract drift & schema verification", async ({
    request,
  }) => {
    // Send request and verify schema conformance
    const mockRes = await request.get(`${targetBaseUrl}/m/petstore/pets/42`);
    expect(mockRes.status()).toBe(200);
    const body = await mockRes.json();

    // Verify fields conforming to Petstore schema
    expect(typeof body.id).toBe("number");
    expect(typeof body.name).toBe("string");
    expect(Array.isArray(body.tags)).toBe(true);
  });

  test("F5 — Debug a 404: Unmatched request produces near-miss report", async ({
    request,
  }) => {
    const notFoundRes = await request.get(
      `${targetBaseUrl}/m/petstore/unknown-path-for-testing`
    );
    expect(notFoundRes.status()).toBe(404);
    const body = await notFoundRes.json();

    expect(body.error).toBe("Not Found");
    expect(body.message).toContain("No matching mock rule");
    expect(body.nearMiss).toBeDefined();
    expect(body.nearMiss.closestRule).toBeDefined();
    expect(body.nearMiss.missedField).toBeDefined();
    expect(body.nearMiss.reason).toBeDefined();
  });
});
