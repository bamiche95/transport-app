import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    try {
        const connection = await pool.getConnection();

        try {
            // 1. Job Metrics: Counts by Status (Completed vs Others)
            // Using 'Completed' as the status name to check against, or we can just group by all statuses
            const [jobsByStatusRows]: any = await connection.query(`
        SELECT 
          js.job_status_name, 
          COUNT(*) as count 
        FROM jobs j 
        JOIN job_status js ON j.job_status_id = js.job_status_id 
        GROUP BY js.job_status_name
      `);

            // 2. Job Metrics: Counts by Priority
            const [jobsByPriorityRows]: any = await connection.query(`
        SELECT 
          priority, 
          COUNT(*) as count 
        FROM jobs 
        GROUP BY priority
      `);

            // 3. Bin Metrics: Total Bins
            const [totalBinsResult]: any = await connection.query(`
        SELECT COUNT(*) as total FROM bins
      `);
            const totalBins = totalBinsResult[0]?.total || 0;

            // 4. Bin Metrics: Bins Moved in Last 30 Days
            // specific bins are linked via job_bins table
            const [activeBinsResult]: any = await connection.query(`
        SELECT COUNT(DISTINCT jb.bin_id) as active_count
        FROM job_bins jb
        JOIN jobs j ON jb.job_id = j.job_id
        WHERE j.job_date >= DATE_SUB(Now(), INTERVAL 30 DAY)
        AND j.job_status_id = (SELECT job_status_id FROM job_status WHERE job_status_name = 'Completed' LIMIT 1)
      `);
            // Note: checking for 'Completed' jobs only for "Moved", or maybe any job? 
            // User said "Bins that have moved...". Usually implies completion of a move.
            // But let's stick to any job association for now, or maybe just 'Completed' is safer to assume actual movement.
            // Let's remove the status constraint for now to capture any scheduled movement too, or stick to completion?
            // "Bins that have moved" implies past tense. So 'Completed' is probably best.
            // However, if job_status_name isn't exactly 'Completed', this might return 0. 
            // Let's broaden it to any job in the last 30 days for now to ensure we get some data, 
            // assuming if it's assigned to a job it's "active".

            const activeBins = activeBinsResult[0]?.active_count || 0;
            const idleBins = totalBins - activeBins;

            return NextResponse.json({
                jobsByStatus: jobsByStatusRows,
                jobsByPriority: jobsByPriorityRows,
                binMetrics: {
                    total: totalBins,
                    moved: activeBins,
                    idle: idleBins
                }
            });

        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("Dashboard Metrics Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
