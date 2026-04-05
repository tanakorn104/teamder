import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest){
  const { pathname } = request.nextUrl;

  // 1. หน้าที่ "อนุญาต" ให้เข้าได้โดยไม่ต้อง Login (Public Routes)
  const isPublicRoute = 
    pathname === "/auth" || 
    pathname.startsWith("/api/auth") || // ต้องปล่อยให้ API Auth ทำงานได้
    pathname.startsWith("/_next") || 
    pathname.startsWith("/static") || 
    pathname.includes("favicon.ico");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("teamder_access_token")?.value;
  const refreshToken = request.cookies.get("teamder_refresh_token")?.value;

  // 2. ถ้าไม่มี Access Token แต่มี Refresh Token -> พยายาม Refresh
  if (!accessToken && refreshToken) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID_AUTH!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET_AUTH!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        const nextResponse = NextResponse.next();
        nextResponse.cookies.set("teamder_access_token", data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: data.expires_in,
          path: "/",
        });
        return nextResponse;
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  // 3. หัวใจสำคัญ: ถ้าไม่มีทั้ง Access และ Refresh Token
  // และไม่ใช่หน้า Public (ซึ่งเราเช็กไปแล้วด้านบน) -> ต้องไป Login เท่านั้น
  if (!accessToken && !refreshToken) {
    // ป้องกันการวนลูป: เช็กอีกทีว่าไม่ใช่หน้า login
    if (pathname !== "/auth") {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // รัน Middleware ในทุกหน้ายกเว้นไฟล์ static
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};