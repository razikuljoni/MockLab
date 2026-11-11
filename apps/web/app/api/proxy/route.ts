import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { method, url, headers, body } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing destination URL" }, { status: 400 });
    }

    // Resolve localhost / internal API mapping if needed
    let targetUrl = url;
    if (targetUrl.includes(".mocklab.dev")) {
      // Route through mock engine (Render API, local dev, or origin)
      const slugMatch = targetUrl.match(/https?:\/\/([^.]+)\.mocklab\.dev(.*)/);
      if (slugMatch) {
        const slug = slugMatch[1];
        const restPath = slugMatch[2] || "";
        const host = req.headers.get("host") || "127.0.0.1:3001";
        const proto = req.headers.get("x-forwarded-proto") || "http";
        const origin = `${proto}://${host}`;
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.API_URL ||
          origin;
        targetUrl = `${apiBase.replace(/\/+$/, "")}/m/${slug}${restPath}`;
      }
    }

    const startTime = Date.now();
    let ttfb = 0;

    const requestHeaders = new Headers(headers || {});
    if (!requestHeaders.has("User-Agent")) {
      requestHeaders.set("User-Agent", "MockLab-Playground/1.0");
    }

    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: requestHeaders,
    };

    if (body && method !== "GET" && method !== "HEAD") {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    ttfb = Date.now() - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key.toLowerCase()] = val;
    });

    let responseData: any;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    const totalDuration = Date.now() - startTime;

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      durationMs: totalDuration,
      ttfbMs: ttfb,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Proxy Request Failed",
        message: err.message || "Failed to reach target host",
      },
      { status: 502 }
    );
  }
}
