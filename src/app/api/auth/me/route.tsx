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

        // 1. ดึงโปรไฟล์จาก Google
        const googleProfile = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { email, name, picture } = googleProfile.data;

        // 2. จัดการ Database
        const connection = await db();
        try {
            const [existingUsers]: any = await connection.execute(
                `SELECT u.id, up.primary_role 
                 FROM users u 
                 LEFT JOIN user_profiles up ON u.id = up.user_id_ref 
                 WHERE u.email = ?`,
                [email]
            );

            let userData;

            if (existingUsers.length === 0) {
                const newShortId = `u_${Date.now().toString().slice(-6)}`;
                const safeName = name || 'Google User'; // กันเหนียวกรณี Google ไม่ส่งชื่อมา
                
                const [insertUser]: any = await connection.execute(
                    "INSERT INTO users (user_id, email, full_name) VALUES (?, ?, ?)",
                    [newShortId, email, safeName]
                );
                const newInternalId = insertUser.insertId;

                await connection.execute(
                    "INSERT INTO user_profiles (user_id_ref, institution_id, primary_role, profile_image) VALUES (?, ?, ?, ?)",
                    [newInternalId, 1, 'New Member', picture || null]
                );

                userData = { email, full_name: safeName, primary_role: 'New Member' };
            } else {
                await connection.execute(
                    "UPDATE users SET full_name = ? WHERE email = ?",
                    [name, email]
                );
                userData = { email, full_name: name, primary_role: existingUsers[0].primary_role };
            }

            return NextResponse.json({ user: userData });
        } finally {
            await connection.end();
        }
    } catch (error: any) {
        // ✨ จุดสำคัญ: พ่น Error ออกมาให้เห็นชัดๆ ว่าพังเพราะ Google หรือพังเพราะ Database MySQL
        console.error("🚨 [Auth/Me Error]:", error.response?.data || error.message || error);
        
        return NextResponse.json({ 
            error: "Internal Error in /auth/me",
            details: error.response?.data || error.message || String(error)
        }, { status: 500 }); // เปลี่ยนเป็น 500 เพื่อบอกว่าเป็นบั๊กฝั่ง Server
    }
}