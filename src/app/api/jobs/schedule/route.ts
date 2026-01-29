import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const { job_id, dates } = await req.json();

  if (!job_id || !Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json({ error: "Missing job or dates" }, { status: 400 });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Fetch original job
    const [[job]]: any = await connection.query(
      "SELECT * FROM jobs WHERE job_id = ?",
      [job_id]
    );

    if (!job) {
      throw new Error("Original job not found");
    }

    // Remove fields we do NOT want to copy
    delete job.job_id;
    delete job.created_at;
    delete job.updated_at;

    for (const date of dates) {
      await connection.query(
        `INSERT INTO jobs (
          customer_id, job_type_id, bin_type_id, qty,
          company_id, job_status_id, job_date,job_datetime,
          jobs_notes, contact_name, phone_number,
          address, city, town, postcode,
          priority, office_notes, lug_lock, adr,
          waste_type_id, assigned_to
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          job.customer_id,
          job.job_type_id,
          job.bin_type_id,
          job.qty,
          job.company_id,
          job.job_status_id, // or force "Scheduled"
          date,
          date,
          job.jobs_notes,
          job.contact_name,
          job.phone_number,
          job.address,
          job.city,
          job.town,
          job.postcode,
          job.priority,
          job.office_notes,
          job.lug_lock,
          job.adr,
          job.waste_type_id,
          job.assigned_to
        ]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    await connection.rollback();
    console.error("Schedule Job Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
