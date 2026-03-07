import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() { // ต้องเป็นตัวพิมพ์ใหญ่ GET
    try {
        const connection = await db();
        const [rows] = await connection.query('SELECT 1 + 1 AS result');
        await connection.end();

        return NextResponse.json({ 
            status: 'Connected!', 
            data: rows 
        });
    } catch (error: any) {
        return NextResponse.json({ 
            status: 'Error', 
            message: error.message 
        }, { status: 500 });
    }
}