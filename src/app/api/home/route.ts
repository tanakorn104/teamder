import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getModelInputData } from "@/lib/server-utils";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const userIdStr = searchParams.get("userId");
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = 6;

    const group = searchParams.get("group") || "Global";
    const q = searchParams.get("q") || "";
    const subjectCode = searchParams.get("subjectCode") || "";
    const section = searchParams.get("section") || "";
    const envType = searchParams.get("envType") || "all";

    if (!userIdStr || userIdStr === 'undefined') {
        return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);
    const connection = await db();

    try {
        let personal_data = {};
        let userInstitutionId = null;
        let userInstName = null;

        const [profileRows]: any = await connection.execute(
            `SELECT p.institution_id, i.name_th AS inst_name 
             FROM user_profiles p 
             LEFT JOIN institutions i ON p.institution_id = i.id 
             WHERE p.user_id_ref = ?`, [userId]
        );
        userInstitutionId = profileRows.length > 0 ? profileRows[0].institution_id : null;
        userInstName = profileRows.length > 0 ? profileRows[0].inst_name : null;

        if (offset === 0) {
            // 1. ดึงข้อมูลทำข้อสอบเอง (Self-Assessment)
            const [userRows]: any = await connection.execute(
                `SELECT bfi_o, bfi_c, bfi_e, bfi_a, bfi_n, sjt_lead, sjt_plan, sjt_support 
                 FROM user_ai_features WHERE user_id_ref = ?`, [userId]
            );

            // 2. ดึงข้อมูลที่เพื่อนประเมิน (Peer Evaluation) และ "นับจำนวนคนประเมิน" (eval_count)
            const [peerRows]: any = await connection.execute(
                `SELECT 
                    COUNT(id) as eval_count,
                    AVG(bfi_o) as peer_o, AVG(bfi_c) as peer_c, AVG(bfi_e) as peer_e, AVG(bfi_a) as peer_a, AVG(bfi_n) as peer_n, 
                    AVG(sjt_lead) as peer_lead, AVG(sjt_plan) as peer_plan, AVG(sjt_support) as peer_support
                 FROM peer_evaluations 
                 WHERE target_id_ref = ?`, [userId]
            );

            if (userRows.length > 0) {
                const self = userRows[0];
                const peer = peerRows.length > 0 ? peerRows[0] : null;
                
                // จำนวนคนที่ประเมิน
                const N = peer?.eval_count || 0; 
                // กำหนดจุดคุ้มทุน (Threshold): ให้ K=3 หมายถึงถ้ามีเพื่อนประเมิน 3 คน น้ำหนักจะเท่ากับ 50:50
                const K = 3; 

                // 3. ฟังก์ชันคำนวณผสมแบบถ่วงน้ำหนัก (Bayesian Average)
                const mixScore = (selfScore: number, peerScore: number) => {
                    if (N > 0 && peerScore != null && !isNaN(peerScore)) {
                        const w_peer = N / (N + K);      // น้ำหนักฝั่งเพื่อน
                        const w_self = K / (N + K);      // น้ำหนักฝั่งตัวเอง
                        return (selfScore * w_self) + (peerScore * w_peer);
                    }
                    return selfScore; // ถ้าไม่มีคนประเมินเลย ใช้คะแนนตัวเองล้วนๆ
                };

                personal_data = {
                    'Openness': Math.round(mixScore(self.bfi_o, peer?.peer_o) * 100), 
                    'Conscientious': Math.round(mixScore(self.bfi_c, peer?.peer_c) * 100),
                    'Extraversion': Math.round(mixScore(self.bfi_e, peer?.peer_e) * 100), 
                    'Agreeable': Math.round(mixScore(self.bfi_a, peer?.peer_a) * 100),
                    'Neuroticism': Math.round(mixScore(self.bfi_n, peer?.peer_n) * 100), 
                    'Leadership': Math.round(mixScore(self.sjt_lead, peer?.peer_lead) * 100),
                    'Planning': Math.round(mixScore(self.sjt_plan, peer?.peer_plan) * 100), 
                    'Support': Math.round(mixScore(self.sjt_support, peer?.peer_support) * 100)
                };
            }
        }

        // 🚀 อัปเดต whereClause (แก้บั๊ก pm1 เป็น pm เรียบร้อย)
        let whereClause = ` 
            FROM projects p 
            WHERE p.is_recruiting = TRUE 
              AND p.status != 'COMPLETED'
              AND p.deleted_at IS NULL
              AND p.owner_id_ref != ?
              AND NOT EXISTS (
                  SELECT 1 FROM project_members pm
                  WHERE pm.project_id_ref = p.id 
                    AND pm.user_id_ref = ? 
                    AND pm.member_status = 'ACTIVE'
                    AND pm.id = (
                        SELECT MAX(id) FROM project_members pm2 
                        WHERE pm2.project_id_ref = p.id AND pm2.user_id_ref = pm.user_id_ref
                    )
              )
        `;
        
        let queryParams: any[] = [userId, userId];

        // กรองตาม Tab
        if (group === 'Global') {
            whereClause += ` AND p.visibility_type = 'Global'`;
        } else if (group === 'University') {
            whereClause += ` AND p.visibility_type = 'University' AND p.target_inst_id = ?`;
            queryParams.push(userInstitutionId);
        } else if (group === 'Subject') {
            whereClause += ` AND p.visibility_type = 'Subject'`;
            if (subjectCode) { whereClause += ` AND p.subject_code = ?`; queryParams.push(subjectCode); }
            if (section) { whereClause += ` AND p.section = ?`; queryParams.push(section); }
        }

        // กรองตาม Project Type (env_type)
        if (envType !== "all") {
            whereClause += ` AND p.env_type = ?`;
            queryParams.push(envType);
        }

        // 🚀 กรองตาม Text Search (ค้นหาจากชื่อโปรเจกต์, รายละเอียด หรือ Tag ในตารางใหม่)
        if (q) {
            whereClause += ` AND (
                p.title LIKE ? 
                OR p.description LIKE ? 
                OR EXISTS (
                    SELECT 1 FROM project_tags pt 
                    JOIN tags t ON pt.tag_id_ref = t.id 
                    WHERE pt.project_id_ref = p.id AND t.tag_name LIKE ?
                )
            )`;
            const searchPattern = `%${q}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        // 1. นับจำนวนทั้งหมด
        const countSql = `SELECT COUNT(*) as total` + whereClause;
        const [countRows]: any = await connection.execute(countSql, queryParams);
        const totalProjects = countRows[0].total;
        const hasMore = (offset + limit) < totalProjects;

        // 2. ดึงข้อมูลจริงแบบจำกัดจำนวน (เพิ่มการดึงแท็กด้วย Subquery และดึง max_members ออกมาด้วย)
        const sql = `SELECT 
            p.id, p.visibility_type AS \`group\`, p.title AS name, p.description, 
            (
                SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                FROM project_tags pt 
                JOIN tags t ON pt.tag_id_ref = t.id 
                WHERE pt.project_id_ref = p.id
            ) AS tag,
            p.target_inst_id, p.subject_code, p.section, 
            p.env_type, p.status, p.is_recruiting, p.max_members,
            (
                SELECT COUNT(*) 
                FROM project_members pm1 
                WHERE pm1.project_id_ref = p.id 
                  AND pm1.member_status = 'ACTIVE' 
                  AND pm1.id = (
                      SELECT MAX(id) FROM project_members pm2 
                      WHERE pm2.project_id_ref = p.id AND pm2.user_id_ref = pm1.user_id_ref
                  )
            ) AS current_members
            ` + whereClause + ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;

        const fetchParams = [...queryParams, limit.toString(), offset.toString()];
        const [projectRows]: any = await connection.execute(sql, fetchParams);

        // คำนวณ AI
        const projectsData = await Promise.all(projectRows.map(async (p: any) => {
            let compatibleScore = 0;
            try {
                const aiPayload = await getModelInputData(p.id, userId, true);
                
                if (aiPayload && aiPayload.members && aiPayload.members.length > 0) {
                    const aiRes = await fetch(process.env.TeamderNginxServiceURI+"/model/predict", {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json", 
                            "X-API-Key": process.env.lightGBM_X_API_KEY || "" 
                        },
                        body: JSON.stringify(aiPayload)
                    });

                    if (aiRes.ok) {
                        const aiResult = await aiRes.json();
                        if (aiResult.status === "success") {
                            compatibleScore = Math.round(aiResult.overall_match_percent);
                        } else {
                            console.log(`🔴 [AI Warning] โปรเจกต์ ${p.id}: API ตอบกลับมาแต่ไม่ success ->`, aiResult);
                        }
                    } else {
                        console.log(`🔴 [AI HTTP Error] โปรเจกต์ ${p.id}: API Error Status ${aiRes.status}`);
                    }
                } else {
                    console.log(`🟡 [AI Skip] โปรเจกต์ ${p.id}: ไม่มีสมาชิก (หรือดึงข้อมูล payload ไม่มา) เลยข้ามการคำนวณ AI`);
                }
            } catch (error) { 
                console.error(`💥 [AI Crash] โปรเจกต์ ${p.id}: ระบบประมวลผล AI พัง ->`, error);
            }

            let parsedTags = [];
            try { 
                parsedTags = typeof p.tag === 'string' ? JSON.parse(p.tag) : (p.tag || []); 
            } catch (e) { 
                parsedTags = []; 
            }

            return {
                id: p.id, group: p.group, name: p.name, description: p.description,
                compatible: compatibleScore || 0, tag: parsedTags, 
                members: `${p.current_members}/${p.max_members || 5}`,
                target_inst_id: p.target_inst_id, subject_code: p.subject_code, section: p.section,
                env_type: p.env_type,
                status: p.status,
                is_recruiting: p.is_recruiting
            };
        }));

        return NextResponse.json({ personal_data, projectsData, hasMore, userInstName });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}