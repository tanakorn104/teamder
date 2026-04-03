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
        
        if (profileRows.length > 0) {
            userInstitutionId = profileRows[0].institution_id;
            userInstName = profileRows[0].inst_name; // 👈 ดึงชื่อมาเก็บไว้
        }

        if (offset === 0) {
            const [userRows]: any = await connection.execute(
                `SELECT bfi_o, bfi_c, bfi_e, bfi_a, bfi_n, sjt_lead, sjt_plan, sjt_support 
                 FROM user_ai_features WHERE user_id_ref = ?`, [userId]
            );
            if (userRows.length > 0) {
                const u = userRows[0];
                personal_data = {
                    'Openness': Math.round(u.bfi_o * 100), 'Conscientious': Math.round(u.bfi_c * 100),
                    'Extraversion': Math.round(u.bfi_e * 100), 'Agreeable': Math.round(u.bfi_a * 100),
                    'Neuroticism': Math.round(u.bfi_n * 100), 'Leadership': Math.round(u.sjt_lead * 100),
                    'Planning': Math.round(u.sjt_plan * 100), 'Support': Math.round(u.sjt_support * 100)
                };
            }
        }

        // 🚀 สร้างตัวแปรแยกเก็บเงื่อนไข WHERE เพื่อความปลอดภัย ไม่บั๊กเวลานับจำนวน
        let whereClause = ` FROM projects p WHERE p.is_recruiting = TRUE`;
        let queryParams: any[] = [];

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

        // กรองตาม Text Search
        if (q) {
            whereClause += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)`;
            const searchPattern = `%${q}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        // 1. นำ whereClause ไปนับจำนวนทั้งหมดก่อน
        const countSql = `SELECT COUNT(*) as total` + whereClause;
        const [countRows]: any = await connection.execute(countSql, queryParams);
        const totalProjects = countRows[0].total;
        const hasMore = (offset + limit) < totalProjects;

        // 2. นำ whereClause ไปดึงข้อมูลจริงแบบจำกัดจำนวน (LIMIT / OFFSET)
        const sql = `SELECT 
            p.id, p.visibility_type AS \`group\`, p.title AS name, p.description, p.tags AS tag,
            p.target_inst_id, p.subject_code, p.section, 
            p.env_type, p.status, p.is_recruiting,
            (SELECT COUNT(*) FROM project_members WHERE project_id_ref = p.id AND member_status = 'ACTIVE') AS current_members
            ` + whereClause + ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;

        // แนบ Limit กับ Offset ต่อท้ายตัวแปรที่ไว้ใช้ Execute
        const fetchParams = [...queryParams, limit.toString(), offset.toString()];
        const [projectRows]: any = await connection.execute(sql, fetchParams);

        // คำนวณ AI
        const projectsData = await Promise.all(projectRows.map(async (p: any) => {
            let compatibleScore = 0;
            try {
                const aiPayload = await getModelInputData(p.id, userId, true);
                if (aiPayload && aiPayload.members.length > 0) {
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
            } catch (error) { }

            let parsedTags = [];
            try { parsedTags = typeof p.tag === 'string' ? JSON.parse(p.tag) : p.tag; } catch (e) { }

            return {
                id: p.id, group: p.group, name: p.name, description: p.description,
                compatible: compatibleScore || 0, tag: parsedTags, members: `${p.current_members}/5`,
                target_inst_id: p.target_inst_id, subject_code: p.subject_code, section: p.section,
                env_type: p.env_type,
                status: p.status,
                is_recruiting: p.is_recruiting
            };
        }));

        // 🚀 คืนค่า userInstName กลับไปให้หน้าบ้านด้วย
        return NextResponse.json({ personal_data, projectsData, hasMore, userInstName });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}