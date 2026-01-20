import { NextResponse, NextRequest } from "next/server";
import { pool } from "@/lib/db"; // Replace with your actual DB connection helper
import { getUserFromJWT } from "@/lib/auth";

export async function GET() {
  try {
    // You might want to JOIN with bin_type or customer to get names instead of just IDs
    const sql = `
      SELECT 
    b.*, 
    bt.bin_name, 
    c.customer_name, 
    cm.company_name,
    bs.label AS bin_status_label
FROM bins b
-- Ensure 'bintype' is the correct table name and 'bin_type_id' is its PK
LEFT JOIN bintype bt ON b.bin_type_id = bt.bin_type_id 
LEFT JOIN customer c ON b.customer_id = c.customer_id
LEFT JOIN company cm ON b.company_id = cm.company_id
LEFT jOIN bin_status bs ON b.bin_status_id = bs.bin_status_id
ORDER BY b.created_at DESC;
    `;
    const result = await pool.query(sql);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch bins" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { 
      bin_number, 
      bin_description, 
      bin_type_id, 
      customer_id, 
      company_id, 
      bin_status_id, 
      comment, 
      bin_condition, 
      assigned_to,
      printed // Boolean from frontend
    } = body;

    const [result]: any = await pool.query(
      `INSERT INTO bins (
        bin_number, 
        bin_description, 
        bin_type_id, 
        customer_id, 
        company_id, 
        bin_status_id, 
        comment, 
        bin_condition, 
        assigned_to,
        printed,
        created_by, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        bin_number, 
        bin_description || null, 
        bin_type_id || null, 
        customer_id || null, 
        company_id || null, 
        bin_status_id || null, 
        comment || null, 
        bin_condition || 'New', 
        assigned_to || null,
        printed ? 1 : 0, // Convert true/false to 1/0
        user.id
      ]
    );

    return NextResponse.json({ success: true, binId: result.insertId });
  } catch (error: any) {
    console.error("Database Insert Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}