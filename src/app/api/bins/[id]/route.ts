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
  const binId = parseInt(id, 10);
  if (isNaN(binId))
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();

  // Allowed fields to update
  const allowedFields = [
    "bin_number",
    "bin_description",
    "bin_type_id",
    "customer_id",
    "company_id",
    "bin_status_id", // ← update to FK id
    "bin_condition",
    "comment",
    "printed",

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
      UPDATE bins
      SET ${setClause},
          modified_by = ?,
          modified_at = NOW()
      WHERE bin_id = ?
    `,
      [...values, user.id, binId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
