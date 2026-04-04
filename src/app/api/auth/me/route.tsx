import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import axios from "axios";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader ? authHeader.split(" ")[1] : request.cookies.get("teamder_access_token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized: No token" }, { status: 401 });
        }

        const googleProfile = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // ดึงตัวแปร sub ออกมาด้วย
        const { sub, email, name, picture } = googleProfile.data;

        // 2. จัดการ Database
        const connection = await db();
        try {
            // 🚀 แก้ตรงนี้: เพิ่ม up.institution_id ลงใน SELECT
            const [existingUsers]: any = await connection.execute(
                `SELECT u.id, up.primary_role, up.province, up.district, up.user_description, up.profile_image, up.institution_id 
                 FROM users u 
                 LEFT JOIN user_profiles up ON u.id = up.user_id_ref 
                 WHERE u.email = ?`,
                [email]
            );

            let userData;
            const safeName = name || 'Google User';

            if (existingUsers.length === 0) {
                // --- กรณี: ผู้ใช้ใหม่ ---
                const googleSubId = sub || `u_${Date.now().toString().slice(-6)}`;
                
                const [insertUser]: any = await connection.execute(
                    "INSERT INTO users (user_id, email, full_name) VALUES (?, ?, ?)",
                    [googleSubId, email, safeName]
                );
                const newInternalId = insertUser.insertId;

                await connection.execute(
                    "INSERT INTO user_profiles (user_id_ref, institution_id, primary_role, profile_image) VALUES (?, ?, ?, ?)",
                    [newInternalId, 1, 'New Member', picture || null]
                );

                userData = { 
                    id: newInternalId, 
                    email, 
                    full_name: safeName, 
                    primary_role: 'New Member',
                    province: '',
                    district: '',
                    user_description: '',
                    institution_id: 1, // 🚀 เพิ่ม institution_id เข้าไปใน Response
                    picture: picture || null
                };
            } else {
                // --- กรณี: ผู้ใช้เดิม ---
                await connection.execute(
                    "UPDATE users SET full_name = ? WHERE email = ?",
                    [safeName, email]
                );
                
                const dbUser = existingUsers[0];

                userData = { 
                    id: dbUser.id, 
                    email, 
                    full_name: safeName, 
                    primary_role: dbUser.primary_role || '',
                    province: dbUser.province || '',
                    district: dbUser.district || '',
                    user_description: dbUser.user_description || '',
                    institution_id: dbUser.institution_id || 1, // 🚀 เพิ่มตรงนี้ ให้ดึงจาก DB
                    picture: dbUser.profile_image || picture || null 
                };
            }

            return NextResponse.json({ user: userData });
        } finally {
            await connection.end();
        }
    } catch (error: any) {
        console.error("🚨 [Auth/Me Error]:", error.response?.data || error.message || error);
        return NextResponse.json({ 
            error: "Internal Error in /auth/me",
            details: error.response?.data || error.message || String(error)
        }, { status: 500 });
    }
}