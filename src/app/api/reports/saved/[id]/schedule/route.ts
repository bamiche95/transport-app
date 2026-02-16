import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function POST(req: NextRequest,  { params }: { params: Promise<{ id: string }> } ) {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const reportId = Number(id);
        const { recipient_emails, frequency, scheduled_time, is_active } = await req.json();

        // Use ON DUPLICATE KEY UPDATE to handle existing schedules
        await pool.query(`
            INSERT INTO report_schedules 
                (report_id, recipient_emails, frequency, scheduled_time, is_active)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                recipient_emails = VALUES(recipient_emails),
                frequency = VALUES(frequency),
                scheduled_time = VALUES(scheduled_time),
                is_active = VALUES(is_active)
        `, [reportId, recipient_emails, frequency, scheduled_time, is_active]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Add these to your existing file

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const [rows]: any = await pool.query(
            "SELECT * FROM report_schedules WHERE report_id = ? ORDER BY scheduled_time ASC",
            [Number(id)]
        );

        // Return the full array
        return NextResponse.json(rows); 
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        await pool.query(
            "DELETE FROM report_schedules WHERE report_id = ?",
            [Number(id)]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}