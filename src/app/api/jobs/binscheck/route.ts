// app/api/bins/check/route.ts
import { pool } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bin_number = searchParams.get("bin_number");

  if (!bin_number) return NextResponse.json({ exists: false });

  const [rows]: any = await pool.query(
    "SELECT bin_id, bin_number FROM bins WHERE bin_number = ? LIMIT 1",
    [bin_number]
  );

  return NextResponse.json({ 
    exists: rows.length > 0,
    bin_id: rows.length > 0 ? rows[0].bin_id : null 
  });
}