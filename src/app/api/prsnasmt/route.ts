import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
    let connection;
    try {
        connection = await db();
        
        /**
         * SQL Logic:
         * 1. สร้างก้อน 'main_cat' เช่น 'BFI_E', 'BFI_A', 'SJT_LEAD'
         * 2. ใช้ Window Function สุ่มลำดับภายในกลุ่ม (ROW_NUMBER)
         * 3. เลือกเฉพาะแถวที่ 1 และ 2 ของแต่ละกลุ่ม (หัวข้อละ 2 ข้อ)
         */
        const query = `
            WITH RankedQuestions AS (
                SELECT *,
                    SUBSTRING_INDEX(cat, '_', 2) as main_cat,
                    ROW_NUMBER() OVER (
                        PARTITION BY CASE 
                            WHEN cat LIKE 'BFI_%' THEN SUBSTRING_INDEX(cat, '_', 2)
                            WHEN cat LIKE 'SJT_%' THEN cat
                            ELSE cat 
                        END 
                        ORDER BY RAND()
                    ) as rn
                FROM questions
            )
            SELECT id, question, cat, type, ans 
            FROM RankedQuestions 
            WHERE rn <= 2 
            ORDER BY RAND();
        `;

        const [rows]: any = await connection.execute(query);

        const formattedQuestions = rows.map((q: any) => ({
            ...q,
            ans: typeof q.ans === 'string' ? JSON.parse(q.ans) : q.ans
        }));

        return NextResponse.json({ success: true, questions: formattedQuestions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}
export async function POST(req: NextRequest) {
    let connection;
    try {
        // 1. ดึง user_id_ref จาก Token (เหมือนเดิม)
        const cookieStore = await cookies();
        const token = cookieStore.get("teamder_access_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const baseUrl = new URL(req.url).origin;
        const authRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { "Cookie": `teamder_access_token=${token}` }
        });
        const authData = await authRes.json();
        const internalId = authData.user?.id;
        if (!internalId) return NextResponse.json({ error: "User ID Missing" }, { status: 400 });

        const body = await req.json();
        const { results } = body;

        // 2. ดึงข้อมูลเดิมจาก DB ขึ้นมาดูก่อน (ถ้ามี)
        connection = await db();
        const [oldData]: any = await connection.execute(
            `SELECT * FROM user_ai_features WHERE user_id_ref = ?`, 
            [internalId]
        );

        // 3. เตรียมตัวแปรคำนวณคะแนนรอบปัจจุบัน
        const bfi_raw: any = { o: { t: 0, c: 0 }, c: { t: 0, c: 0 }, e: { t: 0, c: 0 }, a: { t: 0, c: 0 }, n: { t: 0, c: 0 } };
        const sjt_raw: any = { lead: { t: 0, c: 0 }, plan: { t: 0, c: 0 }, support: { t: 0, c: 0 } };

        results.forEach((item: any) => {
            const cat = item.cat.toUpperCase();
            const pts = Number(item.points) || 0;
            if (cat.startsWith('BFI_')) {
                const parts = cat.split('_');
                const key = parts[1].toLowerCase();
                if (bfi_raw[key]) {
                    const actual = (parts[2] === 'R') ? (6 - pts) : pts;
                    bfi_raw[key].t += actual;
                    bfi_raw[key].c += 1;
                }
            } else if (cat.includes('SJT_')) {
                if (cat.includes('LEAD')) { sjt_raw.lead.t += pts; sjt_raw.lead.c += 1; }
                else if (cat.includes('PLAN')) { sjt_raw.plan.t += pts; sjt_raw.plan.c += 1; }
                else if (cat.includes('SUPPORT')) { sjt_raw.support.t += pts; sjt_raw.support.c += 1; }
            }
        });

        // 4. Logic การรวมคะแนน (Merge Old + New)
        // ถ้ามีข้อมูลเก่า เราจะเอาค่าเฉลี่ยเก่ามาคิดเป็น 50% และค่าใหม่ 50% (หรือตามความเหมาะสม)
        // ในที่นี้ใช้วิธีหาค่าเฉลี่ยของ (ค่าเก่า + ค่าใหม่) เพื่อให้คะแนนค่อยๆ เปลี่ยนตามการทำซ้ำ
        const calculateFinal = (newAvg: number, oldAvg: number | null) => {
            if (oldAvg === null || oldAvg === undefined) return parseFloat(((newAvg * 2) / 10).toFixed(4));
            // นำค่าเฉลี่ยเก่ามาเฉลี่ยรวมกับค่าใหม่ (Moving Average แบบง่าย)
            const combined = (newAvg + (oldAvg * 5)) / 2; // คูณ 5 กลับเพื่อให้ scale กลับมาเป็นคะแนน 1-5 ก่อนเฉลี่ย
            return parseFloat(((combined * 2) / 10).toFixed(4));
        };

        const hasOld = oldData.length > 0;
        const old = hasOld ? oldData[0] : {};

        const getAvg = (obj: any) => (obj.c > 0 ? obj.t / obj.c : 0);

        const values = [
            internalId,
            calculateFinal(getAvg(bfi_raw.o), old.bfi_o),
            calculateFinal(getAvg(bfi_raw.c), old.bfi_c),
            calculateFinal(getAvg(bfi_raw.e), old.bfi_e),
            calculateFinal(getAvg(bfi_raw.a), old.bfi_a),
            calculateFinal(getAvg(bfi_raw.n), old.bfi_n),
            calculateFinal(getAvg(sjt_raw.lead), old.sjt_lead),
            calculateFinal(getAvg(sjt_raw.plan), old.sjt_plan),
            calculateFinal(getAvg(sjt_raw.support), old.sjt_support)
        ];

        // 5. บันทึก/อัปเดตข้อมูล
        const query = `
            INSERT INTO user_ai_features 
            (user_id_ref, bfi_o, bfi_c, bfi_e, bfi_a, bfi_n, sjt_lead, sjt_plan, sjt_support) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            bfi_o=VALUES(bfi_o), bfi_c=VALUES(bfi_c), bfi_e=VALUES(bfi_e), 
            bfi_a=VALUES(bfi_a), bfi_n=VALUES(bfi_n),
            sjt_lead=VALUES(sjt_lead), sjt_plan=VALUES(sjt_plan), sjt_support=VALUES(sjt_support)
        `;
        await connection.execute(query, values);

        return NextResponse.json({ success: true, message: "คะแนนถูกอัปเดตและคำนวณรวมกับของเดิมแล้ว" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}