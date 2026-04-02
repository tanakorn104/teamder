import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import qs from "qs";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const error = searchParams.get("error");
    const code = searchParams.get("code");

    // 1. ตรวจสอบ Error กรณีผู้ใช้ปฏิเสธการเข้าถึง
    if (error === "access_denied") {
        return NextResponse.redirect(`${process.env.CLIENT_ORIGIN}/login`);
    }

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    try {
        // 2. แลกเปลี่ยน code เป็น token จาก Google
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            qs.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID_AUTH,
                client_secret: process.env.GOOGLE_CLIENT_SECRET_AUTH,
                redirect_uri: process.env.GOOGLE_RedirectCallBackURL_AUTH,
                grant_type: "authorization_code",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;
        const baseUrl = process.env.CLIENT_ORIGIN || request.nextUrl.origin;

        // 3. นำ Token ไปให้ /api/auth/me จัดการ (ใช้ fetch เพื่อเลี่ยงปัญหา Axios localhost)
        const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${access_token}`
            }
        });

        if (!meResponse.ok) {
            const errText = await meResponse.text();
            throw new Error(`Failed to fetch /auth/me: ${errText}`);
        }

        const meData = await meResponse.json();
        
        // 4. เช็ค Role จาก Database ที่ /auth/me ส่งกลับมา
        const userRole = meData.user?.primary_role;
        const redirectPath = userRole === 'New Member' ? "/complete-profile" : "/";

        // 5. ตั้งค่าการ Redirect และฝัง Cookie
        const response = NextResponse.redirect(new URL(redirectPath, baseUrl));
        const isProduction = process.env.NODE_ENV === "production";

        response.cookies.set("teamder_access_token", access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 60 * 60, // 1 ชั่วโมง
            path: "/",
        });

        if (refresh_token) {
            response.cookies.set("teamder_refresh_token", refresh_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60, // 30 วัน
                path: "/",
            });
        }

        return response;

    } catch (err: any) {
        // Log Error แบบละเอียดลง Terminal ของ VS Code
        console.error("🚨 OAuth Callback Error:", err.response?.data || err.message);
        
        // ส่ง Error กลับไปที่หน้าจอ (พร้อมรายละเอียด จะได้รู้ว่าพังตรงไหน)
        return NextResponse.json({ 
            error: "Authentication failed", 
            details: err.response?.data || err.message 
        }, { status: 500 });
    }
}