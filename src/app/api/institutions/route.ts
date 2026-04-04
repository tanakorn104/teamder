import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    let connection;
    try {
        connection = await db();
        const [rows] = await connection.execute("SELECT id, name_th FROM institutions ORDER BY name_th ASC");
        return NextResponse.json({ institutions: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}