// src/app/api/tags/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    let connection;
    try {
        connection = await db();
        const [rows]: any = await connection.execute("SELECT id, tag_name FROM tags ORDER BY tag_name ASC");
        return NextResponse.json({ tags: rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}