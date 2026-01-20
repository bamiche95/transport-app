import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    try {
        // 1. Always fetch static dropdown data
        const [statuses] = await pool.query<RowDataPacket[]>(
            "SELECT bin_status_id as id, label FROM bin_status WHERE is_active = 1"
        );
        const [types] = await pool.query<RowDataPacket[]>(
            "SELECT bin_type_id as id, bin_name as label FROM bintype"
        );
        const [companies] = await pool.query<RowDataPacket[]>(
            "SELECT company_id as id, company_name as label FROM company"
        );

        // 2. Handle Searchable Fields (Customer & User)
        let customers: any[] = [];
        let users: any[] = [];

        if (query && query.length >= 3) {
            // Fetch matching results based on search string
            const searchPattern = `%${query}%`;

            [customers] = await pool.query<RowDataPacket[]>(
                "SELECT customer_id as id, customer_name as label FROM customer WHERE customer_name LIKE ? LIMIT 15",
                [searchPattern]
            );

            [users] = await pool.query<RowDataPacket[]>(
                "SELECT user_id as id, CONCAT(first_name, ' ', last_name) as label FROM users WHERE first_name LIKE ? OR last_name LIKE ? LIMIT 15",
                [searchPattern, searchPattern]
            );
        } else {
            // Default initial list (optional, can be empty until user types)
            [customers] = await pool.query<RowDataPacket[]>(
                "SELECT customer_id as id, customer_name as label FROM customer ORDER BY created_at DESC LIMIT 10"
            );
            [users] = await pool.query<RowDataPacket[]>(
                "SELECT user_id as id, CONCAT(first_name, ' ', last_name) as label FROM users LIMIT 10"
            );
        }

        return NextResponse.json({
            statuses,
            types,
            companies,
            customers,
            users
        });
    } catch (error: any) {
        console.error("Form Data Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}