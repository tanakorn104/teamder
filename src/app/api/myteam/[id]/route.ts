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
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const connection = await db();
    try {
        // 1. ดึงข้อมูลโปรเจกต์ (เช็คว่าเป็นเจ้าของไหม)
        const [projectRows]: any = await connection.execute(
            `SELECT p.*,
                (SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'tag_name', t.tag_name)), JSON_ARRAY()) 
                 FROM project_tags pt JOIN tags t ON pt.tag_id_ref = t.id 
                 WHERE pt.project_id_ref = p.id AND pt.deleted_at IS NULL) AS tags
             FROM projects p WHERE p.id = ? AND p.owner_id_ref = ? AND p.deleted_at IS NULL`,
            [projectId, userId]
        );
        
        if (projectRows.length === 0) return NextResponse.json({ error: "ไม่พบโปรเจกต์ หรือคุณไม่ใช่หัวหน้าทีม" }, { status: 403 });
        const project = projectRows[0];

        // 2. ดึงสมาชิก โดยกรองเอาเฉพาะ "แถวล่าสุด" ของแต่ละคน และต้องมีสถานะเป็น ACTIVE หรือ LEAVE_PENDING
        const [members]: any = await connection.execute(
            `SELECT pm.user_id_ref as user_id, u.full_name, up.primary_role, up.profile_image, pm.member_status, pm.status_reason 
             FROM project_members pm
             INNER JOIN (
                 SELECT user_id_ref, MAX(id) as max_id 
                 FROM project_members 
                 WHERE project_id_ref = ? 
                 GROUP BY user_id_ref
             ) latest ON pm.id = latest.max_id
             JOIN users u ON pm.user_id_ref = u.id
             LEFT JOIN user_profiles up ON u.id = up.user_id_ref
             WHERE pm.member_status IN ('ACTIVE', 'LEAVE_PENDING')`,
            [projectId]
        );

        // 3. ดึงคำขอเข้าทีม โดยกรองเอาเฉพาะ "แถวล่าสุด" ของแต่ละคน และต้องเป็น PENDING เท่านั้น
        const [requests]: any = await connection.execute(
            `SELECT jr.id as request_id, jr.user_id_ref as user_id, jr.request_message, u.full_name, up.primary_role, up.profile_image, jr.created_at
             FROM join_requests jr
             INNER JOIN (
                 SELECT user_id_ref, MAX(id) as max_id 
                 FROM join_requests 
                 WHERE project_id_ref = ? 
                 GROUP BY user_id_ref
             ) latest_req ON jr.id = latest_req.max_id
             JOIN users u ON jr.user_id_ref = u.id
             LEFT JOIN user_profiles up ON u.id = up.user_id_ref
             WHERE jr.status = 'PENDING'
             ORDER BY jr.created_at ASC`,
            [projectId]
        );

        return NextResponse.json({ project, members, requests });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}

// ... (โค้ดส่วนบนเหมือนเดิม)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const projectId = (await params).id;
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, payload } = body;

    const connection = await db();
    try {
        const [checkOwner]: any = await connection.execute(`SELECT id FROM projects WHERE id = ? AND owner_id_ref = ?`, [projectId, userId]);
        if (checkOwner.length === 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // --- ACTION: แก้ไขข้อมูลโปรเจกต์ ---
        if (action === 'update_project') {
            await connection.beginTransaction(); 
            await connection.execute(
                `UPDATE projects SET title = ?, description = ?, status = ?, is_recruiting = ?, max_members = ?, 
                 visibility_type = ?, env_type = ?, subject_code = ?, section = ? WHERE id = ?`,
                [payload.title, payload.description, payload.status, payload.is_recruiting, payload.max_members,
                 payload.visibility_type, payload.env_type, payload.subject_code || null, payload.section || null, projectId]
            );

            if (payload.tag_ids && Array.isArray(payload.tag_ids)) {
                await connection.execute(`UPDATE project_tags SET deleted_at = CURRENT_TIMESTAMP WHERE project_id_ref = ?`, [projectId]);
                for (const tagId of payload.tag_ids) {
                    const [exist]: any = await connection.execute(`SELECT * FROM project_tags WHERE project_id_ref = ? AND tag_id_ref = ?`, [projectId, tagId]);
                    if (exist.length > 0) {
                        await connection.execute(`UPDATE project_tags SET deleted_at = NULL WHERE project_id_ref = ? AND tag_id_ref = ?`, [projectId, tagId]);
                    } else {
                        await connection.execute(`INSERT INTO project_tags (project_id_ref, tag_id_ref) VALUES (?, ?)`, [projectId, tagId]);
                    }
                }
            }
            await connection.commit();
            return NextResponse.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
        } 

        // --- ACTION: อนุมัติการเข้าร่วม ---
        else if (action === 'approve_request') {
            await connection.beginTransaction();
            await connection.execute(`INSERT INTO join_requests (project_id_ref, user_id_ref, status) VALUES (?, ?, 'APPROVED')`, [projectId, payload.target_user_id]);
            await connection.execute(`INSERT INTO project_members (project_id_ref, user_id_ref, member_status) VALUES (?, ?, 'ACTIVE')`, [projectId, payload.target_user_id]);
            await connection.commit();
            return NextResponse.json({ success: true, message: "รับเข้าทีมเรียบร้อยแล้ว" });
        } 

        // --- ACTION: ปฏิเสธการเข้าร่วม ---
        else if (action === 'reject_request') {
            await connection.execute(`INSERT INTO join_requests (project_id_ref, user_id_ref, status) VALUES (?, ?, 'REJECTED')`, [projectId, payload.target_user_id]);
            return NextResponse.json({ success: true, message: "ปฏิเสธคำขอแล้ว" });
        } 

        // --- ACTION: เตะออกจากทีม ---
        else if (action === 'kick_member') {
            if (payload.target_user_id === userId) return NextResponse.json({ error: "ลบตัวเองไม่ได้" }, { status: 400 });
            await connection.execute(
                `INSERT INTO project_members (project_id_ref, user_id_ref, member_status, status_reason) VALUES (?, ?, 'KICKED', ?)`, 
                [projectId, payload.target_user_id, payload.reason]
            );
            return NextResponse.json({ success: true, message: "เตะสมาชิกออกจากทีมแล้ว" });
        }

        // --- ACTION: อนุมัติให้ออก ---
        else if (action === 'approve_leave') {
            await connection.execute(
                `INSERT INTO project_members (project_id_ref, user_id_ref, member_status) VALUES (?, ?, 'LEFT')`, 
                [projectId, payload.target_user_id]
            );
            return NextResponse.json({ success: true, message: "อนุมัติการออกจากทีมแล้ว" });
        }

        // 🚀 --- ACTION ใหม่: ปฏิเสธการขอลาออก (ดึงสมาชิกกลับเป็น ACTIVE) ---
        else if (action === 'reject_leave') {
            await connection.execute(
                `INSERT INTO project_members (project_id_ref, user_id_ref, member_status, status_reason) VALUES (?, ?, 'ACTIVE', 'Leader rejected leave request')`, 
                [projectId, payload.target_user_id]
            );
            return NextResponse.json({ success: true, message: "ปฏิเสธการขอลาออกเรียบร้อย" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        if (connection) await connection.rollback(); 
        console.error("PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}