import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: NextRequest) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [rows] = await pool.query(
      `SELECT recipient_id, name, email, created_at, modified_at
       FROM wtn_email_recipients
       ORDER BY name ASC`
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("WTN recipients fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO wtn_email_recipients (name, email, created_at, modified_at)
       VALUES (?, ?, NOW(), NOW())`,
      [name, email]
    );

    return NextResponse.json({ success: true, recipient_id: (result as any).insertId }, { status: 201 });
  } catch (err: any) {
    console.error("WTN recipients create error:", err);
    // unique constraint on email
    if (err && err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
