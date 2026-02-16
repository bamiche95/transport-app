import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromJWT();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const jobId = parseInt(id, 10);
  if (isNaN(jobId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    // 1. Fetch Bin Details
    const [jobRow] = await pool.query(
      `SELECT 
  j.*,
  CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_label,
  c.customer_name AS customer_label, -- Alias this for easier frontend mapping
  cm.company_name,
  jt.job_type_name,
  wt.waste_type_name,
  bt.bin_name,
  js.job_status_name
  FROM jobs j
LEFT JOIN customer c ON j.customer_id = c.customer_id
LEFT JOIN company cm ON j.company_id = cm.company_id
LEFT JOIN waste_types wt ON j.waste_type_id = wt.waste_type_id
LEFT JOIN bintype bt ON j.bin_type_id = bt.bin_type_id
LEFT JOIN jobtype jt ON j.job_type_id = jt.job_type_id
LEFT JOIN users u ON j.assigned_to = u.user_id
LEFT JOIN job_status js ON j.job_status_id = js.job_status_id
WHERE j.job_id = ?`,
      [jobId]
    );

    const jobData = Array.isArray(jobRow) ? jobRow[0] : null;

    if (!jobData) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    // 2. Fetch the associated Movements (the "slots")
    const [movements]: any = await pool.query(
      `SELECT jb.*, b.bin_number,  jt.job_type_name 
         FROM job_bins jb
         LEFT JOIN bins b ON jb.bin_id = b.bin_id
         LEFT JOIN jobs j ON jb.job_id = j.job_id
         LEFT JOIN jobtype jt ON j.job_type_id = jt.job_type_id
         WHERE jb.job_id = ?`,
      [jobId]
    );
    return NextResponse.json({
      jobData,
      movements
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

  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // 1. Fetch current record to preserve existing values
    const [existingRows]: any = await connection.query(
      "SELECT * FROM jobs WHERE job_id = ?",
      [id]
    );

    if (existingRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const current = existingRows[0];

    // 2. Destructure with fallback (Whitelist)
    const { movements,
      customer_id = current.customer_id,
      bin_type_id = current.bin_type_id,
      company_id = current.company_id,
      qty = current.qty,
      job_date = current.job_date,
      company_notes = current.company_notes,
      job_type_id = current.job_type_id,
      job_status_id = current.job_status_id,
      jobs_notes = current.jobs_notes,
      opening_times = current.opening_times,
      office_notes = current.office_notes,
      booking_portal_id = current.booking_portal_id,
      priority = current.priority,
      phone_number = current.phone_number,
      contact_name = current.contact_name,
      address = current.address,
      postcode = current.postcode,
      city = current.city,
      town = current.town,
      country = current.country,
      sic_code = current.sic_code,
      waste_type_id = current.waste_type_id,
      assigned_to = current.assigned_to
    } = body;

    const safeLugLock = body.lug_lock !== undefined ? (body.lug_lock ? 1 : 0) : current.lug_lock;
    const safeAdr = body.adr !== undefined ? (body.adr ? 1 : 0) : current.adr;
    const formattedDate = body.job_date ? new Date(body.job_date) : current.job_date;
    const formattedDateTime = body.job_datetime ? new Date(body.job_datetime) : current.job_datetime;

    // 5. Execute Update - USING connection instead of pool
    // 5. Update Customer Record (SYNC)
    if (customer_id) {
      await connection.query(
        `UPDATE customer SET 
           address = ?, city = ?, town = ?, postcode = ?, country = ?, 
           contact_name = ?, phone_number = ?, sic_code = ?, company_notes = ?,
           modified_at = NOW()
         WHERE customer_id = ?`,
        [
          address, city, town, postcode, country,
          contact_name, phone_number, sic_code, company_notes,
          customer_id
        ]
      );
    }

    // 6. Execute Job Update
    await connection.query(
      `UPDATE jobs SET 
        customer_id = ?, bin_type_id = ?, company_id = ?, qty = ?, 
        job_date = ?, job_datetime = ?, company_notes = ?, job_type_id = ?, job_status_id = ?, 
        jobs_notes = ?, opening_times = ?, office_notes = ?, booking_portal_id = ?, 
        adr = ?, lug_lock = ?, priority = ?, phone_number = ?, 
        contact_name = ?, address = ?, postcode = ?, city = ?, 
        town = ?, country = ?, sic_code = ?, waste_type_id = ?, assigned_to =?,
        modified_by = ?, modified_at = NOW()
       WHERE job_id = ?`,
      [
        customer_id, bin_type_id, company_id, qty,
        formattedDate, formattedDateTime, company_notes, job_type_id, job_status_id,
        jobs_notes, opening_times, office_notes, booking_portal_id,
        safeAdr, safeLugLock, priority, phone_number,
        contact_name, address, postcode, city,
        town, country, sic_code, waste_type_id, assigned_to,
        user.id, id
      ]
    );



    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await connection.rollback();
    console.error("Jobs PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}



export async function DELETE(req: NextRequest,
  { params }: { params: Promise<{ id: number }> }) {
  const connection = await pool.getConnection();
  try {
    const { id } = await params;
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connection.query("DELETE FROM binhistory WHERE job_id = ?", [id]);
    await connection.query("DELETE FROM job_bins WHERE job_id = ?", [id]);
    await connection.query("DELETE FROM jobs WHERE job_id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Jobs DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}