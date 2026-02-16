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
    const configId = parseInt(id, 10);
    if (isNaN(configId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
 // Change this line:
const [rows]: any = await pool.query( // Added : any here
    `SELECT ec.*,
    CONCAT(u1.first_name, ' ', u1.last_name) AS created_by_name,
    CONCAT(u2.first_name, ' ', u2.last_name) AS modified_by_name
   FROM email_config ec
   LEFT JOIN users u1 ON ec.created_by = u1.user_id
   LEFT JOIN users u2 ON ec.modified_by = u2.user_id
   WHERE ec.config_id = ?`,
    [configId]
);

const config = Array.isArray(rows) ? rows[0] : null;

if (!config) {
    return NextResponse.json({ error: "Email config not found" }, { status: 404 });
}

// Now TypeScript will allow this:
config.smtp_password = '********';

        return NextResponse.json(config);
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
    const configId = parseInt(id, 10);
    if (isNaN(configId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
        const body = await req.json();

        // Get current config
        const [existingRows]: any = await pool.query(
            "SELECT * FROM email_config WHERE config_id = ?",
            [configId]
        );

        if (existingRows.length === 0) {
            return NextResponse.json({ error: "Email config not found" }, { status: 404 });
        }

        const current = existingRows[0];

        // Merge with defaults from current record
        const {
            config_name = current.config_name,
            smtp_host = current.smtp_host,
            smtp_port = current.smtp_port,
            smtp_auth = current.smtp_auth,
            smtp_auth_type = current.smtp_auth_type,
            smtp_username = current.smtp_username,
            smtp_password, // Only update if provided
            smtp_secure = current.smtp_secure,
            smtp_auto_tls = current.smtp_auto_tls,
            from_email = current.from_email,
            from_name = current.from_name,
            is_active = current.is_active,
            is_default = current.is_default
        } = body;

        // Validate email if provided
        if (from_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(from_email)) {
                return NextResponse.json(
                    { error: "Invalid email format" },
                    { status: 400 }
                );
            }
        }

        // Validate port range
        if (smtp_port && (smtp_port < 1 || smtp_port > 65535)) {
            return NextResponse.json(
                { error: "Port must be between 1 and 65535" },
                { status: 400 }
            );
        }

        // If setting as default, unset other defaults
        if (is_default && !current.is_default) {
            await pool.query(
                "UPDATE email_config SET is_default = FALSE WHERE config_id != ?",
                [configId]
            );
        }

        // Build update query - only update password if new value provided
        let updateQuery = `UPDATE email_config SET 
      config_name = ?, smtp_host = ?, smtp_port = ?, smtp_auth = ?, smtp_auth_type = ?,
      smtp_username = ?, smtp_secure = ?, smtp_auto_tls = ?,
      from_email = ?, from_name = ?, is_active = ?, is_default = ?,
      modified_by = ?, modified_at = NOW()`;

        const updateParams: any[] = [
            config_name, smtp_host, smtp_port, smtp_auth, smtp_auth_type,
            smtp_username, smtp_secure, smtp_auto_tls,
            from_email, from_name, is_active, is_default,
            user.id
        ];

        // Only update password if a new one is provided (not the masked value)
        if (smtp_password && smtp_password !== '********') {
            updateQuery = `UPDATE email_config SET 
        config_name = ?, smtp_host = ?, smtp_port = ?, smtp_auth = ?, smtp_auth_type = ?,
        smtp_username = ?, smtp_password = ?, smtp_secure = ?, smtp_auto_tls = ?,
        from_email = ?, from_name = ?, is_active = ?, is_default = ?,
        modified_by = ?, modified_at = NOW()`;

            updateParams.splice(6, 0, smtp_password); // Insert password at correct position
        }

        updateQuery += " WHERE config_id = ?";
        updateParams.push(configId);

        await pool.query(updateQuery, updateParams);

        return NextResponse.json({ success: true, message: "Email config updated successfully" });
    } catch (error: any) {
        console.error("Email config update error:", error);
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
    const configId = parseInt(id, 10);
    if (isNaN(configId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
        // Check if this is the default config
        const [rows]: any = await pool.query(
            "SELECT is_default FROM email_config WHERE config_id = ?",
            [configId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Email config not found" }, { status: 404 });
        }

        if (rows[0].is_default) {
            return NextResponse.json(
                { error: "Cannot delete the default email configuration. Set another config as default first." },
                { status: 400 }
            );
        }

        const [result] = await pool.query(
            "DELETE FROM email_config WHERE config_id = ?",
            [configId]
        );

        if ((result as any).affectedRows === 0) {
            return NextResponse.json({ error: "Email config not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Email config deleted successfully" });
    } catch (error: any) {
        console.error("Email config delete error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
