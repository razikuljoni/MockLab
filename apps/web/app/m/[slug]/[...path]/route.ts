import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    slug: string;
    path: string[];
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  return handleMockRequest("GET", req, await params);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return handleMockRequest("POST", req, await params);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return handleMockRequest("PUT", req, await params);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return handleMockRequest("PATCH", req, await params);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return handleMockRequest("DELETE", req, await params);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    },
  });
}

function handleMockRequest(
  method: string,
  req: NextRequest,
  params: { slug: string; path: string[] }
) {
  const { slug, path } = params;
  const subPath = `/${path.join("/")}`;

  // 1. Matched rule for Petstore Pet by ID
  if (method === "GET" && (subPath === "/pets/42" || subPath === "/pets/1")) {
    return NextResponse.json(
      {
        id: 42,
        name: "Sparky",
        category: "Canine",
        status: "available",
        tags: ["friendly", "vaccinated"],
        _mocklab: {
          project: slug,
          rule: "Get pet by ID (default example)",
          scenario: "initial",
          latency: "42ms",
        },
      },
      {
        status: 200,
        headers: {
          "X-MockLab-Rule": "Get pet by ID (default example)",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "99",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 2. Matched rule for Petstore List Pets
  if (method === "GET" && subPath === "/pets") {
    return NextResponse.json(
      [
        { id: 1, name: "Bella", status: "available" },
        { id: 2, name: "Max", status: "pending" },
        { id: 42, name: "Sparky", status: "available" },
      ],
      {
        status: 200,
        headers: {
          "X-MockLab-Rule": "List all pets",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "99",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 3. Matched rule for Petstore Create Pet
  if (method === "POST" && subPath === "/pets") {
    return NextResponse.json(
      {
        id: Math.floor(Math.random() * 1000) + 100,
        name: "New Pet",
        status: "available",
        _mocklab: {
          project: slug,
          rule: "Create pet (stateful bucket)",
        },
      },
      {
        status: 201,
        headers: {
          "X-MockLab-Rule": "Create pet (stateful bucket)",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 4. Near-miss 404 response (§6.2 / §10)
  return NextResponse.json(
    {
      error: "Not Found",
      message: `No matching mock rule found on server '${slug}'`,
      nearMiss: {
        closestRule: "Get pet by ID",
        operationId: "GET /pets/{petId}",
        missedField: "path",
        reason: `Path mismatch: received '${subPath}', expected /pets/{petId}`,
      },
      request: {
        method,
        path: subPath,
      },
    },
    {
      status: 404,
      headers: {
        "X-MockLab-NearMiss": "true",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
