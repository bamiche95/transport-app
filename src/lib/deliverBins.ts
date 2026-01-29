import { PoolConnection } from "mysql2/promise";

interface DeliverBinArgs {
  binNumber: string;
  job: any;
  user: any;
  jobBinId?: number;
}

export async function deliverBin(
  conn: PoolConnection,
  { binNumber, job, user, jobBinId }: DeliverBinArgs
) {
  // 1. Get bin
  const [[bin]]: any = await conn.query(
    "SELECT bin_id, customer_id FROM bins WHERE bin_number = ?",
    [binNumber]
  );

  if (!bin) {
    throw new Error(`Bin ${binNumber} not found`);
  }

  // 2. Assign bin to customer
  await conn.query(
  `UPDATE job_bins 
   SET bin_id = ?, assigned_at = NOW()
   WHERE job_bin_id = ?`,
  [bin.bin_id, jobBinId]
);


  // 3. Assign to job_bins slot
  const [result]: any = await conn.query(
    `UPDATE job_bins
     SET bin_id = ?, assigned_at = NOW()
     WHERE job_id = ?
       AND movement_type = 'DELIVER'
       AND bin_id IS NULL
     LIMIT 1`,
    [bin.bin_id, job.job_id]
  );

  if (result.affectedRows === 0) {
    throw new Error(`No available DELIVER slot for job ${job.job_id}`);
  }

  // 4. History
  await conn.query(
    `INSERT INTO binhistory
     (bin_id, job_id, from_location, to_location, moved_by, moved_at)
     VALUES (?, ?, 'YARD', ?, ?, NOW())`,
    [
      bin.bin_id,
      job.job_id,
      job.address || `CUSTOMER:${job.customer_id}`,
      user.id
    ]
  );
}
