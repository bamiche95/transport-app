import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const body = await req.json();
    const {
      jobs_notes, customer_id, bin_type_id, qty, company_id, job_status_id,
      company_notes, job_date, contact_name, job_type_id, sic_code,
      assigned_to, priority, address, postcode, city, office_notes,
      phone_number, lug_lock, adr, booking_portal_id, waste_type_id, town
    } = body;

    if (!customer_id || !bin_type_id || !company_id || !job_type_id || !job_status_id) {
      await connection.rollback();
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sqlDateTime = job_date ? job_date.replace("T", " ") + ":00" : null;

    // Insert the job only — no job_bins logic here
    const [result] = await connection.query(
      `INSERT INTO jobs (
        jobs_notes, customer_id, bin_type_id, qty, company_id, job_status_id,
        company_notes, job_datetime, job_date,
        contact_name, job_type_id, sic_code, assigned_to,
        priority, address, postcode, city, office_notes, phone_number,
        lug_lock, adr, booking_portal_id, waste_type_id, town,
        created_by, modified_by, created_at, modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        jobs_notes, customer_id, bin_type_id, qty, company_id, job_status_id,
        company_notes,
        sqlDateTime,
        sqlDateTime,
        contact_name, job_type_id, sic_code, assigned_to,
        String(priority),
        address, postcode, city, office_notes, phone_number,
        lug_lock ? 1 : 0,
        adr ? 1 : 0,
        booking_portal_id, waste_type_id, town,
        user.id, user.id
      ]
    );

    const newJobId = (result as any).insertId;

    await connection.commit();
    return NextResponse.json({ success: true, jobId: newJobId });

  } catch (error: any) {
    await connection.rollback();
    console.error("Create Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}


export async function GET(req: NextRequest) {
  const user = await getUserFromJWT();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [row] = await pool.query(
      `SELECT 
      j.*,
      CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_label,
      c.customer_name,
      cm.company_name,
      jt.job_type_name,
      wt.waste_type_name,
      bt.bin_name,
      js.job_status_name as status
      FROM jobs j
      LEFT JOIN customer c ON j.customer_id = c.customer_id
      LEFT JOIN company cm ON j.company_id = cm.company_id
      LEFT jOIN waste_types wt ON j.waste_type_id = wt.waste_type_id
      LEFT JOIN bintype bt ON j.bin_type_id = bt.bin_type_id
      LEFT JOIN jobtype jt ON j.job_type_id = jt.job_type_id
      LEFT JOIN users u ON j.assigned_to = u.user_id
      LEFT JOIN job_status js ON j.job_status_id = js.job_status_id
      ORDER BY j.job_date DESC;`,
      []
    )
    return NextResponse.json(row);
  } catch (error: any) {
    console.error("failed to fetch jobs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}