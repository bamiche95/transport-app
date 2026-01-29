import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const user = await getUserFromJWT();
    if (!user) throw new Error("Unauthorized");

    const jobId = (await params).id;
    const { collect_numbers = [], deliver_numbers = [], bin_type_id } = await req.json();

    // Fetch job
    const [[job]]: any = await connection.query(
      "SELECT * FROM jobs WHERE job_id = ?",
      [jobId]
    );
    if (!job) throw new Error("Job not found");

    // Fetch job type
    const [[jobType]]: any = await connection.query(
      `SELECT job_type_name, allows_collect, allows_deliver
       FROM jobtype
       WHERE job_type_id = ?`,
      [job.job_type_id]
    );
    if (!jobType) throw new Error("Invalid job type");

    const allowsCollect = jobType.allows_collect === 1;
    const allowsDeliver = jobType.allows_deliver === 1;

    // Determine if this job type moves bins between customers
    const causesCustomerChange = ["Collect", "Deliver", "Exchange"].includes(jobType.job_type_name);

    // Single-bin workflows
    const singleBinOnly = ["Tip & Return", "Relocate", "Transport", "Wait and Load"].includes(jobType.job_type_name);

    // ------------------------------
    // Helper to get customer name
    // ------------------------------
    const getCustomerName = async (customerId: number) => {
      if (!customerId) return "Unknown";
      const [[customer]]: any = await connection.query(
        `SELECT company_name FROM customers WHERE customer_id = ?`,
        [customerId]
      );
      return customer?.company_name || "Unknown";
    };

    // ------------------------------
    // COLLECT / Single-bin workflows
    // ------------------------------
    if (allowsCollect || singleBinOnly) {
      const binsToProcess = collect_numbers; // same array for both

      for (const entry of binsToProcess) {
        const binNumber = entry.bin_number?.trim();
        if (!binNumber) continue;

        const [[bin]]: any = await connection.query(
          `SELECT bin_id, customer_id, bin_type_id
           FROM bins
           WHERE bin_number = ?`,
          [binNumber]
        );
        if (!bin) throw new Error(`Bin ${binNumber} not found`);

        if (bin.bin_type_id !== job.bin_type_id) {
          throw new Error(`Bin ${binNumber} does not match job bin type`);
        }

        let fromLocation = "Handled";
        let toLocation = "Handled";

        // Only update customer if workflow requires it
        if (causesCustomerChange) {
          fromLocation = await getCustomerName(bin.customer_id);
          toLocation = "STOCK COMPOUND/ASTON CHURCH ROAD";

          await connection.query(
            `UPDATE bins
             SET customer_id = 4537,
                 modified_by = ?,
                 modified_at = NOW()
             WHERE bin_id = ?`,
            [user.id, bin.bin_id]
          );
        }

        // Record job-bin
        await connection.query(
          `INSERT INTO job_bins (job_id, bin_id, created_at)
           VALUES (?, ?, NOW())`,
          [jobId, bin.bin_id]
        );

        // Record history
        await connection.query(
          `INSERT INTO binhistory (bin_id, job_id, from_location, to_location, moved_by, moved_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [bin.bin_id, jobId, fromLocation, toLocation, user.id]
        );
      }
    }

    // ------------------------------
    // DELIVER
    // ------------------------------
    if (allowsDeliver) {
      for (const entry of deliver_numbers) {
        const binNumber = entry.bin_number?.trim();
        if (!binNumber) continue;

        const [[bin]]: any = await connection.query(
          `SELECT bin_id, customer_id, bin_type_id
           FROM bins
           WHERE bin_number = ?`,
          [binNumber]
        );
        if (!bin) throw new Error(`Bin ${binNumber} not found`);

        if (bin.bin_type_id !== job.bin_type_id) {
          throw new Error(`Bin ${binNumber} does not match job bin type`);
        }

        let fromLocation = "Handled";
        let toLocation = "Handled";

        if (causesCustomerChange) {
          fromLocation = "Yard/Stock";
          toLocation = await getCustomerName(job.customer_id);

          await connection.query(
            `UPDATE bins
             SET customer_id = ?,
                 modified_by = ?,
                 modified_at = NOW()
             WHERE bin_id = ?`,
            [job.customer_id, user.id, bin.bin_id]
          );
        }

        await connection.query(
          `INSERT INTO job_bins (job_id, bin_id, created_at)
           VALUES (?, ?, NOW())`,
          [jobId, bin.bin_id]
        );

        await connection.query(
          `INSERT INTO binhistory (bin_id, job_id, from_location, to_location, moved_by, moved_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [bin.bin_id, jobId, fromLocation, toLocation, user.id]
        );
      }
    }

    // ------------------------------
    // Inspection/Repair (no bins)
    // ------------------------------
    if (jobType.job_type_name === "Inspection/Repair" && collect_numbers.length === 0 && deliver_numbers.length === 0) {
      await connection.query(
        `UPDATE jobs
         SET modified_by = ?, modified_at = NOW()
         WHERE job_id = ?`,
        [user.id, jobId]
      );
    }

    // ------------------------------
    // Mark job as completed
    // ------------------------------
    await updateJobStatus(connection, Number(jobId), "Completed", user.id);

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    await connection.rollback();
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    connection.release();
  }
}

// Generic function to mark job as completed
async function updateJobStatus(
  connection: any,
  jobId: number,
  statusName: string,
  userId: number
) {
  const [[status]]: any = await connection.query(
    "SELECT job_status_id FROM job_status WHERE job_status_name = ?",
    [statusName]
  );
  if (!status) throw new Error(`Job status '${statusName}' not found`);

  await connection.query(
    `UPDATE jobs
     SET job_status_id = ?, modified_by = ?, modified_at = NOW()
     WHERE job_id = ?`,
    [status.job_status_id, userId, jobId]
  );
}
