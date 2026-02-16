import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
    if (!emailRegex.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    await pool.query(
      `UPDATE wtn_email_recipients SET name = ?, email = ?, modified_at = NOW() WHERE recipient_id = ?`,
      [name, email, id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("WTN recipients update error:", err);
    if (err && err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await pool.query(`DELETE FROM wtn_email_recipients WHERE recipient_id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("WTN recipients delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
