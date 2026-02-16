import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const [rows] = await pool.query(
            "SELECT * FROM saved_reports WHERE user_id = ? ORDER BY created_at DESC",
            [user.id]
        );
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { report_name, entity, config_json } = await req.json();

        if (!report_name || !entity || !config_json) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [result]: any = await pool.query(
            "INSERT INTO saved_reports (user_id, report_name, entity, config_json) VALUES (?, ?, ?, ?)",
            [user.id, report_name, entity, JSON.stringify(config_json)]
        );

        return NextResponse.json({ success: true, id: result.insertId });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
