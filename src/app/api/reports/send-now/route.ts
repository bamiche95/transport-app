import { NextRequest, NextResponse } from "next/server";
import { sendReportViaEmail } from "@/lib/reports/mailer";
import { getUserFromJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const user = await getUserFromJWT();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { reportId, email } = await req.json();
        if (!reportId || !email) throw new Error("Missing reportId or email");

        await sendReportViaEmail(reportId, email);

        return NextResponse.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}