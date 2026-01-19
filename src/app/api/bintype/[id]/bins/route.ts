import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const binTypeId = parseInt(id, 10);

    if (isNaN(binTypeId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        b.bin_id,
        b.bin_number,
        b.bin_description,
        bt.bin_name AS bin_type,
        c.customer_name,
        cm.company_name,
        b.printed,
        b.modified_at,
        b.bin_condition AS \`condition\`,
        b.bin_status_id,
        bs.label AS bin_status
      FROM bins b
      LEFT JOIN bintype bt ON b.bin_type_id = bt.bin_type_id
      LEFT JOIN customer c ON b.customer_id = c.customer_id
      LEFT JOIN company cm ON b.company_id = cm.company_id
      LEFT JOIN bin_status bs ON b.bin_status_id = bs.bin_status_id
      WHERE b.bin_type_id = ?
      ORDER BY b.created_at DESC
      `,
      [binTypeId]
    );

    return NextResponse.json(rows || []);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
