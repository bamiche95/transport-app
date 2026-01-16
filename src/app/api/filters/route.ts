import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db"; // Adjust this based on your DB utility
import { getUserFromJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { page_name, filter_name, config_json, is_default } = await req.json();

    if (!page_name || !filter_name || !config_json) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (is_default) {
      await pool.query(
        "UPDATE saved_filters SET is_default = 0 WHERE user_id = ? AND page_name = ?",
        [user.id, page_name]
      );
    }

    // Capture the result properly (destructuring the first element)
    const [result]: any = await pool.query(
      "INSERT INTO saved_filters (user_id, page_name, filter_name, config_json, is_default) VALUES (?, ?, ?, ?, ?)",
      [user.id, page_name, filter_name, config_json, is_default ? 1 : 0]
    );

    const newFilter = {
      filter_id: result.insertId, // result is the OKPacket in mysql2
      user_id: user.id,
      page_name,
      filter_name,
      config_json,
      is_default: is_default ? 1 : 0
    };

    return NextResponse.json(newFilter, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
// src/app/api/filters/route.ts
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromJWT();
    const { searchParams } = new URL(req.url);
    const pageName = searchParams.get("page");

    if (!user) return NextResponse.json([], { status: 401 });

    const result = await pool.query(
      "SELECT * FROM saved_filters WHERE user_id = ? AND page_name = ? ORDER BY created_at DESC",
      [user.id, pageName]
    );

    // FIX: If the result is an array of arrays, return the first one
    const rows = Array.isArray(result[0]) ? result[0] : result;

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}