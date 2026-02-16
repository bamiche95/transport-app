import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getUserFromJWT();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = parseInt(id, 10);
    if (isNaN(companyId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
        const [rows] = await pool.query(
            `SELECT c.*,
        CONCAT(u1.first_name, ' ', u1.last_name) AS created_by,
        CONCAT(u2.first_name, ' ', u2.last_name) AS modified_by
       FROM company c
       LEFT JOIN users u1 ON c.created_by = u1.user_id
       LEFT JOIN users u2 ON c.modified_by = u2.user_id
       WHERE c.company_id = ?`,
            [companyId]
        );

        const company = Array.isArray(rows) ? rows[0] : null;

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        return NextResponse.json(company);
    } catch (error: any) {
        console.error("Database error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getUserFromJWT();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = parseInt(id, 10);
    if (isNaN(companyId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { company_name } = body;

        if (!company_name || !company_name.trim()) {
            return NextResponse.json(
                { error: "Company name is required" },
                { status: 400 }
            );
        }

        const [result] = await pool.query(
            `UPDATE company 
       SET company_name = ?, modified_by = ?, modified_at = NOW()
       WHERE company_id = ?`,
            [company_name.trim(), user.id, companyId]
        );

        if ((result as any).affectedRows === 0) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Company updated successfully" });
    } catch (error: any) {
        console.error("Company update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getUserFromJWT();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = parseInt(id, 10);
    if (isNaN(companyId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
        const [result] = await pool.query(
            "DELETE FROM company WHERE company_id = ?",
            [companyId]
        );

        if ((result as any).affectedRows === 0) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Company deleted successfully" });
    } catch (error: any) {
        console.error("Company delete error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
