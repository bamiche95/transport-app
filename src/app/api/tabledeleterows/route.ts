// file: src/app/api/tabledeleterows/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db"; // adjust path

export async function POST(req: NextRequest) {
  const body = await req.json();
  let { table, ids, idField } = body; // <-- accept idField from frontend

  if (!table || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Missing table or IDs" }, { status: 400 });
  }

  // Set default ID field if not provided
  if (!idField) {
    // fallback defaults for common tables
    switch (table) {
      case "bins":
        idField = "bin_id";
        break;
      case "jobs":
        idField = "job_id";
        break;
      case "bintype":
      case "inventory":
        idField = "bin_type_id";
        break;
      case "customer":
        idField = "customer_id";
        break;
      default:
        idField = "id";
    }
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Optional: remap "inventory" to "bintype"
    if (table === "inventory") table = "bintype";

    const placeholders = ids.map(() => "?").join(",");
    const sql = `DELETE FROM \`${table}\` WHERE \`${idField}\` IN (${placeholders})`;

    await connection.query(sql, ids);

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    await connection.rollback();
    console.error("Generic DELETE Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    connection.release();
  }
}

