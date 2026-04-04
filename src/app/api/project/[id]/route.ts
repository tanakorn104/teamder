import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function getCurrentUserId(req: NextRequest) {
    const token = req.cookies.get("teamder_access_token")?.value;
    if (!token) return null;
    try {
        const baseUrl = new URL(req.url).origin;
        const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { "Cookie": `teamder_access_token=${token}` } });
        if (res.ok) {
            const data = await res.json();
            return data.user?.id || null;
        }
    } catch (e) { return null; }
    return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const projectId = (await params).id;
    const userId = await getCurrentUserId(req);
    const connection = await db();

    try {
        const [projectRows]: any = await connection.execute(
            `SELECT p.*, 
                (SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                 FROM project_tags pt JOIN tags t ON pt.tag_id_ref = t.id 
                 WHERE pt.project_id_ref = p.id) AS tags
             FROM projects p WHERE p.id = ?`,
            [projectId]
        );

        if (projectRows.length === 0) return NextResponse.json({ error: "Project not found" }, { status: 404 });
        const project = projectRows[0];

        const [memberRows]: any = await connection.execute(
            `SELECT u.id, u.full_name, up.primary_role, up.profile_image, 
                    CASE WHEN p.owner_id_ref = u.id THEN 'OWNER' ELSE 'MEMBER' END as role
             FROM project_members pm
             JOIN users u ON pm.user_id_ref = u.id
             LEFT JOIN user_profiles up ON u.id = up.user_id_ref
             JOIN projects p ON p.id = pm.project_id_ref
             WHERE pm.project_id_ref = ? AND pm.member_status = 'ACTIVE'
             ORDER BY role DESC, u.id ASC`,
            [projectId]
        );

        const currentMembers = memberRows.length;
        
        let userStatus = "NONE"; 
        let userRequestMessage = null; // 🚀 ตัวแปรเก็บข้อความคำขอ
        
        if (userId) {
            if (project.owner_id_ref === userId) {
                userStatus = "OWNER";
            } else {
                const [memRows]: any = await connection.execute(
                    `SELECT member_status FROM project_members WHERE project_id_ref = ? AND user_id_ref = ? AND member_status = 'ACTIVE'`,
                    [projectId, userId]
                );
                if (memRows.length > 0) {
                    userStatus = "ACTIVE";
                } else {
                    // 🚀 ดึง request_message ออกมาด้วย
                    const [reqRows]: any = await connection.execute(
                        `SELECT status, request_message FROM join_requests WHERE project_id_ref = ? AND user_id_ref = ? ORDER BY created_at DESC LIMIT 1`,
                        [projectId, userId]
                    );
                    if (reqRows.length > 0) {
                        userStatus = reqRows[0].status;
                        userRequestMessage = reqRows[0].request_message; // 🚀 เก็บข้อความ
                    }
                }
            }
        }

        let parsedTags = [];
        try { parsedTags = typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags; } catch (e) {}

        return NextResponse.json({
            project: {
                ...project,
                tags: parsedTags,
                current_members: currentMembers,
                max_members: project.max_members || 5,
                members_list: memberRows 
            },
            userStatus,
            userRequestMessage // 🚀 ส่งข้อความกลับไปหน้าบ้าน
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const projectId = (await params).id;
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const requestMessage = body.message || null; 

    const connection = await db();
    try {
        const [memberRows]: any = await connection.execute(
            `SELECT * FROM project_members WHERE project_id_ref = ? AND user_id_ref = ? AND member_status = 'ACTIVE'`,
            [projectId, userId]
        );
        if (memberRows.length > 0) return NextResponse.json({ error: "คุณอยู่ในทีมนี้แล้ว" }, { status: 400 });

        const [pendingRows]: any = await connection.execute(
            `SELECT * FROM join_requests WHERE project_id_ref = ? AND user_id_ref = ? AND status = 'PENDING'`,
            [projectId, userId]
        );
        if (pendingRows.length > 0) return NextResponse.json({ error: "คุณมีคำขอที่กำลังรอการอนุมัติอยู่แล้ว" }, { status: 400 });

        await connection.execute(
            `INSERT INTO join_requests (project_id_ref, user_id_ref, status, request_message) VALUES (?, ?, 'PENDING', ?)`,
            [projectId, userId, requestMessage]
        );

        return NextResponse.json({ success: true, message: "ส่งคำขอเข้าร่วมทีมเรียบร้อยแล้ว" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}


// เพิ่มต่อจากฟังก์ชัน POST เดิมในไฟล์เดิมครับ
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const projectId = (await params).id;
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const connection = await db();
    try {
        // 🚀 อัปเดตสถานะคำขอล่าสุดที่เป็น PENDING ให้กลายเป็น CANCELED
        const [result]: any = await connection.execute(
            `UPDATE join_requests 
             SET status = 'CANCELED' 
             WHERE project_id_ref = ? AND user_id_ref = ? AND status = 'PENDING'`,
            [projectId, userId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "ไม่พบคำขอที่กำลังรออนุมัติเพื่อยกเลิก" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "ยกเลิกคำขอเรียบร้อยแล้ว" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}