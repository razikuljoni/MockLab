import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, workspaceName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const userId = `usr_${Date.now().toString(36)}`;
    const wsId = `ws_${Date.now().toString(36)}`;
    const wsName = workspaceName || `${(name || email.split("@")[0])}'s Workspace`;
    const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "workspace";

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
          name: name || email.split("@")[0],
          avatarUrl: null,
        },
        workspace: {
          id: wsId,
          name: wsName,
          slug: wsSlug,
          plan: "FREE",
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { message: (err as Error).message || "Signup failed" },
      { status: 500 }
    );
  }
}
