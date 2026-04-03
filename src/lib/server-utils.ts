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
        // 1. ดึงข้อมูลโปรเจกต์
        const [projectRows]: any = await connection.execute(
            "SELECT tags, env_type FROM projects WHERE id = ?",
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
        const [memberRows]: any = await connection.execute(
            `SELECT 
                pm.user_id_ref AS user_id,
                uas.final_bfi_o AS O, uas.final_bfi_c AS C, uas.final_bfi_e AS E,
                uas.final_bfi_a AS A, uas.final_bfi_n AS N,
                uas.final_sjt_lead AS \`Lead\`, uas.final_sjt_plan AS Plan, uas.final_sjt_support AS Support
             FROM project_members pm
             JOIN user_ai_scores uas ON pm.user_id_ref = uas.user_id
             WHERE pm.project_id_ref = ? AND pm.member_status = 'ACTIVE'`,
            [projectId]
        );

        // 🚀 ✨ ส่วนเช็คเงื่อนไขการรวมข้อมูลตัวเอง
        if (includeSelf && currentUserId) {
            const isMeInTeam = memberRows.some((m: any) => m.user_id === currentUserId);
            if (!isMeInTeam) {
                const [myScore]: any = await connection.execute(
                    `SELECT 
                        ? AS user_id,
                        final_bfi_o AS O, final_bfi_c AS C, final_bfi_e AS E,
                        final_bfi_a AS A, final_bfi_n AS N,
                        final_sjt_lead AS \`Lead\`, final_sjt_plan AS Plan, final_sjt_support AS Support
                     FROM user_ai_scores WHERE user_id = ?`,
                    [currentUserId, currentUserId]
                );
                if (myScore.length > 0) memberRows.push(myScore[0]);
            }
        }

        // กรณีไม่มีสมาชิกเลย และไม่รวมตัวเองด้วย
        if (memberRows.length === 0) return { project_cfg: { tags: currentTags, env_type: projectRows[0].env_type }, members: [] };

        // 3. เตรียม ID ของทุกคนเพื่อหา Skill
        const userIds = memberRows.map((m: any) => m.user_id);
        const placeholders = userIds.map(() => '?').join(',');

        const [pastProjectsRows]: any = await connection.execute(
            `SELECT pm.user_id_ref AS user_id, p.tags 
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
                    try { pastTags = JSON.parse(pastProj.tags || "[]"); } catch (e) {}
                    if (pastTags.some((tag: string) => currentTags.includes(tag))) matchCount++;
                });

                const calculatedSkill = Number((1 - Math.exp(-k * matchCount)).toFixed(2));

                return {
                    O: Number(row.O), C: Number(row.C), E: Number(row.E), A: Number(row.A), N: Number(row.N),
                    Lead: Number(row.Lead), Plan: Number(row.Plan), Support: Number(row.Support),
                    Skill: calculatedSkill 
                };
            })
        };

    } catch (error) {
        throw error;
    } finally { await connection.end(); }
}