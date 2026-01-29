"use client";

import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Alert, Typography } from "@mui/material";
import DriverJobsTable from "@/app/components/DriverJobsTable";

type JobRow = {
    job_id: number;
    priority: number;
    job_status_name: string;
    company_name: string;
    customer_name: string | null;
    driver_id: number | null;
    driver_name: string | null;
};

type DriverJobs = {
    driverId: number | null;
    driverName: string;
    jobs: JobRow[];
};

// Helper: group jobs by driver and sort by priority
const groupJobsByDriver = (rows: JobRow[]): DriverJobs[] => {
    const map = new Map<number | null, DriverJobs>();

    rows.forEach(job => {
        const key = job.driver_id ?? null;
        if (!map.has(key)) {
            map.set(key, {
                driverId: key,
                driverName: job.driver_name ?? "Unassigned",
                jobs: [],
            });
        }
        map.get(key)!.jobs.push(job);
    });

    // sort each driver's jobs by priority ascending
    map.forEach(driver => {
        driver.jobs.sort((a, b) => a.priority - b.priority);
    });

    return Array.from(map.values());
};

export default function JobsByDriverPage() {
    const [drivers, setDrivers] = useState<DriverJobs[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/jobs/driver-jobs"); // your backend API
                if (!res.ok) throw new Error("Failed to fetch jobs");
                const rows: JobRow[] = await res.json();
                const grouped = groupJobsByDriver(rows);
                setDrivers(grouped);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
                Jobs Grouped by Driver
            </Typography>

            {drivers.length === 0 ? (
                <Alert severity="info">No jobs found</Alert>
            ) : (
                <DriverJobsTable data={drivers} />
            )}
        </Box>
    );
}
