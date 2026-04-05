import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getModelInputData } from "@/lib/server-utils";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const userIdStr = searchParams.get("userId");

    if (!userIdStr || userIdStr === 'undefined') {
        return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);
    const connection = await db();

    try {
        // 🚀 1. ดึงโปรเจกต์ที่ตัวเองเป็นเจ้าของ (OWNER) พร้อมนับจำนวนต่างๆ จากแถวล่าสุดเท่านั้น
        const [ownedRows]: any = await connection.execute(
            `SELECT p.id, p.visibility_type AS \`group\`, p.title AS name, p.description, 
                (SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                 FROM project_tags pt JOIN tags t ON pt.tag_id_ref = t.id WHERE pt.project_id_ref = p.id) AS tag,
                p.target_inst_id, p.subject_code, p.section, p.env_type, p.status, p.is_recruiting, p.max_members,
                
                -- นับเฉพาะสมาชิกที่สถานะ "ล่าสุด" เป็น ACTIVE
                (SELECT COUNT(*) FROM project_members pm1 
                 WHERE pm1.project_id_ref = p.id AND pm1.member_status = 'ACTIVE' 
                 AND pm1.id = (SELECT MAX(id) FROM project_members pm2 WHERE pm2.project_id_ref = p.id AND pm2.user_id_ref = pm1.user_id_ref)
                ) AS current_members,

                -- นับคำขอเข้าทีมที่สถานะ "ล่าสุด" เป็น PENDING
                (SELECT COUNT(*) FROM join_requests jr1 
                 WHERE jr1.project_id_ref = p.id AND jr1.status = 'PENDING'
                 AND jr1.id = (SELECT MAX(id) FROM join_requests jr2 WHERE jr2.project_id_ref = p.id AND jr2.user_id_ref = jr1.user_id_ref)
                ) AS pending_join_count,

                -- นับคนขอออกจากทีมที่สถานะ "ล่าสุด" เป็น LEAVE_PENDING
                (SELECT COUNT(*) FROM project_members pm_leave1 
                 WHERE pm_leave1.project_id_ref = p.id AND pm_leave1.member_status = 'LEAVE_PENDING'
                 AND pm_leave1.id = (SELECT MAX(id) FROM project_members pm_leave2 WHERE pm_leave2.project_id_ref = p.id AND pm_leave2.user_id_ref = pm_leave1.user_id_ref)
                ) AS pending_leave_count

             FROM projects p 
             WHERE p.owner_id_ref = ? AND p.deleted_at IS NULL
             ORDER BY p.id DESC`,
            [userId]
        );

        // 🚀 2. ดึงโปรเจกต์ที่ตัวเองเป็นสมาชิก โดยต้องเช็คว่าสถานะ "ล่าสุด" เป็น ACTIVE จริงๆ
        const [joinedRows]: any = await connection.execute(
            `SELECT p.id, p.visibility_type AS \`group\`, p.title AS name, p.description, 
                (SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                 FROM project_tags pt JOIN tags t ON pt.tag_id_ref = t.id WHERE pt.project_id_ref = p.id) AS tag,
                p.target_inst_id, p.subject_code, p.section, p.env_type, p.status, p.is_recruiting, p.max_members,
                
                -- นับเฉพาะสมาชิกที่สถานะ "ล่าสุด" เป็น ACTIVE
                (SELECT COUNT(*) FROM project_members pm1 
                 WHERE pm1.project_id_ref = p.id AND pm1.member_status = 'ACTIVE' 
                 AND pm1.id = (SELECT MAX(id) FROM project_members pm2 WHERE pm2.project_id_ref = p.id AND pm2.user_id_ref = pm1.user_id_ref)
                ) AS current_members,
                
                0 AS pending_join_count, -- สมาชิกธรรมดาไม่ต้องโชว์แจ้งเตือน
                0 AS pending_leave_count

             FROM projects p
             WHERE p.owner_id_ref != ? AND p.deleted_at IS NULL
             AND EXISTS (
                 SELECT 1 FROM project_members pm_check
                 WHERE pm_check.project_id_ref = p.id 
                 AND pm_check.user_id_ref = ? 
                 AND pm_check.member_status = 'ACTIVE'
                 AND pm_check.id = (
                     SELECT MAX(id) FROM project_members pm_check2 
                     WHERE pm_check2.project_id_ref = p.id AND pm_check2.user_id_ref = pm_check.user_id_ref
                 )
             )
             ORDER BY p.id DESC`,
            [userId, userId]
        );

        const formatProjectData = async (rows: any[]) => {
            return await Promise.all(rows.map(async (p: any) => {
                let compatibleScore = 0;
                try {
                    const aiPayload = await getModelInputData(p.id, userId, true);
                    if (aiPayload && aiPayload.members && aiPayload.members.length > 0) {
                        const aiRes = await fetch("https://dev.teamder.online/model/predict", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "X-API-Key": process.env.lightGBM_X_API_KEY || "" },
                            body: JSON.stringify(aiPayload)
                        });
                        if (aiRes.ok) {
                            const aiResult = await aiRes.json();
                            if (aiResult.status === "success") compatibleScore = Math.round(aiResult.overall_match_percent);
                        }
                    }
                } catch (error) {}

                let parsedTags = [];
                try { parsedTags = typeof p.tag === 'string' ? JSON.parse(p.tag) : (p.tag || []); } catch (e) { parsedTags = []; }

                return {
                    id: p.id, group: p.group, name: p.name, description: p.description,
                    compatible: compatibleScore || 0, tag: parsedTags, 
                    members: `${p.current_members}/${p.max_members || 5}`,
                    target_inst_id: p.target_inst_id, subject_code: p.subject_code, section: p.section,
                    env_type: p.env_type, status: p.status, is_recruiting: p.is_recruiting,
                    pending_join_count: Number(p.pending_join_count) || 0,
                    pending_leave_count: Number(p.pending_leave_count) || 0
                };
            }));
        };

        const ownedProjects = await formatProjectData(ownedRows);
        const joinedProjects = await formatProjectData(joinedRows);

        return NextResponse.json({ 
            ownedProjects, 
            joinedProjects,
            ownedCount: ownedProjects.length,
            joinedCount: joinedProjects.length
        });

    } catch (error: any) {
        console.error("MyTeams API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}