import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db"; // your MySQL pool connection

export async function GET(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    // Fetch all jobs with driver info, priority, status, company
    const [rows] = await connection.query(`
      SELECT 
        j.job_id,
        j.priority,
        js.job_status_name,
        c.company_name,
        cu.customer_name,
        j.assigned_to AS driver_id,
        CONCAT(u.first_name, ' ', u.last_name) AS driver_name
      FROM jobs j
      LEFT JOIN job_status js ON j.job_status_id = js.job_status_id
      LEFT JOIN company c ON j.company_id = c.company_id
      LEFT JOIN customer cu ON j.customer_id = cu.customer_id
      LEFT JOIN users u ON j.assigned_to = u.user_id
      ORDER BY j.assigned_to, j.priority ASC
    `);

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("API Error /jobs/by-driver:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
