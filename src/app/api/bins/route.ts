import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // Replace with your actual DB connection helper

export async function GET() {
  try {
    // You might want to JOIN with bin_type or customer to get names instead of just IDs
    const sql = `
      SELECT 
    b.*, 
    bt.bin_name, 
    c.customer_name, 
    cm.company_name,
    bs.label AS bin_status
FROM bins b
-- Ensure 'bintype' is the correct table name and 'bin_type_id' is its PK
LEFT JOIN bintype bt ON b.bin_type_id = bt.bin_type_id 
LEFT JOIN customer c ON b.customer_id = c.customer_id
LEFT JOIN company cm ON b.company_id = cm.company_id
LEFT jOIN bin_status bs ON b.bin_status_id = bs.bin_status_id
ORDER BY b.created_at DESC;
    `;
    const result = await pool.query(sql);
    console.log(result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch bins" }, { status: 500 });
  }
}