
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Corrected standard Next.js 15+ dynamic route type
) {
    // Await params first (Next.js 15 breaking change fix)
    const { id } = await params;

    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await pool.query(
            "DELETE FROM saved_reports WHERE id = ? AND user_id = ?",
            [id, user.id]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
