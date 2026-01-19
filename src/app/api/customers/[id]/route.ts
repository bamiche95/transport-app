import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromJWT();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (isNaN(customerId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();

  // Allowed fields to update
  const allowedFields = [
    "customer_name",
    "contact_name",
    "email",
    "phone_number",
    "address",
    "city",
    "town",
    "postcode",
    "country",
    "opening_times",
    "sic_code",
    "company_notes",
    "company_id",
    "assigned_to",
  ];

  const updates = Object.keys(body).filter((k) =>
    allowedFields.includes(k)
  );
  if (!updates.length)
    return NextResponse.json({ error: "No fields to update" });

  const setClause = updates.map((k) => `${k} = ?`).join(", ");
  const values = updates.map((k) => body[k]);

  try {
    await pool.query(
      `
      UPDATE customer
      SET ${setClause},
          modified_by = ?,
          modified_at = NOW()
      WHERE customer_id = ?
    `,
      [...values, user.id, customerId]
    );
// At the end of your PATCH try block:
const [rows] = await pool.query(`
  SELECT 
      c.*, 
      CONCAT(u.first_name, '', last_name) AS assigned_to_name,
      co.company_name
    FROM customer c
     LEFT JOIN users u ON c.assigned_to = u.user_id
    LEFT JOIN company co ON c.company_id = co.company_id
    WHERE c.customer_id = ?
`, [id]) as any[];
return NextResponse.json(rows[0]);

  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise as per Next.js 15+ standards
    const { id } = await params;

    const query = `
      SELECT 
        c.*, 
        comp.company_name,
        CONCAT (u.first_name, ' ' , u.last_name) as assigned_to_name
      FROM customer c
      LEFT JOIN company comp ON c.company_id = comp.company_id
      LEFT JOIN users u ON c.assigned_to = u.user_id
      WHERE c.customer_id = ?
    `;

    const [rows]: any = await pool.query(query, [id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}