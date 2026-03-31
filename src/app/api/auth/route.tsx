// src/app/api/auth/google/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID_AUTH!,
    redirect_uri: process.env.GOOGLE_RedirectCallBackURL_AUTH!,
    response_type: "code",
    scope: "profile email",
    access_type: "offline",
    prompt: "consent",
  });

  // สำหรับ Route Handler (API) เราใช้ NextResponse.redirect
  return NextResponse.redirect(`${rootUrl}?${params.toString()}`);
}