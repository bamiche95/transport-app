import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromJWT();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const binId = parseInt(id, 10);
  if (isNaN(binId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    // 1. Fetch Bin Details
    const [binRows] = await pool.query(
      `
      SELECT 
        b.*, 
        bt.bin_name, 
        c.customer_name, 
        cm.company_name,
        bs.label AS bin_status_label,
        CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_label
      FROM bins b
      LEFT JOIN bintype bt ON b.bin_type_id = bt.bin_type_id 
      LEFT JOIN customer c ON b.customer_id = c.customer_id
      LEFT JOIN company cm ON b.company_id = cm.company_id
      LEFT JOIN bin_status bs ON b.bin_status_id = bs.bin_status_id
      LEFT JOIN users u ON b.assigned_to = u.user_id
      WHERE b.bin_id = ?
      `,
      [binId]
    );

    const binData = Array.isArray(binRows) ? binRows[0] : null;

    if (!binData) {
      return NextResponse.json({ error: "Bin not found" }, { status: 404 });
    }

    // 2. Fetch Related Jobs via job_bins junction table
    // Assuming table 'job_bins' links jobs and bins
    const [jobRows] = await pool.query(
      `
      SELECT 
        j.*,
        c.customer_name,
        co.company_name
      FROM jobs j
      JOIN job_bins jb ON j.job_id = jb.job_id
      LEFT JOIN customer c ON j.customer_id = c.customer_id
      LEFT JOIN company co ON j.company_id = co.company_id
      WHERE jb.bin_id = ?
      ORDER BY j.job_datetime DESC
      `,
      [binId]
    );

    return NextResponse.json({
      ...binData,
      jobs: Array.isArray(jobRows) ? jobRows : [],
    });

  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Whitelist allowable fields for update
  const {
    bin_number, bin_description, bin_type_id,
    customer_id, company_id, bin_status_id,
    bin_condition, comment, printed, assigned_to
  } = body;

  try {
    await pool.query(
      `UPDATE bins SET 
        bin_number = ?, bin_description = ?, bin_type_id = ?, 
        customer_id = ?, company_id = ?, bin_status_id = ?, 
        bin_condition = ?, comment = ?, printed = ?, assigned_to = ?,
        modified_at = NOW()
       WHERE bin_id = ?`,
      [
        bin_number, bin_description, bin_type_id,
        customer_id, company_id, bin_status_id,
        bin_condition, comment, printed, assigned_to, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await pool.query("DELETE FROM bins WHERE bin_id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 