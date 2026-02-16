import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, 
        CONCAT(u1.first_name, ' ', u1.last_name) AS created_by,
        CONCAT(u2.first_name, ' ', u2.last_name) AS modified_by
       FROM company c
       LEFT JOIN users u1 ON c.created_by = u1.user_id
       LEFT JOIN users u2 ON c.modified_by = u2.user_id
       ORDER BY c.company_name ASC`
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("company fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromJWT();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { company_name } = body;

    // Validate required fields
    if (!company_name || !company_name.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO company (company_name, created_by, modified_by, created_at, modified_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [company_name.trim(), user.id, user.id]
    );

    return NextResponse.json(
      {
        success: true,
        company_id: (result as any).insertId,
        message: "Company created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Company creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
