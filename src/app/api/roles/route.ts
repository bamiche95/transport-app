import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET() {
  const currentUser = await getUserFromJWT();

  if (!currentUser || currentUser.role !== "Admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // MySQL ENUM introspection
  const [rows] = await pool.query(`
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role'
  `);

  const enumString = (rows as any[])[0]?.COLUMN_TYPE; 
  // enum('Admin','Manager','Driver')

  const roles = enumString
    .replace(/^enum\(|\)$/g, "")
    .split(",")
    .map((r: string) => r.replace(/'/g, ""));

  return NextResponse.json({ roles });
}
