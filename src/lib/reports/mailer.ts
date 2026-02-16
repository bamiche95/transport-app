import nodemailer from "nodemailer";
import { pool } from "@/lib/db";
import { generateReportSql } from "@/lib/reports/engine";

export async function sendReportViaEmail(reportId: number, emails: string) {
    // 1. Fetch Report Config
    const [reports]: any = await pool.query("SELECT * FROM saved_reports WHERE id = ?", [reportId]);
    if (!reports.length) throw new Error("Report not found");
    const report = reports[0];
    
    // 2. Fetch Default SMTP Settings
    const [smtp]: any = await pool.query("SELECT * FROM email_config WHERE is_default = TRUE LIMIT 1");
    if (!smtp.length) throw new Error("No default email configuration found");
    const config = smtp[0];

    // 3. Generate Data
    // config_json contains { fields: string[], filters: [] }
    const { sql, params } = generateReportSql(report.entity, report.config_json);
    const [data]: any = await pool.query(sql, params);

    // 4. Robust CSV Conversion
    const selectedFields = report.config_json.fields; // e.g. ["jobs.job_id", "users.name"]
    const csvHeaders = selectedFields.join(",");
    
    const csvRows = data.map((row: any) => {
        return selectedFields.map((fieldId: string) => {
            // Because our engine aliases fields as `field.id`, 
            // we access the row directly using the full fieldId.
            const cellValue = row[fieldId] ?? "";
            
            // Handle data types: format dates, escape quotes
            let formattedValue = cellValue;
            if (cellValue instanceof Date) {
                formattedValue = cellValue.toISOString().split('T')[0];
            }

            // Wrap in quotes and escape existing quotes to handle commas/newlines
            return `"${String(formattedValue).replace(/"/g, '""')}"`;
        }).join(",");
    }).join("\n");

    const csvContent = `${csvHeaders}\n${csvRows}`;

    // 5. Transporter Setup
    const transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465, 
        auth: {
            user: config.smtp_username,
            pass: config.smtp_password
        }
    });

    // 6. Send
    await transporter.sendMail({
        from: `"${config.from_name}" <${config.from_email}>`,
        to: emails,
        subject: `📊 Automated Report: ${report.report_name}`,
        text: `Please find the attached CSV for the "${report.report_name}" report.\n\nGenerated on: ${new Date().toLocaleString()}`,
        attachments: [{
            filename: `${report.report_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`,
            content: csvContent
        }]
    });
    
    // 7. Update last sent timestamp
    await pool.query(
        "UPDATE report_schedules SET last_sent_at = NOW() WHERE report_id = ?", 
        [reportId]
    );
}