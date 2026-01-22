import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db"; // Adjust this path to your DB config
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customer_id");

    if (!customerId) {
        return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                b.bin_id, 
                b.bin_description, 
                b.bin_number, 
                b.printed, 
                b.bin_type_id,
                bt.bin_name,
                c.customer_name
             FROM bins b
             JOIN bintype bt ON b.bin_type_id = bt.bin_type_id
             JOIN customer c ON b.customer_id = c.customer_id
             WHERE b.customer_id = ?
             ORDER BY b.created_at DESC`,
            [customerId]
        );

        return NextResponse.json(rows);
    } catch (error: any) {
        console.error("Bins Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}