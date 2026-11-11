import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const userId = `usr_${email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`;
    const wsId = "ws_default";
    const wsName = "Default Workspace";
    const wsSlug = "default";

    // Generate lightweight mock JWT token
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        email,
        workspaceId: wsId,
        role: "OWNER",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      })
    ).toString("base64url");
    const token = `${header}.${payload}.sig_${Date.now().toString(36)}`;

    return NextResponse.json(
      {
        token,
        user: {
          id: userId,
          email,
          name: email.split("@")[0],
          avatarUrl: null,
        },
        workspace: {
          id: wsId,
          name: wsName,
          slug: wsSlug,
          plan: "FREE",
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { message: (err as Error).message || "Login failed" },
      { status: 500 }
    );
  }
}
