import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 🚀 ฟังก์ชันช่วยเหลือในการดึง ID ผู้ใช้งานปัจจุบันจาก Cookie (เหมือนที่คุณใช้ในหน้าทีม)
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

export async function POST(req: NextRequest) {
    let connection;
    try {
        const body = await req.json();
        const { results } = body;
        
        // ใช้ ID จาก Token เป็นหลัก เพื่อความปลอดภัย
        const userId = await getCurrentUserId(req) || body.userId; 

        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const scores: Record<string, number> = {
            bfi_o: 0, bfi_c: 0, bfi_e: 0, bfi_a: 0, bfi_n: 0,
            sjt_lead: 0, sjt_plan: 0, sjt_support: 0
        };

        const counts: Record<string, number> = {
            bfi_o: 0, bfi_c: 0, bfi_e: 0, bfi_a: 0, bfi_n: 0,
            sjt_lead: 0, sjt_plan: 0, sjt_support: 0
        };

        results.forEach((item: any) => {
            if (item.cat) {
                const parts = item.cat.toLowerCase().split('_'); 
                const dbColumn = `${parts[0]}_${parts[1]}`;
                
                if (scores.hasOwnProperty(dbColumn)) {
                    let points = Number(item.points);
                    
                    if (!isNaN(points)) {
                        if (parts.length === 3 && parts[2] === 'r') {
                            points = 6 - points;
                        }

                        scores[dbColumn] += points;
                        counts[dbColumn] += 1;
                    }
                }
            }
        });

        for (const key in scores) {
            if (counts[key] > 0) {
                const average = scores[key] / counts[key];
                scores[key] = (average - 1) / 4;
            } else {
                scores[key] = 0;
            }
        }

        connection = await db();

        const query = `
        INSERT INTO user_ai_features 
        (user_id_ref, bfi_o, bfi_c, bfi_e, bfi_a, bfi_n, sjt_lead, sjt_plan, sjt_support) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        bfi_o = VALUES(bfi_o),
        bfi_c = VALUES(bfi_c),
        bfi_e = VALUES(bfi_e),
        bfi_a = VALUES(bfi_a),
        bfi_n = VALUES(bfi_n),
        sjt_lead = VALUES(sjt_lead),
        sjt_plan = VALUES(sjt_plan),
        sjt_support = VALUES(sjt_support)
        `;

        const values = [
            userId,
            scores.bfi_o, scores.bfi_c, scores.bfi_e, scores.bfi_a, scores.bfi_n,
            scores.sjt_lead, scores.sjt_plan, scores.sjt_support
        ];

        const [result] = await connection.execute(query, values);
        
        return NextResponse.json({ success: true, insertId: (result as any).insertId });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}

export async function GET(req: NextRequest) {
    // 🚀 เช็คก่อนว่า User นี้มีข้อมูลในตาราง user_ai_features แล้วหรือยัง
    const userId = await getCurrentUserId(req);
    
    if (userId) {
        const connection = await db();
        try {
            const [rows]: any = await connection.execute(
                `SELECT id FROM user_ai_features WHERE user_id_ref = ? LIMIT 1`,
                [userId]
            );
            
            // ถ้ามีแล้ว (เคยทำแล้ว) ให้คืนค่าบอกหน้าบ้านไปเลย ไม่ต้องส่งข้อสอบไป
            if (rows.length > 0) {
                return NextResponse.json({ alreadyCompleted: true });
            }
        } catch (error) {
            console.error("DB Check Error:", error);
        } finally {
            await connection.end();
        }
    }

    const data = [
        // --- EXTRAVERSION (E) ---
        {"id":"bfi01","question":"เป็นคนกระตือรือร้นและชอบเข้าสังคม","cat":"BFI_E_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi06","question":"เป็นคนเงียบๆ และเก็บตัว","cat":"BFI_E_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi11","question":"เป็นคนเต็มเปี่ยมไปด้วยพลังงาน","cat":"BFI_E_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi16","question":"มักสร้างความตื่นเต้นและกระตือรือร้นให้คนรอบข้าง","cat":"BFI_E_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi21","question":"ค่อนข้างนิ่งเฉยและไม่ค่อยพูด","cat":"BFI_E_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi26","question":"เป็นคนหนักแน่นและมีอิทธิพลต่อผู้อื่น","cat":"BFI_E_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi31","question":"เป็นคนขี้อายและไม่ชอบแสดงออก","cat":"BFI_E_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi36","question":"เป็นคนชอบออกตัวและร่าเริง","cat":"BFI_E_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},

        // --- AGREEABLENESS (A) ---
        {"id":"bfi02","question":"ชอบจับผิดผู้อื่น","cat":"BFI_A_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi07","question":"เป็นคนชอบช่วยเหลือและเห็นอกเห็นใจผู้อื่น","cat":"BFI_A_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi12","question":"มักจะเริ่มโต้เถียงกับผู้อื่น","cat":"BFI_A_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi17","question":"เป็นคนมีจิตใจโอบอ้อมอารีและให้อภัยเก่ง","cat":"BFI_A_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi22","question":"เป็นคนที่ไว้วางใจผู้อื่นได้ง่าย","cat":"BFI_A_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi27","question":"บางครั้งอาจทำตัวเย็นชาและไม่สนใจใคร","cat":"BFI_A_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi32","question":"เป็นคนสุภาพและนอบน้อมกับเกือบทุกคน","cat":"BFI_A_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi37","question":"บางครั้งอาจจะหยาบคายกับผู้อื่น","cat":"BFI_A_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi42","question":"เป็นคนที่ให้ความร่วมมือกับผู้อื่นเสมอ","cat":"BFI_A_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},

        // --- CONSCIENTIOUSNESS (C) ---
        {"id":"bfi03","question":"ทำงานอย่างละเอียดถี่ถ้วน","cat":"BFI_C_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi08","question":"มักจะสะเพร่าหรือทำตัวเลินเล่อ","cat":"BFI_C_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi13","question":"เป็นคนทำงานหนักและพึ่งพาได้","cat":"BFI_C_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi18","question":"ไม่ค่อยมีความเป็นระเบียบเรียบร้อย","cat":"BFI_C_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi23","question":"มักจะขี้เกียจหรือผัดวันประกันพรุ่ง","cat":"BFI_C_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi28","question":"มักจะมุ่งมั่นทำงานจนกว่าจะสำเร็จ","cat":"BFI_C_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi33","question":"พยายามทำสิ่งต่างๆ ให้มีประสิทธิภาพที่สุด","cat":"BFI_C_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi38","question":"เป็นคนมีระเบียบวินัยและทำตามแผนที่วางไว้","cat":"BFI_C_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi43","question":"มักจะฟุ้งซ่านและเสียสมาธิได้ง่าย","cat":"BFI_C_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},

        // --- NEUROTICISM (N) ---
        {"id":"bfi04","question":"เป็นคนวิตกกังวลและเครียดง่าย","cat":"BFI_N_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi09","question":"เป็นคนใจเย็นและจัดการความเครียดได้ดี","cat":"BFI_N_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi14","question":"มักจะมีอารมณ์แปรปรวนบ่อยครั้ง","cat":"BFI_N_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi19","question":"เป็นคนที่มักจะกังวลมากเกินไป","cat":"BFI_N_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi24","question":"เป็นคนมั่นคงทางอารมณ์ ไม่หวั่นไหวง่าย","cat":"BFI_N_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi29","question":"เป็นคนอารมณ์อ่อนไหวได้ง่าย","cat":"BFI_N_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi34","question":"ยังคงรักษาสงบสติอารมณ์ได้ดีในยามวิกฤต","cat":"BFI_N_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi39","question":"บางครั้งอาจจะรู้สึกซึมเศร้าหรือหดหู่","cat":"BFI_N_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},

        // --- OPENNESS (O) ---
        {"id":"bfi05","question":"มีความคิดสร้างสรรค์และไอเดียใหม่ๆ เสมอ","cat":"BFI_O_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi10","question":"สนใจใคร่รู้ในเรื่องต่างๆ หลากหลาย","cat":"BFI_O_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi15","question":"เป็นคนช่างคิดและมีจินตนาการสูง","cat":"BFI_O_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi20","question":"เป็นคนช่างสงสัยและใฝ่รู้","cat":"BFI_O_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi25","question":"เป็นคนมีความคิดลึกซึ้งและมีรสนิยมทางศิลปะ","cat":"BFI_O_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi30","question":"ชอบความสวยงามและความสุนทรีย์","cat":"BFI_O_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi35","question":"ชอบทำงานที่ซ้ำซากจำเจและไม่เปลี่ยนแปลง","cat":"BFI_O_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi40","question":"ชอบศึกษาหาความรู้ใหม่ๆ ที่ท้าทาย","cat":"BFI_O_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi41","question":"ไม่ค่อยมีความสนใจในเรื่องความคิดเชิงนามธรรม","cat":"BFI_O_R","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},
        {"id":"bfi44","question":"มีความเชี่ยวชาญด้านศิลปะ เพลง หรือวรรณกรรม","cat":"BFI_O_N","type":["radio"],"ans":{"1":1,"2":2,"3":3,"4":4,"5":5}},

        {
            "id": "sjt_l01",
            "question": "เมื่อทีมมีความเห็นขัดแย้งกันอย่างรุนแรงในการเลือกวิธีทำงาน คุณจะจัดการอย่างไร",
            "cat": "sjt_lead",
            "type": ["radio"],
            "ans": {
                "1": "ปล่อยให้ทีมเถียงกันจนกว่าจะได้ข้อสรุปเอง",
                "2": "สั่งให้ใช้วิธีของคุณทันทีเพื่อตัดปัญหา",
                "3": "ให้คนส่วนใหญ่ในทีมโหวตโดยไม่ฟังเสียงข้างน้อย",
                "4": "เรียกประชุมเพื่อฟังเหตุผลของทุกฝ่ายแล้วตัดสินใจร่วมกัน",
                "5": "รับฟังทุกฝ่าย และเสนอทางออกที่เป็นกลางซึ่งรวมข้อดีของทุกแนวคิดเข้าด้วยกัน"
            }
        },
        {
            "id": "sjt_l02",
            "question": "หากลูกน้องในทีมทำผิดพลาดร้ายแรงจนส่งผลต่อภาพรวม คุณจะทำอย่างไร",
            "cat": "sjt_lead",
            "type": ["radio"],
            "ans": {
                "1": "ตำหนิอย่างรุนแรงต่อหน้าคนอื่นเพื่อให้จดจำ",
                "2": "รายงานผู้บริหารทันทีเพื่อปัดความรับผิดชอบ",
                "3": "เพิกเฉยและหวังว่าเขาจะแก้ไขได้เอง",
                "4": "พูดคุยส่วนตัวเพื่อหาสาเหตุและช่วยหาวิธีแก้ไข",
                "5": "แสดงความรับผิดชอบในฐานะผู้นำ พร้อมร่วมกับลูกน้องวิเคราะห์บทเรียนเพื่อวางระบบป้องกันในอนาคต"
            }
        },

        // --- SJT_PLAN (การวางแผนและการจัดการ) ---
        {
            "id": "sjt_p01",
            "question": "คุณได้รับงานด่วน 3 งานพร้อมกัน โดยทุกงานมีกำหนดส่งเย็นนี้ คุณจะทำอย่างไร",
            "cat": "sjt_plan",
            "type": ["radio"],
            "ans": {
                "1": "เริ่มทำทุกงานพร้อมกันทีละนิด",
                "2": "เลือกทำข้อที่ง่ายที่สุดให้เสร็จก่อนโดยไม่ดูความสำคัญ",
                "3": "แจ้งหัวหน้าว่าทำไม่ทันและขอไม่ทำสักงาน",
                "4": "เรียงลำดับความสำคัญตามผลกระทบต่อบริษัทแล้วค่อยๆ ทำทีละงาน",
                "5": "วิเคราะห์ความสำคัญและระยะเวลา แจ้งผู้เกี่ยวข้องถึงลำดับการส่ง และกระจายงานบางส่วนหากทำได้"
            }
        },
        {
            "id": "sjt_p02",
            "question": "หากแผนงานที่วางไว้ไม่เป็นไปตามเป้าหมายเนื่องจากปัจจัยภายนอก คุณจะทำอย่างไร",
            "cat": "sjt_plan",
            "type": ["radio"],
            "ans": {
                "1": "ล้มเลิกแผนงานนั้นทันที",
                "2": "ทำตามแผนเดิมต่อไปแม้จะรู้ว่าไม่ได้ผล",
                "3": "โทษปัจจัยภายนอกว่าเป็นสาเหตุที่ทำให้งานพัง",
                "4": "หยุดพักเพื่อรอดูสถานการณ์ให้คลี่คลาย",
                "5": "รีบทบทวนแผนงาน ประเมินความเสี่ยง และปรับเปลี่ยนกลยุทธ์ (Plan B) ทันที"
            }
        },

        // --- SJT_SUPPORT (การสนับสนุนและการทำงานเป็นทีม) ---
        {
            "id": "sjt_s01",
            "question": "เพื่อนร่วมงานดูเครียดและทำงานล่าช้ากว่าปกติ คุณจะทำอย่างไร",
            "cat": "sjt_support",
            "type": ["radio"],
            "ans": {
                "1": "ไปฟ้องหัวหน้าว่าเพื่อนทำงานช้า",
                "2": "ไม่สนใจเพราะไม่ใช่หน้าที่ของเรา",
                "3": "กดดันให้เขาเร่งทำงานเพราะจะส่งผลกระทบต่อเรา",
                "4": "เข้าไปสอบถามด้วยความห่วงใยและให้กำลังใจ",
                "5": "เข้าไปสอบถามและเสนอตัวช่วยสนับสนุนงานในส่วนที่เราพอจะทำได้"
            }
        },
        {
            "id": "sjt_s02",
            "question": "เมื่อทีมได้รับคำชมจากผู้บริหาร แต่คุณเป็นคนทำงานนั้นเกือบทั้งหมด คุณจะทำอย่างไร",
            "cat": "sjt_support",
            "type": ["radio"],
            "ans": {
                "1": "ประกาศให้ทุกคนรู้ว่านี่คือผลงานของคุณคนเดียว",
                "2": "เงียบไว้แต่รู้สึกไม่พอใจคนอื่นในทีม",
                "3": "รับคำชมคนเดียวเพื่อโอกาสในการเลื่อนตำแหน่ง",
                "4": "กล่าวขอบคุณและบอกว่าทุกคนในทีมมีส่วนร่วม",
                "5": "ขอบคุณผู้บริหารและระบุถึงความช่วยเหลือหรือบทบาทที่เพื่อนร่วมงานแต่ละคนส่งเสริมให้งานสำเร็จ"
            }
        }
    ];

    // เปลี่ยนมาส่งเป็น { data: data } แทน เพื่อให้สอดคล้องกับที่มี Property `alreadyCompleted` 
    return NextResponse.json({ data });
}