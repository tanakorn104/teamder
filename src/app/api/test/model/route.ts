import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const aiServiceUrl = `${process.env.TeamderNginxServiceURI}/model/predict`;
    const apiKey = process.env.lightGBM_X_API_KEY;

    try {
        // รับข้อมูลที่ส่งมาจากหน้าบ้าน
        const body = await request.json();

        // ส่งต่อไปยัง AI Service
        const response = await fetch(aiServiceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey || '',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}