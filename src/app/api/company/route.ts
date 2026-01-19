import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db"; // your mysql pool

export async function GET(req: NextRequest) {
  try {
    const [rows] = await pool.query(
      "SELECT company_id, company_name FROM company"
    );

    return NextResponse.json(rows); // ✅ just return the rows
  } catch (error: any) {
    console.error("company fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
