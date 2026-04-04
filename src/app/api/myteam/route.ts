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
        // 🚀 ดึงโปรเจกต์ที่ตัวเองเป็นเจ้าของ (OWNER) และยังไม่ถูกลบ
        const [ownedRows]: any = await connection.execute(
            `SELECT p.id, p.visibility_type AS \`group\`, p.title AS name, p.description, 
                (SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                 FROM project_tags pt JOIN tags t ON pt.tag_id_ref = t.id WHERE pt.project_id_ref = p.id) AS tag,
                p.target_inst_id, p.subject_code, p.section, p.env_type, p.status, p.is_recruiting, p.max_members,
                (SELECT COUNT(*) FROM project_members WHERE project_id_ref = p.id AND member_status = 'ACTIVE') AS current_members
             FROM projects p 
             WHERE p.owner_id_ref = ? AND p.deleted_at IS NULL
             ORDER BY p.id DESC`,
            [userId]
        );

        // 🚀 ดึงโปรเจกต์ที่ตัวเองเป็นสมาชิก ACTIVE (แต่ไม่ใช่เจ้าของ) และยังไม่ถูกลบ
        const [joinedRows]: any = await connection.execute(
            `SELECT p.id, p.visibility_type AS \`group\`, p.title AS name, p.description, 
                (SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                 FROM project_tags pt JOIN tags t ON pt.tag_id_ref = t.id WHERE pt.project_id_ref = p.id) AS tag,
                p.target_inst_id, p.subject_code, p.section, p.env_type, p.status, p.is_recruiting, p.max_members,
                (SELECT COUNT(*) FROM project_members WHERE project_id_ref = p.id AND member_status = 'ACTIVE') AS current_members
             FROM projects p
             JOIN project_members pm ON p.id = pm.project_id_ref
             WHERE pm.user_id_ref = ? AND pm.member_status = 'ACTIVE' AND p.owner_id_ref != ? AND p.deleted_at IS NULL
             ORDER BY p.id DESC`,
            [userId, userId]
        );

        // 🚀 ฟังก์ชันช่วยคำนวณ AI (เหมือนหน้า Home)
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
                    env_type: p.env_type, status: p.status, is_recruiting: p.is_recruiting
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