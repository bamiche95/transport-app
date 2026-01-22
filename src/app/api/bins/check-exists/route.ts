import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const binNumber = searchParams.get("bin_number");

    if (!binNumber) return NextResponse.json({ exists: false });

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT bin_id FROM bins WHERE bin_number = ?",
            [binNumber]
        );
        return NextResponse.json({ exists: rows.length > 0 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}