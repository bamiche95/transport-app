import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromJWT();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Destructure and validate required fields
    const {
      job_notes, customer_id, bin_type_id, qty, company_id, company_notes,
      job_date, contact_name, job_type_id, sic_code, status, assigned_to,
      priority, address, postcode, city, office_notes, phone_number,
      lug_lock, adr, booking_portal_id, waste_type_id
    } = body;

    // Basic validation for critical fields
    if (!customer_id || !bin_type_id || !company_id || !job_type_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Convert boolean checkboxes to 1/0 for MySQL tinyint
    const safeLugLock = lug_lock ? 1 : 0;
    const safeAdr = adr ? 1 : 0;

    // Format date if needed, usually direct ISO string is fine for Prepared Statements if MySQL is set up right,
    // but 'YYYY-MM-DD HH:MM:SS' is safer if receiving JS Date string.
    const formattedDate = job_date ? new Date(job_date) : new Date();

    const [result] = await pool.query(
      `INSERT INTO jobs (
                jobs_notes, customer_id, bin_type_id, qty, company_id, company_notes,
                job_datetime, contact_name, job_type_id, sic_code, status, assigned_to,
                priority, address, postcode, city, office_notes, phone_number,
                lug_lock, adr, booking_portal_id, waste_type_id,
                created_by, modified_by, created_at, modified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        job_notes, customer_id, bin_type_id, qty, company_id, company_notes,
        formattedDate, contact_name, job_type_id, sic_code, status, assigned_to,
        priority, address, postcode, city, office_notes, phone_number,
        safeLugLock, safeAdr, booking_portal_id, waste_type_id,
        user.id, user.id
      ]
    );

    return NextResponse.json({ success: true, jobId: (result as any).insertId });

  } catch (error: any) {
    console.error("Create Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET (req: NextRequest){

  const user = await getUserFromJWT();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


  try{

    const [row] = await pool.query(
      `SELECT 
      j.*,
     CONCAT(u.first_name, ' ', u.last_name) AS assigned_to_label,
      c.customer_name,
      cm.company_name,
      jt.job_type_name,
      wt.waste_type_name,
      bt.bin_name
      FROM jobs j
     
LEFT JOIN customer c ON j.customer_id = c.customer_id
LEFT JOIN company cm ON j.company_id = cm.company_id
LEFT jOIN waste_types wt ON j.waste_type_id = wt.waste_type_id
LEFT JOIN bintype bt ON j.bin_type_id = bt.bin_type_id
LEFT JOIN jobtype jt ON j.job_type_id = jt.job_type_id
LEFT JOIN users u ON j.assigned_to = u.user_id
ORDER BY j.job_date DESC;
      
      `, [user.id]
    )

return NextResponse.json(row);

  }catch (error: any){
    console.error("failed to fetch jobs:", error);
    return NextResponse.json({error: error.message}, {status:500})
  }

}