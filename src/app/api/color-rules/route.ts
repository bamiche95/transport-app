import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query("SELECT * FROM bin_type_color_rules ORDER BY created_at DESC");
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { match_term, color_code, text_color } = body;

        if (!match_term || !color_code) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [result] = await pool.query(
            "INSERT INTO bin_type_color_rules (match_term, color_code, text_color) VALUES (?, ?, ?)",
            [match_term, color_code, text_color || '#000000']
        );

        const newId = (result as any).insertId;
        return NextResponse.json({ id: newId, match_term, color_code, text_color }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
