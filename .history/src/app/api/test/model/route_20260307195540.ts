import { NextResponse } from 'next/server';

export async function POST() {
    const aiServiceUrl = `${process.env.TeamderNginxServiceURI}/model/predict`;
    const apiKey = process.env.lightGBM_X_API_KEY;

    // ข้อมูลจำลองสำหรับทดสอบตามที่คุณกำหนด
    const testPayload = {
        members: [
            { O: 0.65, C: 0.85, E: 0.70, A: 0.75, N: 0.20, Lead: 0.90, Plan: 0.80, Support: 0.40, Skill: 0.95, Env_Type: 1 },
            { O: 0.80, C: 0.60, E: 0.40, A: 0.85, N: 0.15, Lead: 0.30, Plan: 0.90, Support: 0.70, Skill: 0.80, Env_Type: 1 },
            { O: 0.50, C: 0.50, E: 0.90, A: 0.40, N: 0.40, Lead: 0.70, Plan: 0.30, Support: 0.20, Skill: 0.85, Env_Type: 1 }
        ]
    };

    try {
        const response = await fetch(aiServiceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey || '',
            },
            body: JSON.stringify(testPayload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'AI Service Error');
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ 
            status: 'Error', 
            message: error.message 
        }, { status: 500 });
    }
}