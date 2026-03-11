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
        // 2. แลกเปลี่ยน code เป็น token
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            qs.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID_AUTH,
                client_secret: process.env.GOOGLE_CLIENT_SECRET_AUTH,
                redirect_uri: process.env.GOOGLE_RedirectCallBackURL_AUTH, // ต้องตรงกับที่ตั้งไว้ใน Google Console
                grant_type: "authorization_code",
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;
        
        // 3. เรียกใช้ฟังก์ชันตรวจสอบ token และดึงโปรไฟล์ (สมมติว่าคุณมีฟังก์ชันเหล่านี้อยู่แล้ว)
        // const { expires_in } = await checktoken(access_token);
        // const profile = await getUserProfile(access_token);


        // 4. จัดการเรื่อง Session หรือ Cookie ตรงนี้ (ถ้ามี)

        const isProduction = process.env.NODE_ENV === "production";

        const response = NextResponse.redirect(new URL("/", request.url));
        // 2. ส่ง Cookie ตัวแรก: Access Token (กุญแจดอกเล็ก - อายุสั้น)
        response.cookies.set("teamder_access_token", access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 60 * 60, // 1 ชั่วโมง
            path: "/",
        });

        // 3. ส่ง Cookie ตัวที่สอง: Refresh Token (กุญแจสำรอง - อายุยาว)
        response.cookies.set("teamder_refresh_token", refresh_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60, // 30 วัน
            path: "/",
        });

        // 5. Redirect ไปยังหน้า Dashboard หรือหน้าที่ต้องการ


        // ตัวอย่างการเซ็ต Cookie (ถ้าไม่ได้ใช้ NextAuth)
        // response.cookies.set("auth_token", access_token, { httpOnly: true });

        return response;

    } catch (err: any) {
        console.error("OAuth Error:", err.response?.data || err.message);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}