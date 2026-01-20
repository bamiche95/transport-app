import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let sql = "SELECT * FROM customer";
    const params: any[] = [];

    if (search) {
      sql += " WHERE customer_name LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY customer_name ASC";

    const [rows]: any = await pool.query(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Get the user from JWT
    const user = await getUserFromJWT();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.customer_name || !body.customer_name.trim()) {
      return NextResponse.json({ message: "Customer Name is required" }, { status: 400 });
    }

    if (!body.company_id) {
      return NextResponse.json({ message: "Company is required" }, { status: 400 });
    }

    if (!body.email || !body.email.trim()) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const {
      customer_name,
      company_id,
      contact_name,
      email,
      phone_number,
      address,
      city,
      town,
      postcode,
      country,
      opening_times,
      sic_code,
      company_notes,
      assigned_to,
    } = body;

    const sql = `
      INSERT INTO customer (
        customer_name,
        company_id,
        contact_name,
        email,
        phone_number,
        address,
        city,
        town,
        postcode,
        country,
        opening_times,
        sic_code,
        company_notes,
        assigned_to,
        created_by,
        modified_by,
        created_at,
        modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      customer_name,
      company_id,
      contact_name || null,
      email,
      phone_number || null,
      address || null,
      city || null,
      town || null,
      postcode || null,
      country || null,
      opening_times || null,
      sic_code || null,
      company_notes || null,
      assigned_to || null,
      user.id,
      user.id,
    ];

    const [result] = await pool.query(sql, values);

    return NextResponse.json(
      {
        message: "Customer created successfully",
        customer_id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { message: "Failed to create customer" },
      { status: 500 }
    );
  }
}

