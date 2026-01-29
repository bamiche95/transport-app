import { PoolConnection } from "mysql2/promise";

interface CollectBinArgs {
  binNumber: string;
  job: any;
  user: any;
  jobBinId?: number;
}

export async function collectBin(
  conn: PoolConnection,
  { binNumber, job, user, jobBinId }: CollectBinArgs
) {
  // 1. Get bin
  const [[bin]]: any = await conn.query(
    "SELECT bin_id, customer_id FROM bins WHERE bin_number = ?",
    [binNumber]
  );

  if (!bin) {
    throw new Error(`Bin ${binNumber} not found`);
  }

  // 2. Update master bin → back to yard
await conn.query(
  `UPDATE job_bins 
   SET bin_id = ?, assigned_at = NOW()
   WHERE job_bin_id = ?`,
  [bin.bin_id, jobBinId]
);


  // 3. Assign bin to job_bins placeholder
  const [result]: any = await conn.query(
    `UPDATE job_bins 
     SET bin_id = ?, assigned_at = NOW() 
     WHERE job_id = ? 
       AND movement_type = 'COLLECT' 
       AND bin_id IS NULL 
     LIMIT 1`,
    [bin.bin_id, job.job_id]
  );

  if (result.affectedRows === 0) {
    throw new Error(`No available COLLECT slot for job ${job.job_id}`);
  }

  // 4. History
  await conn.query(
    `INSERT INTO binhistory 
     (bin_id, job_id, from_location, to_location, moved_by, moved_at)
     VALUES (?, ?, ?, 'YARD', ?, NOW())`,
    [
      bin.bin_id,
      job.job_id,
      bin.customer_id ? `CUSTOMER:${bin.customer_id}` : "UNKNOWN",
      user.id
    ]
  );
}
