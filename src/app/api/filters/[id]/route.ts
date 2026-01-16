//src\app\api\filters\[id]\route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

// The params type is now a Promise
type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Unwrap the params promise
    const { id } = await props.params;

    await pool.query(
      "DELETE FROM saved_filters WHERE filter_id = ? AND user_id = ?",
      [id, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: RouteParams) {
  try {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await props.params;
    const { filter_name, is_default, config_json } = await req.json();

    let updateFields = [];
    let values = [];

    if (filter_name !== undefined) {
      updateFields.push("filter_name = ?");
      values.push(filter_name);
    }

    if (config_json !== undefined) {
      updateFields.push("config_json = ?");
      values.push(typeof config_json === 'string' ? config_json : JSON.stringify(config_json));
    }

    // Allow toggling is_default to 0 or 1
    if (is_default !== undefined) {
      updateFields.push("is_default = ?");
      values.push(is_default ? 1 : 0);
    }

    if (updateFields.length > 0) {
      // If we are SETTING a new default, clear the others first
      if (is_default === 1) {
        const [rows]: any = await pool.query("SELECT page_name FROM saved_filters WHERE filter_id = ?", [id]);
        const pageName = Array.isArray(rows) ? rows[0]?.page_name : rows?.page_name;
        
        if (pageName) {
          await pool.query(
            "UPDATE saved_filters SET is_default = 0 WHERE page_name = ? AND user_id = ?", 
            [pageName, user.id]
          );
        }
      }

      values.push(id, user.id);
      await pool.query(
        `UPDATE saved_filters SET ${updateFields.join(", ")} WHERE filter_id = ? AND user_id = ?`,
        values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}