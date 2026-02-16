
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { sendReportViaEmail } from "@/lib/reports/mailer";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const clientToken = searchParams.get('token');
    const serverSecret = process.env.CRON_SECRET;

    // Debugging logs
    console.log("Client Token Received:", clientToken?.substring(0, 10) + "...");
    console.log("Server Secret Found:", serverSecret ? "Yes (starts with " + serverSecret.substring(0, 10) + "...)" : "No (undefined)");

    if (!clientToken || clientToken !== serverSecret) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        // Query for reports due now that haven't been sent today
        const [schedules]: any = await pool.query(
            `SELECT * FROM report_schedules 
             WHERE is_active = TRUE 
             AND frequency = 'daily'
             AND scheduled_time <= CURTIME() 
             AND (last_sent_at IS NULL OR last_sent_at < DATE_SUB(NOW(), INTERVAL 20 HOUR))`
        );

        console.log(`Found ${schedules.length} reports to process.`);

        for (const schedule of schedules) {
            try {
                await sendReportViaEmail(schedule.report_id, schedule.recipient_emails);
                
                await pool.query(
                    "UPDATE report_schedules SET last_sent_at = NOW() WHERE schedule_id = ?",
                    [schedule.schedule_id]
                );
                
                console.log(`Successfully sent report ID: ${schedule.report_id}`);
            } catch (error) {
                console.error(`Failed to send report ID ${schedule.report_id}:`, error);
            }
        }

        return NextResponse.json({ success: true, processed: schedules.length });
    } catch (error: any) {
        console.error("Cron Route Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}