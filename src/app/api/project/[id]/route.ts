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
        // 1. ดึงข้อมูลโปรเจกต์
        const [projectRows]: any = await connection.execute(
            `SELECT p.*, 
                (SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                 FROM project_tags pt JOIN tags t ON pt.tag_id_ref = t.id 
                 WHERE pt.project_id_ref = p.id AND pt.deleted_at IS NULL) AS tags
             FROM projects p WHERE p.id = ? AND p.deleted_at IS NULL`,
            [projectId]
        );

        if (projectRows.length === 0) return NextResponse.json({ error: "Project not found" }, { status: 404 });
        const project = projectRows[0];

        // 2. ดึงสมาชิกปัจจุบัน (เอาเฉพาะคนที่มีสถานะล่าสุดเป็น ACTIVE หรือ LEAVE_PENDING)
        const [memberRows]: any = await connection.execute(
            `SELECT u.id, u.full_name, up.primary_role, up.profile_image, pm.member_status,
                    CASE WHEN p.owner_id_ref = u.id THEN 'OWNER' ELSE 'MEMBER' END as role
             FROM project_members pm
             JOIN (
                 SELECT MAX(id) as max_id 
                 FROM project_members 
                 WHERE project_id_ref = ? 
                 GROUP BY user_id_ref
             ) latest ON pm.id = latest.max_id
             JOIN users u ON pm.user_id_ref = u.id
             LEFT JOIN user_profiles up ON u.id = up.user_id_ref
             JOIN projects p ON p.id = pm.project_id_ref
             WHERE pm.member_status IN ('ACTIVE', 'LEAVE_PENDING')
             ORDER BY role DESC, u.id ASC`,
            [projectId]
        );

        const currentMembers = memberRows.length;
        
        let userStatus = "NONE"; 
        let userRequestMessage = null; 
        
        if (userId) {
            if (project.owner_id_ref === userId) {
                userStatus = "OWNER";
            } else {
                // 🚀 ลอจิกเช็คสถานะล่าสุด: 
                // เช็ค project_members ก่อน (ถ้าเคยเป็นสมาชิกแล้วถูกลบ สถานะอาจจะเป็น REMOVED หรืออย่างอื่น)
                const [memRows]: any = await connection.execute(
                    `SELECT member_status FROM project_members WHERE project_id_ref = ? AND user_id_ref = ? ORDER BY id DESC LIMIT 1`,
                    [projectId, userId]
                );
                
                // ถ้าใน project_members บอกว่าเป็นสมาชิกอยู่ ให้ยึดตามนั้น
                if (memRows.length > 0 && (memRows[0].member_status === 'ACTIVE' || memRows[0].member_status === 'LEAVE_PENDING')) {
                    userStatus = memRows[0].member_status; 
                } else {
                    // ถ้าไม่ได้เป็นสมาชิก (หรือเคยเป็นแต่ถูกเอาออก) ให้มาเช็คที่ join_requests แถวล่าสุด
                    const [reqRows]: any = await connection.execute(
                        `SELECT status, request_message FROM join_requests WHERE project_id_ref = ? AND user_id_ref = ? ORDER BY id DESC LIMIT 1`,
                        [projectId, userId]
                    );
                    if (reqRows.length > 0) {
                        userStatus = reqRows[0].status; // จะเป็น PENDING, REJECTED, หรือ CANCELED
                        userRequestMessage = reqRows[0].request_message; 
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
            userRequestMessage 
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
        // 🚀 ป้องกันการขอซ้ำถ้ายังเป็นสมาชิกอยู่
        const [memberRows]: any = await connection.execute(
            `SELECT member_status FROM project_members WHERE project_id_ref = ? AND user_id_ref = ? ORDER BY id DESC LIMIT 1`,
            [projectId, userId]
        );
        if (memberRows.length > 0 && ['ACTIVE', 'LEAVE_PENDING'].includes(memberRows[0].member_status)) {
            return NextResponse.json({ error: "คุณอยู่ในทีมนี้แล้ว" }, { status: 400 });
        }

        // 🚀 ป้องกันการขอซ้ำถ้าคำขอล่าสุดยังค้างอยู่ (PENDING)
        const [pendingRows]: any = await connection.execute(
            `SELECT status FROM join_requests WHERE project_id_ref = ? AND user_id_ref = ? ORDER BY id DESC LIMIT 1`,
            [projectId, userId]
        );
        if (pendingRows.length > 0 && pendingRows[0].status === 'PENDING') {
            return NextResponse.json({ error: "คุณมีคำขอที่กำลังรอการอนุมัติอยู่แล้ว" }, { status: 400 });
        }

        // 🚀 เพิ่มแถวใหม่ (INSERT) เสมอ แม้จะเคยโดน REJECTED หรือ CANCELED มาก่อน
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const projectId = (await params).id;
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch(e) { body = {}; }
    const action = body.action;
    const payload = body.payload || {};

    const connection = await db();
    try {
        if (action === 'cancel_request') {
            const [check]: any = await connection.execute(
                `SELECT status FROM join_requests WHERE project_id_ref = ? AND user_id_ref = ? ORDER BY id DESC LIMIT 1`, 
                [projectId, userId]
            );
            if (check.length === 0 || check[0].status !== 'PENDING') {
                return NextResponse.json({ error: "ไม่พบคำขอที่สามารถยกเลิกได้" }, { status: 404 });
            }

            // เพิ่มแถว CANCELED ใหม่ลงไปในประวัติ
            await connection.execute(
                `INSERT INTO join_requests (project_id_ref, user_id_ref, status) VALUES (?, ?, 'CANCELED')`,
                [projectId, userId]
            );
            return NextResponse.json({ success: true, message: "ยกเลิกคำขอเรียบร้อยแล้ว" });
        } 
        else if (action === 'request_leave') {
            const [check]: any = await connection.execute(
                `SELECT member_status FROM project_members WHERE project_id_ref = ? AND user_id_ref = ? ORDER BY id DESC LIMIT 1`, 
                [projectId, userId]
            );
            if (check.length === 0 || check[0].member_status !== 'ACTIVE') {
                return NextResponse.json({ error: "คุณไม่ได้อยู่ในสถานะที่สามารถขอออกได้" }, { status: 400 });
            }

            // เพิ่มแถว LEAVE_PENDING เพื่อรออนุมัติออก
            await connection.execute(
                `INSERT INTO project_members (project_id_ref, user_id_ref, member_status, status_reason) VALUES (?, ?, 'LEAVE_PENDING', ?)`,
                [projectId, userId, payload.reason || null]
            );
            return NextResponse.json({ success: true, message: "ส่งคำขอออกจากทีมแล้ว รอหัวหน้าอนุมัติ" });
        }
        
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}