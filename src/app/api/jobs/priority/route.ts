import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    // 1. Query the column definition from INFORMATION_SCHEMA
    const [rows]: any = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'jobs' 
      AND COLUMN_NAME = 'priority'
    `);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // 2. Parse the string: "enum('Low','Medium','High')"
    const columnType = rows[0].COLUMN_TYPE;
    const enumValues = columnType
      .replace(/^enum\(|\)$/g, "") // Remove 'enum(' and ')'
      .split(",")                  // Split by comma
      .map((val: string) => val.replace(/'/g, "")); // Remove single quotes

    // 3. Format for the frontend select options
    const options = enumValues.map((val: string) => ({
      label: val,
      value: val,
    }));

    return NextResponse.json(options);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}