import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const binTypeId = parseInt(id, 10);

  if (isNaN(binTypeId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const [rows]: any = await pool.query(
    `
    SELECT
      bin_type_id AS id,
      bin_name,
      created_at,
      modified_at
    FROM bintype
    WHERE bin_type_id = ?
    `,
    [binTypeId]
  );

  if (!rows.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. CRITICAL: Await the params
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  // 2. Safety check: If parsing failed, id will be NaN here
  if (isNaN(id)) {
    console.error("Failed to parse ID from URL:", resolvedParams.id);
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  const body = await req.json();
  const allowedFields = ["bin_name"]; 
  const updates = Object.keys(body).filter(k => allowedFields.includes(k));

  if (updates.length === 0) return NextResponse.json({ error: "No fields to update" });

  const setClause = updates.map(k => `${k} = ?`).join(", ");
  const fieldValues = updates.map(k => body[k]);

  // Ensure user.id is a number/string, not undefined
  const userId = user.id || 0; 

  const queryParams = [...fieldValues, userId, id];

  try {
    await pool.query(
      `
      UPDATE bintype
      SET ${setClause},
          modified_by = ?,
          modified_at = NOW()
      WHERE bin_type_id = ?
      `,
      queryParams
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await pool.query(
      `
      DELETE FROM bintype
      WHERE bin_type_id = ?
      `,
      [id]
    );

    return NextResponse.json({ success: true, message: "Bin type deleted successfully" });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}