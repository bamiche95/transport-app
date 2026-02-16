import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getUserFromJWT } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { smtp_host, smtp_port, smtp_username, smtp_password, smtp_secure, from_email, from_name } = body;

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: smtp_port,
            secure: smtp_secure === 'ssl', // true for 465, false for other ports
            auth: {
                user: smtp_username,
                pass: smtp_password === '********' ? await getExistingPassword(body.config_id) : smtp_password,
            },
            tls: {
                rejectUnauthorized: false // Often needed for corporate SMTP
            }
        });

        // Verify connection configuration
        await transporter.verify();

        // Send actual test email
        await transporter.sendMail({
            from: `"${from_name}" <${from_email}>`,
            to: from_email, // Send to self
            subject: "SMTP Connection Test",
            text: "Success! Your SMTP configuration is working correctly.",
            html: "<b>Success!</b> Your SMTP configuration is working correctly."
        });

        return NextResponse.json({ success: true, message: "Connection verified and test email sent!" });
    } catch (error: any) {
        console.error("SMTP Test Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper to get password if user hasn't changed the masked value
async function getExistingPassword(id: number) {
    if (!id) return '';
    const [rows]: any = await pool.query("SELECT smtp_password FROM email_config WHERE config_id = ?", [id]);
    return rows[0]?.smtp_password || '';
}