"use client";

import React, { useEffect, useState } from "react";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { createColumnHelper } from "@tanstack/react-table";

type Job = {
  job_id: number;
  customer_id: number;
  status: string | null;
  priority: string;
  address: string;
  job_datetime: string;
};

const columnHelper = createColumnHelper<Job>();

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    columnHelper.accessor("job_id", { header: "Job ID" }),
 columnHelper.accessor("status", { 
  header: "Status",
  cell: (info) => {
    const value = info.getValue();
    // Use optional chaining and a fallback class/text
    return (
      <span className={`status-${value?.toLowerCase() || 'unknown'}`}>
        {value || "Unknown"}
      </span>
    );
  }
}),
    columnHelper.accessor("priority", { header: "Priority" }),
    columnHelper.accessor("address", { header: "Address" }),
    columnHelper.accessor("job_datetime", { 
      header: "Schedule",
      cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleString() : "N/A"
    }),
  ];

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []); // Ensure it's always an array
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
     
      <ReusableDataTable 
        data={jobs} 
        allAvailableColumns={columns} 
        pageName="jobs" 
         detailPagePath="/jobs/[id]"
      />
    </div>
  );
}