import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REALM = "mtf";

export function proxy(request: NextRequest) {
  const expectedPassword = process.env.APP_PASSWORD;
  if (!expectedPassword) return NextResponse.next();

  const expectedUser = process.env.APP_USER ?? "mtf";
  const header = request.headers.get("authorization");
  if (header && verifyBasicAuth(header, expectedUser, expectedPassword)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

function verifyBasicAuth(header: string, user: string, password: string): boolean {
  if (!header.toLowerCase().startsWith("basic ")) return false;
  let decoded = "";
  try {
    decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  return (
    safeEqual(decoded.slice(0, sep), user) &&
    safeEqual(decoded.slice(sep + 1), password)
  );
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
