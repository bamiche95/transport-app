import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const query = `
      -- 1. Get Administrative Edits
  -- 1. Get Administrative Edits
SELECT 
  'EDIT' as record_type,
  ba.activity_id as id,
  ba.field_name,
  ba.old_value,
  ba.new_value,
  ba.created_at as event_date,
  CONCAT(u.first_name, ' ', u.last_name) as user_name,
  c_old.customer_name as old_label,
  c_new.customer_name as new_label,
  s_old.label as old_status,
  s_new.label as new_status,
  -- Added Company Mapping
  comp_old.company_name as old_company,
  comp_new.company_name as new_company,
  NULL as job_id,
  NULL as job_notes
FROM bin_activity ba
LEFT JOIN users u ON ba.user_id = u.user_id
LEFT JOIN customer c_old ON ba.field_name = 'customer_id' AND ba.old_value = c_old.customer_id
LEFT JOIN customer c_new ON ba.field_name = 'customer_id' AND ba.new_value = c_new.customer_id
LEFT JOIN bin_status s_old ON ba.field_name = 'bin_status_id' AND ba.old_value = s_old.bin_status_id
LEFT JOIN bin_status s_new ON ba.field_name = 'bin_status_id' AND ba.new_value = s_new.bin_status_id
-- New Company Joins
LEFT JOIN company comp_old ON ba.field_name = 'company_id' AND ba.old_value = comp_old.company_id
LEFT JOIN company comp_new ON ba.field_name = 'company_id' AND ba.new_value = comp_new.company_id
WHERE ba.bin_id = ?

UNION ALL

-- 2. Get Physical Movements (Jobs)
SELECT 
  'MOVEMENT' as record_type,
  bh.history_id as id,
  'location' as field_name,
  bh.from_location as old_value,
  bh.to_location as new_value,
  bh.moved_at as event_date,
  CONCAT(u.first_name, ' ', u.last_name) as user_name,
  cust_from.customer_name as old_label,
  cust_to.customer_name as new_label,
  NULL as old_status,
  NULL as new_status,
  -- Placeholder for Movement rows
  NULL as old_company,
  NULL as new_company,
  bh.job_id,
  j.jobs_notes as job_notes
FROM binhistory bh
LEFT JOIN users u ON bh.moved_by = u.user_id
LEFT JOIN jobs j ON bh.job_id = j.job_id
LEFT JOIN customer cust_from ON bh.from_location = cust_from.customer_id
LEFT JOIN customer cust_to ON bh.to_location = cust_to.customer_id
WHERE bh.bin_id = ?

ORDER BY event_date DESC
    `;

    const [rows] = await pool.query(query, [id, id]);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Consolidated Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}