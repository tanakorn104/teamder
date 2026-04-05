import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import qs from "qs";
import { db } from "@/lib/db"; // นำเข้าตัวเชื่อมต่อ Database

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const error = searchParams.get("error");
    const code = searchParams.get("code");

    if (error === "access_denied") {
        return NextResponse.redirect(`${process.env.CLIENT_ORIGIN}/login`);
    }

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    let connection; // เตรียมตัวแปรสำหรับ DB Connection

    try {
        // 1. แลกเปลี่ยน code เป็น token จาก Google
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            qs.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID_AUTH,
                client_secret: process.env.GOOGLE_CLIENT_SECRET_AUTH,
                redirect_uri: process.env.GOOGLE_RedirectCallBackURL_AUTH,
                grant_type: "authorization_code",
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token, refresh_token } = tokenResponse.data;
        const baseUrl = process.env.CLIENT_ORIGIN || request.nextUrl.origin;

        // 2. ดึงข้อมูล User จาก /api/auth/me
        const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${access_token}` }
        });

        if (!meResponse.ok) {
            throw new Error(`Failed to fetch /auth/me`);
        }

        const meData = await meResponse.json();
        const userId = meData.user?.id; // ดึง User ID มาใช้เช็ค DB

        // --- ส่วนที่เพิ่มเข้ามา: เช็คว่าเคยทำแบบทดสอบ (user_ai_features) หรือยัง ---
        let redirectPath = "/"; // ค่าเริ่มต้นคือหน้าแรก
        
        if (userId) {
            connection = await db();
            // เช็คว่ามีข้อมูลในตาราง user_ai_features หรือไม่
            const [aiFeatures]: any = await connection.execute(
                "SELECT id FROM user_ai_features WHERE user_id_ref = ? LIMIT 1",
                [userId]
            );

            if (aiFeatures.length === 0) {
                // ถ้ายังไม่มีข้อมูล (ยังไม่เคยทำแบบทดสอบ) ให้ไปหน้า /prsnasmt
                redirectPath = "/prsnasmt";
            } else {
                // ถ้ามีแล้ว ให้ไปหน้าแรก /
                redirectPath = "/";
            }
        }
        // ------------------------------------------------------------------

        // 3. ตั้งค่าการ Redirect และฝัง Cookie
        const response = NextResponse.redirect(new URL(redirectPath, baseUrl));
        const isProduction = process.env.NODE_ENV === "production";

        response.cookies.set("teamder_access_token", access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 60 * 60, 
            path: "/",
        });

        if (refresh_token) {
            response.cookies.set("teamder_refresh_token", refresh_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60,
                path: "/",
            });
        }

        return response;

    } catch (err: any) {
        console.error("🚨 OAuth Callback Error:", err.message);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    } finally {
        if (connection) await connection.end(); // ปิดการเชื่อมต่อ DB
    }
}