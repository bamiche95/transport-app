import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
      CREATE TABLE IF NOT EXISTS saved_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        report_name VARCHAR(255) NOT NULL,
        entity VARCHAR(50) NOT NULL,
        config_json JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        connection.release();
        return NextResponse.json({ message: "Table 'saved_reports' created or already exists." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
