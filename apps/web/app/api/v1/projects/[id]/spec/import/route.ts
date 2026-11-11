import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { rawSpec, sourceUrl } = body;

    if (!rawSpec && !sourceUrl) {
      return NextResponse.json(
        { message: "Either rawSpec or sourceUrl must be provided" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      project: {
        id,
        slug: id,
        name: id === "petstore" ? "Petstore Demo" : id,
      },
      diff: {
        added: [
          "GET /pets",
          "POST /pets",
          "GET /pets/{petId}",
          "PUT /pets/{petId}",
          "DELETE /pets/{petId}",
        ],
        changed: [],
        removed: [],
        conflicts: [],
      },
      specVersion: {
        id: `spec_${Date.now()}`,
        version: 1,
        importedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: (err as Error).message || "Import failed" },
      { status: 500 }
    );
  }
}
