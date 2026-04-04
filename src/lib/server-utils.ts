import { db } from "@/lib/db";

/**
 * @param projectId - ID ของโปรเจกต์
 * @param currentUserId - ID ของผู้ใช้ปัจจุบัน (Optional)
 * @param includeSelf - true = ให้รวมข้อมูลเราเข้าไปคำนวณด้วยถ้าเรายังไม่อยู่ในทีม, false = ดูแค่สมาชิกจริงในทีม
 */
export async function getModelInputData(
    projectId: number, 
    currentUserId?: number | null, 
    includeSelf: boolean = true
) {
    const connection = await db();
    try {
        // 1. ดึงข้อมูลโปรเจกต์ปัจจุบัน พร้อม Tags แบบ Array
        const [projectRows]: any = await connection.execute(
            `SELECT p.env_type, 
                (SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                 FROM project_tags pt 
                 JOIN tags t ON pt.tag_id_ref = t.id 
                 WHERE pt.project_id_ref = p.id) AS tags
             FROM projects p WHERE p.id = ?`,
            [projectId]
        );
        if (projectRows.length === 0) return null;

        let currentTags: string[] = [];
        try {
            currentTags = typeof projectRows[0].tags === 'string' 
                ? JSON.parse(projectRows[0].tags) 
                : projectRows[0].tags;
        } catch (e) { currentTags = []; }

        // 2. ดึงสมาชิกที่มีอยู่แล้วในโปรเจกต์
        // 🚀 แก้ไข: เปลี่ยนชื่อตารางเป็น user_ai_features ตามที่คุณสร้างไว้ก่อนหน้านี้
        const [memberRows]: any = await connection.execute(
            `SELECT 
                pm.user_id_ref AS user_id,
                uas.bfi_o AS O, uas.bfi_c AS C, uas.bfi_e AS E,
                uas.bfi_a AS A, uas.bfi_n AS N,
                uas.sjt_lead AS \`Lead\`, uas.sjt_plan AS Plan, uas.sjt_support AS Support
             FROM project_members pm
             JOIN user_ai_features uas ON pm.user_id_ref = uas.user_id_ref
             WHERE pm.project_id_ref = ? AND pm.member_status = 'ACTIVE'`,
            [projectId]
        );

        // 🚀 ส่วนเช็คเงื่อนไขการรวมข้อมูลตัวเอง
        if (includeSelf && currentUserId) {
            const isMeInTeam = memberRows.some((m: any) => m.user_id === currentUserId);
            if (!isMeInTeam) {
                // 🚀 แก้ไขตารางเป็น user_ai_features
                const [myScore]: any = await connection.execute(
                    `SELECT 
                        ? AS user_id,
                        bfi_o AS O, bfi_c AS C, bfi_e AS E,
                        bfi_a AS A, bfi_n AS N,
                        sjt_lead AS \`Lead\`, sjt_plan AS Plan, sjt_support AS Support
                     FROM user_ai_features WHERE user_id_ref = ?`,
                    [currentUserId, currentUserId]
                );
                if (myScore.length > 0) memberRows.push(myScore[0]);
            }
        }

        // กรณีไม่มีสมาชิกเลย และไม่รวมตัวเองด้วย
        if (memberRows.length === 0) return { project_cfg: { tags: currentTags, env_type: projectRows[0].env_type }, members: [] };

        // 3. เตรียม ID ของทุกคนเพื่อหา Skill จากโปรเจกต์ที่ผ่านมา
        const userIds = memberRows.map((m: any) => m.user_id);
        const placeholders = userIds.map(() => '?').join(',');

        // 💥 แก้ไขจุดที่ 2: เปลี่ยนจากการเรียก p.tags เป็นการดึงผ่าน project_tags 
        const [pastProjectsRows]: any = await connection.execute(
            `SELECT pm.user_id_ref AS user_id, 
                (SELECT COALESCE(JSON_ARRAYAGG(t.tag_name), JSON_ARRAY()) 
                 FROM project_tags pt 
                 JOIN tags t ON pt.tag_id_ref = t.id 
                 WHERE pt.project_id_ref = p.id) AS tags
             FROM project_members pm
             JOIN projects p ON pm.project_id_ref = p.id
             WHERE pm.user_id_ref IN (${placeholders}) 
               AND p.status = 'COMPLETED' AND p.id != ?`,
            [...userIds, projectId]
        );

        const k = 0.2; 

        // 4. ประกอบร่างข้อมูลและคำนวณ Skill
        return {
            project_cfg: {
                tags: currentTags,
                env_type: projectRows[0].env_type || "general"
            },
            members: memberRows.map((row: any) => {
                const userPastProjects = pastProjectsRows.filter((p: any) => p.user_id === row.user_id);
                let matchCount = 0;
                userPastProjects.forEach((pastProj: any) => {
                    let pastTags = [];
                    try { pastTags = typeof pastProj.tags === 'string' ? JSON.parse(pastProj.tags) : pastProj.tags; } catch (e) {}
                    if (pastTags && pastTags.some((tag: string) => currentTags.includes(tag))) matchCount++;
                });

                const calculatedSkill = Number((1 - Math.exp(-k * matchCount)).toFixed(2));

                return {
                    O: Number(row.O || 0), C: Number(row.C || 0), E: Number(row.E || 0), A: Number(row.A || 0), N: Number(row.N || 0),
                    Lead: Number(row.Lead || 0), Plan: Number(row.Plan || 0), Support: Number(row.Support || 0),
                    Skill: calculatedSkill 
                };
            })
        };

    } catch (error) {
        throw error;
    } finally { await connection.end(); }
}