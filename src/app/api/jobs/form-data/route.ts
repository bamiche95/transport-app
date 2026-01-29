import { NextResponse, NextRequest } from "next/server";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    try {
        // 1. Fetch static options
        const [binTypes] = await pool.query<RowDataPacket[]>("SELECT bin_type_id as id, bin_name as label FROM bintype ORDER BY bin_name ASC");
        const [companies] = await pool.query<RowDataPacket[]>("SELECT company_id as id, company_name as label FROM company ORDER BY company_name ASC");
        const [jobTypes] = await pool.query<RowDataPacket[]>("SELECT job_type_id as id, job_type_name as label FROM jobtype ORDER BY job_type_name ASC");
        const [wasteTypes] = await pool.query<RowDataPacket[]>("SELECT waste_type_id as id, waste_type_name as label, description FROM waste_types ORDER BY waste_type_name ASC");
        const [jobStatus] = await pool.query<RowDataPacket[]>("SELECT job_status_id as id, job_status_name as label FROM job_status ORDER BY job_status_name ASC");
   
        // 2. Dynamic Priority Logic (Always Fetch)
        const [priorityRows]: any = await pool.query(`
            SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'jobs' AND COLUMN_NAME = 'priority'
        `);

        let priorities = [];
        if (priorityRows.length > 0) {
            // Parse enum('1','2','3'...)
            const values = priorityRows[0].COLUMN_TYPE
                .replace(/^enum\(|\)$/g, "")
                .split(",")
                .map((val: string) => val.replace(/'/g, ""));

            // Map numbers to readable labels
            priorities = values.map((val: string) => ({
                label: val === '1' ? '1 - Urgent' : val === '10' ? '10 - Low' : `${val}`,
                value: val // This is the string '1', '2', etc. required by the ENUM
            }));
        }

        // 3. Searchable Fields
        let customers: any[] = [];
        let users: any[] = [];

        if (query && query.length >= 3) {
            const searchPattern = `%${query}%`;
            [customers] = await pool.query<RowDataPacket[]>("SELECT customer_id as id, customer_name as label FROM customer WHERE customer_name LIKE ? LIMIT 20", [searchPattern]);
            [users] = await pool.query<RowDataPacket[]>("SELECT user_id as id, CONCAT(first_name, ' ', last_name) as label FROM users WHERE first_name LIKE ? OR last_name LIKE ? LIMIT 20", [searchPattern, searchPattern]);
        } else {
            [customers] = await pool.query<RowDataPacket[]>("SELECT customer_id as id, customer_name as label FROM customer ORDER BY created_at DESC LIMIT 10");
            [users] = await pool.query<RowDataPacket[]>("SELECT user_id as id, CONCAT(first_name, ' ', last_name) as label FROM users LIMIT 20");
        }

        return NextResponse.json({
            binTypes,
            companies,
            jobTypes,
            wasteTypes,
            customers,
            users,
            jobStatus,
            priorities // Make sure this is included here!
        });

    } catch (error: any) {
        console.error("Job Form Data Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
