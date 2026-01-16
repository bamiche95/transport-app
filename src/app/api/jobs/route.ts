import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const sql = "SELECT * FROM jobs ORDER BY job_datetime DESC";
    const result = await pool.query(sql);
    
    // Even if result is [], NextResponse.json([]) is valid and won't break the UI
    return NextResponse.json(result || []);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}