import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// ---------------------------------------------------------
// 1. ส่วนของ GET (คงเดิมแต่ปรับปรุงการเช็คสถานะสมาชิก)
// ---------------------------------------------------------

// ... (ฟังก์ชัน getCurrentUserId เหมือนเดิม) ...

export async function GET(req: NextRequest) {
    let connection;
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('projectId');
        const targetId = searchParams.get('targetId');

        if (!projectId || !targetId) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("teamder_access_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const baseUrl = new URL(req.url).origin;
        const authRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { "Cookie": `teamder_access_token=${token}` }
        });
        const authData = await authRes.json();
        const myUserId = authData.user?.id;
        const myName = authData.user?.full_name || "You"; // ดึงชื่อเรามาด้วย

        if (!myUserId) return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
        if (myUserId == targetId) return NextResponse.json({ error: "ไม่สามารถประเมินตัวเองได้" }, { status: 403 });

        connection = await db();

        // 🚀 ดึงข้อมูลโปรเจกต์และชื่อเพื่อน
        const [projectInfo]: any = await connection.execute(
            `SELECT p.title as project_title, u.full_name as target_name 
             FROM projects p
             JOIN users u ON u.id = ?
             WHERE p.id = ?`,
            [targetId, projectId]
        );

        if (projectInfo.length === 0) return NextResponse.json({ error: "ไม่พบข้อมูลโครงการหรือผู้ใช้" }, { status: 404 });

        // เช็คสิทธิ์ในโปรเจกต์
        const [members]: any = await connection.execute(
            `SELECT user_id_ref FROM project_members 
             WHERE project_id_ref = ? 
             AND user_id_ref IN (?, ?) 
             AND member_status IN ('ACTIVE', 'LEAVE_PENDING')
             AND deleted_at IS NULL`, 
            [projectId, myUserId, targetId]
        );

        if (members.length < 2) {
            return NextResponse.json({ error: "คุณหรือเพื่อนไม่ได้อยู่ในโปรเจกต์นี้แล้ว" }, { status: 403 });
        }

        // เช็คว่าเคยประเมินไปแล้วหรือยัง
        const [existing]: any = await connection.execute(
            `SELECT id FROM peer_evaluations 
             WHERE project_id_ref = ? AND evaluator_id_ref = ? AND target_id_ref = ?`,
            [projectId, myUserId, targetId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ success: false, alreadyDone: true });
        }

        // ดึงคำถาม
        const [rows]: any = await connection.execute("SELECT * FROM questionsReport ORDER BY RAND()");
        const questions = rows.map((q: any) => ({
            ...q,
            ans: typeof q.ans === 'string' ? JSON.parse(q.ans) : q.ans
        }));

        // 🚀 ส่งข้อมูล meta กลับไปให้หน้าบ้าน
        return NextResponse.json({ 
            success: true, 
            questions,
            meta: {
                projectTitle: projectInfo[0].project_title,
                evaluatorName: myName,
                targetName: projectInfo[0].target_name
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}

// ... (ส่วนของ POST เหมือนเดิม) ...

// ---------------------------------------------------------
// 2. ส่วนของ POST: บันทึกคะแนน (อัปเดตการเช็คสิทธิ์)
// ---------------------------------------------------------
export async function POST(req: NextRequest) {
    let connection;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("teamder_access_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. ตรวจสอบตัวตนผู้ประเมินจาก Token
        const baseUrl = new URL(req.url).origin;
        const authRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { "Cookie": `teamder_access_token=${token}` }
        });
        const authData = await authRes.json();
        const evaluatorId = authData.user?.id;

        if (!evaluatorId) return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });

        const body = await req.json();
        const { projectId, targetId, results } = body;

        if (!projectId || !targetId || !results) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        if (evaluatorId == targetId) {
            return NextResponse.json({ error: "ไม่สามารถประเมินตัวเองได้" }, { status: 403 });
        }

        connection = await db();

        // 2. เช็คสิทธิ์สมาชิกในโปรเจกต์ (ทั้งผู้ประเมินและผู้ถูกประเมิน)
        const [members]: any = await connection.execute(
            `SELECT user_id_ref FROM project_members 
             WHERE project_id_ref = ? 
             AND user_id_ref IN (?, ?) 
             AND member_status IN ('ACTIVE', 'LEAVE_PENDING')
             AND deleted_at IS NULL`, 
            [projectId, evaluatorId, targetId]
        );

        if (members.length < 2) {
            return NextResponse.json({ 
                error: "คุณหรือผู้ถูกประเมินไม่ได้อยู่ในโปรเจกต์นี้แล้ว" 
            }, { status: 403 });
        }

        // 3. เช็คว่าเคยประเมินไปแล้วหรือยัง (ป้องกัน Double Submit)
        const [existing]: any = await connection.execute(
            `SELECT id FROM peer_evaluations 
             WHERE project_id_ref = ? AND evaluator_id_ref = ? AND target_id_ref = ?`,
            [projectId, evaluatorId, targetId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "คุณได้ประเมินสมาชิกท่านนี้ในโปรเจกต์นี้ไปแล้ว" }, { status: 409 });
        }

        // 4. คำนวณคะแนน BFI/SJT
        const bfi: any = { o: {t:0,c:0}, c: {t:0,c:0}, e: {t:0,c:0}, a: {t:0,c:0}, n: {t:0,c:0} };
        const sjt: any = { lead: {t:0,c:0}, plan: {t:0,c:0}, support: {t:0,c:0} };

        results.forEach((item: any) => {
            const cat = item.cat.toUpperCase();
            const pts = Number(item.points) || 0;
            if (cat.startsWith('BFI_')) {
                const p = cat.split('_');
                const key = p[1].toLowerCase();
                if (bfi[key]) {
                    bfi[key].t += (p[2] === 'R' ? (6 - pts) : pts);
                    bfi[key].c += 1;
                }
            } else if (cat.includes('SJT_')) {
                if (cat.includes('LEAD')) { sjt.lead.t += pts; sjt.lead.c += 1; }
                else if (cat.includes('PLAN')) { sjt.plan.t += pts; sjt.plan.c += 1; }
                else if (cat.includes('SUPPORT')) { sjt.support.t += pts; sjt.support.c += 1; }
            }
        });

        // สูตรแปลงคะแนนให้อยู่ในสเกล 0-1 (Normalized)
        const formatScore = (obj: any) => (obj.c > 0 ? parseFloat(((obj.t / obj.c - 1) / 4).toFixed(4)) : 0);

        // 5. บันทึกข้อมูล
        const insertSql = `
            INSERT INTO peer_evaluations 
            (project_id_ref, evaluator_id_ref, target_id_ref, bfi_o, bfi_c, bfi_e, bfi_a, bfi_n, sjt_lead, sjt_plan, sjt_support)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.execute(insertSql, [
            projectId, evaluatorId, targetId,
            formatScore(bfi.o), formatScore(bfi.c), formatScore(bfi.e), formatScore(bfi.a), formatScore(bfi.n),
            formatScore(sjt.lead), formatScore(sjt.plan), formatScore(sjt.support)
        ]);

        return NextResponse.json({ success: true, message: "บันทึกการประเมินสำเร็จ" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}