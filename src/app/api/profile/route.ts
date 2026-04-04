import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    let connection;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("teamder_access_token")?.value;

        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. ดึงข้อมูลจาก /me (ตอนนี้ /me จัดการสร้าง User และส่ง id กลับมาให้แล้ว)
        const baseUrl = new URL(req.url).origin;
        const authRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { "Cookie": `teamder_access_token=${token}` }
        });

        if (!authRes.ok) return NextResponse.json({ error: "Auth failed" }, { status: 401 });
        
        const data = await authRes.json();
        const user = data.user; 

        // เช็คให้ชัวร์ว่าได้ id (INT) มาจริงๆ
        if (!user || !user.id) {
            console.error("❌ /me did not return an ID:", data);
            return NextResponse.json({ error: "User ID Missing" }, { status: 400 });
        }

        const internalId = user.id; // ใช้ตัวนี้เป็น user_id_ref ได้เลย

        // 2. รับข้อมูลจากหน้า Profile (Frontend)
        const body = await req.json();
        const { 
            primary_role, 
            province, 
            district, 
            user_description, 
            profile_image, 
            institution_id 
        } = body;

        connection = await db();

        // 3. จัดการตาราง user_profiles (Table: user_profiles)
        // ใช้ ON DUPLICATE KEY UPDATE ตาม ER Diagram 
        const profileSql = `
            INSERT INTO user_profiles 
            (user_id_ref, institution_id, primary_role, province, district, user_description, profile_image)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            institution_id = VALUES(institution_id),
            primary_role = VALUES(primary_role),
            province = VALUES(province),
            district = VALUES(district),
            user_description = VALUES(user_description),
            profile_image = VALUES(profile_image)
        `;

        await connection.execute(profileSql, [
            internalId,            // user_id_ref (INT)
            institution_id || 1,   // institution_id (INT) - Default 1 ป้องกัน Foreign Key Error
            primary_role || 'Member', 
            province || null,      
            district || null,      
            user_description || null, 
            profile_image || user.picture || null 
        ]);

        return NextResponse.json({ success: true, message: "Profile updated successfully" });

    } catch (error: any) {
        console.error("🔥 SQL Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}