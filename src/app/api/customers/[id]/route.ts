import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Standardize params type
) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const [rows]: any = await pool.query(
      "SELECT * FROM customer WHERE customer_id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}