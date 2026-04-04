import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const targetUserId = (await params).id;
    const connection = await db();

    try {
        const [userRows]: any = await connection.execute(
            `SELECT u.id, u.full_name, u.email, 
                    up.primary_role, up.province, up.user_description, up.profile_image, 
                    i.name_th AS institution_name
             FROM users u
             LEFT JOIN user_profiles up ON u.id = up.user_id_ref
             LEFT JOIN institutions i ON up.institution_id = i.id
             WHERE u.id = ?`,
            [targetUserId]
        );

        if (userRows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user: userRows[0] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        await connection.end();
    }
}