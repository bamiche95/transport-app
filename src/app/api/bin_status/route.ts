
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db"; // your mysql pool

export async function GET(req: NextRequest) {
  try {
    const [rows] = await pool.query(
      "SELECT bin_status_id, label FROM bin_status WHERE is_active = 1"
    );

    return NextResponse.json(rows); // ✅ just return the rows
  } catch (error: any) {
    console.error("Bin status fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
