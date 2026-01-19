import { NextResponse, NextRequest } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        bin_type_id as id, 
        bin_name, 
        created_at, 
        modified_at 
      FROM bintype 
      ORDER BY created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromJWT();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bin_name } = body;

    // Validation
    if (!bin_name || typeof bin_name !== "string" || !bin_name.trim()) {
      return NextResponse.json(
        { error: "bin_name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Insert new bin type
    const [result] = await pool.query(
      `
      INSERT INTO bintype (bin_name, created_by, modified_by, created_at, modified_at)
      VALUES (?, ?, ?, NOW(), NOW())
      `,
      [bin_name.trim(), user.id, user.id]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Bin type created successfully",
        bin_type_id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}