// src\app\api\users\[id]\route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. Update type to Promise
) {
  // 2. Unwrapping params
  const { id } = await params; 
  const userId = Number(id);

  console.log("Resolved User ID:", userId);

  const currentUser = await getUserFromJWT();

  // 3. Check role (Note: DB usually uses lowercase 'admin')
  if (!currentUser || currentUser.role.toLowerCase() !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (!userId || isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const { first_name, last_name, username, email, password, role } =
    await req.json();

  if (!first_name || !last_name || !username || !email || !role) {
    return NextResponse.json(
      { message: "Required fields missing" },
      { status: 400 }
    );
  }

  // 1. Check username/email conflicts (excluding this user)
  const [conflictRows] = await pool.query(
    `
    SELECT user_id 
    FROM users 
    WHERE (username = ? OR email = ?) AND user_id != ?
    `,
    [username, email, userId]
  );

  if ((conflictRows as any[]).length > 0) {
    return NextResponse.json(
      { message: "Username or email already exists" },
      { status: 409 }
    );
  }

  // 2. Build dynamic update query
  let query = `
    UPDATE users SET
      first_name = ?,
      last_name = ?,
      username = ?,
      email = ?,
      role = ?
  `;

  const values: any[] = [
    first_name,
    last_name,
    username,
    email,
    role,
  ];

  // 3. Hash password only if provided
  if (password && password.trim() !== "") {
    const hashedPassword = await bcrypt.hash(password, 10);
    query += `, password_hash = ?`;
    values.push(hashedPassword);
  }

  query += ` WHERE user_id = ?`;
  values.push(userId);

  await pool.query(query, values);

  return NextResponse.json({
    message: "User updated successfully",
  });
}