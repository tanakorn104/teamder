// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    let connection;
    try {
        // 1. เช็ค Auth
        const cookieStore = await cookies();
        const token = cookieStore.get("teamder_access_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const baseUrl = new URL(req.url).origin;
        const authRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { "Cookie": `teamder_access_token=${token}` }
        });
        if (!authRes.ok) return NextResponse.json({ error: "Auth failed" }, { status: 401 });
        
        const authData = await authRes.json();
        const user = authData.user;
        if (!user || !user.id) return NextResponse.json({ error: "Invalid user data" }, { status: 400 });

        // 2. รับข้อมูลจากฟอร์ม
        const body = await req.json();
        const { title, description, visibility_type, env_type, max_members, subject_code, section, tags } = body;

        connection = await db();
        
        // 3. เริ่มบันทึก (ใช้ Transaction เผื่อพังกลางคันจะได้ Rollback)
        await connection.beginTransaction();

        // 3.1 บันทึกโปรเจกต์
        const projectIdStr = `proj_${Date.now()}`;
        const targetInstId = visibility_type === 'University' ? (user.institution_id || 1) : null;
        
        const [insertProj]: any = await connection.execute(
            `INSERT INTO projects 
             (project_id, owner_id_ref, visibility_type, target_inst_id, subject_code, section, title, description, env_type, status, is_recruiting, max_members) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLANNING', TRUE, ?)`,
            [projectIdStr, user.id, visibility_type, targetInstId, subject_code || null, section || null, title, description, env_type, max_members]
        );
        const newProjId = insertProj.insertId;

        // 3.2 บันทึก Tags ลงตารางกลาง (project_tags)
        if (tags && tags.length > 0) {
            const tagValues = tags.map((tagId: number) => `(${newProjId}, ${tagId})`).join(',');
            await connection.execute(`INSERT INTO project_tags (project_id_ref, tag_id_ref) VALUES ${tagValues}`);
        }

        // 3.3 เอาเจ้าของเข้ากลุ่มอัตโนมัติ (เป็นสมาชิกคนที่ 1)
        await connection.execute(
            `INSERT INTO project_members (project_id_ref, user_id_ref, member_status) VALUES (?, ?, 'ACTIVE')`,
            [newProjId, user.id]
        );

        await connection.commit();
        return NextResponse.json({ success: true, projectId: newProjId });

    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error("Create Project Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}