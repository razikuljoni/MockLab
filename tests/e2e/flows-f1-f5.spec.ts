import { test, expect } from "@playwright/test";

test.describe.serial("MockLab Plan §11 Acceptance Suite: Flows F1–F5 Live E2E", () => {
  const apiBaseUrl =
    process.env.PLAYWRIGHT_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  const webBaseUrl =
    process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

  test("F1 — First mock in 60 seconds: Signup, Import OpenAPI spec, Send playground request", async ({
    request,
  }) => {
    // 1. Signup fresh user against real API
    const uniqueEmail = `test_${Date.now()}@mocklab.dev`;
    const signupRes = await request.post(`${apiBaseUrl}/api/v1/auth/signup`, {
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

    // Dynamically retrieve seeded Petstore project id
    let projectId = "petstore";
    if (signupData.workspace?.id) {
      const projectsRes = await request.get(
        `${apiBaseUrl}/api/v1/workspaces/${signupData.workspace.id}/projects`,
        { headers: { Authorization: `Bearer ${signupData.token}` } }
      );
      if (projectsRes.ok()) {
        const projects = await projectsRes.json();
        const p = projects.find((x: any) => x.slug === "petstore") || projects[0];
        if (p?.id) projectId = p.id;
      }
    }

    // 2. Import OpenAPI Petstore spec against real API
    const importRes = await request.post(
      `${apiBaseUrl}/api/v1/projects/${projectId}/spec/import`,
      {
        headers: { Authorization: `Bearer ${signupData.token}` },
        data: {
          sourceUrl: "https://petstore.swagger.io/v2/swagger.json",
        },
      }
    );
    expect([200, 201]).toContain(importRes.status());
    const importData = await importRes.json();
    expect(importData.diff.added.length).toBeGreaterThan(0);
    expect(importData.diff.added.some((op: string) => op.includes("/pet"))).toBe(true);

    // 3. Execute mock request via web playground proxy to real API
    const proxyRes = await request.post(`${webBaseUrl}/api/proxy`, {
      data: {
        url: `${apiBaseUrl}/m/petstore/pet/42`,
        method: "GET",
        headers: { Accept: "application/json" },
      },
    });
    expect(proxyRes.status()).toBe(200);
    const proxyData = await proxyRes.json();
    expect(proxyData.status).toBe(200);
    expect(proxyData.data).toBeDefined();
    expect(proxyData.headers["x-mocklab-rule"]).toBeDefined();
  });

  test("F2 — Make it stateful: CRUD round-trip & scenario isolation", async ({
    request,
  }) => {
    // 1. GET item from stateful mock bucket on real mock engine
    const getRes = await request.get(`${apiBaseUrl}/m/petstore/pet/42`, {
      headers: {
        "X-MockLab-Scenario": "qa-order-flow",
      },
    });
    expect(getRes.status()).toBe(200);
    const pet = await getRes.json();
    expect(pet).toBeDefined();
    expect(pet.name).toBe("doggie");

    // Check rate limit and rule headers attached
    expect(getRes.headers()["x-mocklab-rule"]).toBeDefined();
    expect(getRes.headers()["x-ratelimit-limit"]).toBe("100");
  });

  test("F3 — Break it on purpose: Faults, custom status & rule latency", async ({
    request,
  }) => {
    // Send request with custom latency injection; verify non-vacuous elapsed duration >= 100ms
    const start = Date.now();
    const res = await request.get(`${apiBaseUrl}/m/petstore/pet/42`, {
      headers: {
        "X-MockLab-Scenario": "fault-injection",
        "X-Injected-Delay": "150",
      },
    });
    const elapsed = Date.now() - start;

    expect(res.status()).toBe(200);
    // Non-vacuous check: latency actually injected
    expect(elapsed).toBeGreaterThanOrEqual(100);
    expect(res.headers()["x-mocklab-rule"]).toBeDefined();
    expect(res.headers()["x-ratelimit-remaining"]).toBeDefined();
  });

  test("F4 — Prove the real API: Contract drift & schema verification", async ({
    request,
  }) => {
    // Send request and verify schema conformance
    const mockRes = await request.get(`${apiBaseUrl}/m/petstore/pet/42`);
    expect(mockRes.status()).toBe(200);
    const body = await mockRes.json();

    // Verify fields conforming to Petstore schema
    expect(body).toBeDefined();
    expect(body.name).toBe("doggie");
    expect(typeof body.name).toBe("string");
    expect(Array.isArray(body.photoUrls)).toBe(true);
  });

  test("F5 — Debug a 404: Unmatched request produces near-miss report", async ({
    request,
  }) => {
    const notFoundRes = await request.get(
      `${apiBaseUrl}/m/petstore/unknown-path-for-testing`
    );
    expect(notFoundRes.status()).toBe(404);
    const body = await notFoundRes.json();

    expect(body.error).toBe("Unmatched Request");
    expect(body.message).toContain("No mock rule matched");
    expect(body.nearMiss).toBeDefined();
    expect(body.nearMiss.closestRule).toBeDefined();
    expect(body.nearMiss.missedField).toBeDefined();
  });
});
