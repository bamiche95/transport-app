import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const user = await getUserFromJWT();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: Restrict to admin users only
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    // }

    try {
        const [rows] = await pool.query(
            `SELECT ec.*, 
        CONCAT(u1.first_name, ' ', u1.last_name) AS created_by_name,
        CONCAT(u2.first_name, ' ', u2.last_name) AS modified_by_name
       FROM email_config ec
       LEFT JOIN users u1 ON ec.created_by = u1.user_id
       LEFT JOIN users u2 ON ec.modified_by = u2.user_id
       ORDER BY ec.is_default DESC, ec.config_name ASC`
        );

        // Mask passwords in the list view
        const maskedRows = (rows as any[]).map(row => ({
            ...row,
            smtp_password: '********'
        }));

        return NextResponse.json(maskedRows);
    } catch (error: any) {
        console.error("Email config fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const user = await getUserFromJWT();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            config_name,
            smtp_host,
            smtp_port,
            smtp_auth = true,
            smtp_auth_type = 'LOGIN',
            smtp_username,
            smtp_password,
            smtp_secure = 'tls',
            smtp_auto_tls = true,
            from_email,
            from_name,
            is_active = true,
            is_default = false
        } = body;

        // Validate required fields
        if (!config_name || !smtp_host || !smtp_port || !from_email || !from_name) {
            return NextResponse.json(
                { error: "Missing required fields: config_name, smtp_host, smtp_port, from_email, from_name" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(from_email)) {
            return NextResponse.json(
                { error: "Invalid email format for from_email" },
                { status: 400 }
            );
        }

        // Validate port range
        if (smtp_port < 1 || smtp_port > 65535) {
            return NextResponse.json(
                { error: "Port must be between 1 and 65535" },
                { status: 400 }
            );
        }

        // If setting as default, unset other defaults
        if (is_default) {
            await pool.query(
                "UPDATE email_config SET is_default = FALSE WHERE is_default = TRUE"
            );
        }

        const [result] = await pool.query(
            `INSERT INTO email_config (
        config_name, smtp_host, smtp_port, smtp_auth, smtp_auth_type,
        smtp_username, smtp_password, smtp_secure, smtp_auto_tls,
        from_email, from_name, is_active, is_default,
        created_by, modified_by, created_at, modified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                config_name, smtp_host, smtp_port, smtp_auth, smtp_auth_type,
                smtp_username, smtp_password, smtp_secure, smtp_auto_tls,
                from_email, from_name, is_active, is_default,
                user.id, user.id
            ]
        );

        return NextResponse.json(
            {
                success: true,
                config_id: (result as any).insertId,
                message: "Email configuration created successfully",
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Email config creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
