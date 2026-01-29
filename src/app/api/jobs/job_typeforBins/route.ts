import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";


export async function GET(req: NextRequest) {
  const user = await getUserFromJWT();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [rows] = await pool.query(`
    SELECT 
      job_type_id AS id,
      job_type_name AS label,
      allows_collect,
      allows_deliver
    FROM jobtype
  `);

  return NextResponse.json(rows);
}
