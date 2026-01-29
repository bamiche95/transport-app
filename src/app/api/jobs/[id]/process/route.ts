import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const jobId: number = parseInt(params.id);
    // movements: [{ bin_number: 'B1', type: 'COLLECT' }, ...]
    // target_customer_id is only needed for 'Relocate'
    const { movements, status_id, customer_id, target_customer_id } = await req.json();

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Fetch Job Type Name so the movement logic knows what rules to apply
        const [jobRow]: any = await connection.query(
            `SELECT jt.job_type_name 
             FROM jobs j 
             JOIN jobtype jt ON j.job_type_id = jt.job_type_id 
             WHERE j.job_id = ?`,
            [jobId]
        );

        if (jobRow.length === 0) throw new Error("Job not found");
        const jobTypeName = jobRow[0].job_type_name;

        // 2. Clear existing assignments for this job
        await connection.query("DELETE FROM job_bins WHERE job_id = ?", [jobId]);

        for (const move of movements) {
            // 3. Lookup bin_id by number
            const [bin]: any = await connection.query(
                "SELECT bin_id FROM bins WHERE bin_number = ? LIMIT 1",
                [move.bin_number]
            );

            if (bin.length === 0) {
                throw new Error(`Bin ${move.bin_number} does not exist in the database.`);
            }

            const binId = bin[0].bin_id;

            // 4. Link to job_bins (Ensure you added the movement_type column to your DB)
            await connection.query(
                `INSERT INTO job_bins (job_id, bin_id, movement_type, assigned_at) VALUES (?, ?, ?, NOW())`,
                [jobId, binId, move.type]
            );

            // 5. IF JOB IS COMPLETED -> TRIGGER THE SWITCH
            // (Assuming '3' is your 'Completed' status ID)
            if (parseInt(status_id) === 3) {
                await handleBinMovement(
                    connection,
                    binId,
                    jobId,
                    move.type,
                    customer_id,
                    jobTypeName,
                    target_customer_id
                );
            }
        }

        await connection.commit();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        await connection.rollback();
        console.error("Movement Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
    } finally {
        connection.release();
    }
}

async function handleBinMovement(
    conn: any,
    binId: number,
    jobId: number,
    moveType: 'COLLECT' | 'DELIVER',
    jobCustomerId: number,
    jobTypeName: string,
    targetCustomerId?: number
) {
    const [currentBin]: any = await conn.query("SELECT customer_id FROM bins WHERE bin_id = ?", [binId]);
    const fromLocation = currentBin[0].customer_id;
    const OUR_COMPANY_ID = 1;

    let toLocation = fromLocation;

    switch (jobTypeName) {
        case 'Deliver':
            toLocation = jobCustomerId;
            break;
        case 'Collect':
            toLocation = OUR_COMPANY_ID;
            break;
        case 'Exchange':
            toLocation = (moveType === 'DELIVER') ? jobCustomerId : OUR_COMPANY_ID;
            break;
        case 'Relocate':
            // If we are delivering the bin in a relocate, it goes to the target
            // If we are collecting it, it's coming from the job customer
            toLocation = (moveType === 'DELIVER') ? (targetCustomerId || jobCustomerId) : OUR_COMPANY_ID;
            break;
        case 'Tip And Return':
        case 'Wait & Load':
        case 'Wait and Load':
            toLocation = jobCustomerId;
            break;
    }

    if (fromLocation !== toLocation) {
        await conn.query("UPDATE bins SET customer_id = ?, modified_at = NOW() WHERE bin_id = ?", [toLocation, binId]);
    }

    await conn.query(
        `INSERT INTO binhistory (bin_id, job_id, from_location, to_location, moved_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [binId, jobId, String(fromLocation), String(toLocation)]
    );
}
