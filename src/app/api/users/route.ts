import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";
import bcrypt from "bcrypt";


export async function GET(req: NextRequest) {
    const currentUser = await getUserFromJWT();
    if (!currentUser) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const [rows] = await pool.query("SELECT * FROM users");
    const users = rows as Array<{
        user_id: number;
        username: string;
        email: string;
        role: string;
        created_at: Date;
        first_name: string;
        last_name: string;
    }>;
    return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
    const currentUser = await getUserFromJWT(); 
    // Note: Ensure casing matches your DB (e.g., "admin" vs "Admin")
    if (!currentUser || currentUser.role.toLowerCase() !== "admin") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { first_name, last_name, username, email, password, role } = await req.json();

    if (!username || !email || !password || !role || !first_name || !last_name) {
        return NextResponse.json(
            { message: "All fields are required" },
            { status: 400 }
        );
    }

    // 1. Check for existing user
    const [existingUserRows] = await pool.query(
        "SELECT user_id FROM users WHERE username = ? OR email = ?",
        [username, email]
    );
    
    if ((existingUserRows as any[]).length > 0) {
        return NextResponse.json(
            { message: "Username or email already exists" },
            { status: 409 }
        );
    }

    // 2. HASH THE PASSWORD
    // 10 is the "salt rounds" - a good balance between security and speed
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insert into database using the hashed password
    const [result] = await pool.query(
        "INSERT INTO users (first_name, last_name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)",
        [first_name, last_name, username, email, hashedPassword, role.toLowerCase()] // Ensure role matches ENUM casing
    );

    const insertResult = result as any;
    return NextResponse.json({
        message: "User created successfully",
        userId: insertResult.insertId,
    });
}


