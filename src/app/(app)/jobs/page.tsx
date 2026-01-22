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
  bin_type_id: number;
  company_id: number;
  qty: number;

  company_notes: string;
  job_type_id: number;

  jobs_notes: string;
  opening_times: string;
  office_notes: string;
  booking_portal_id: number;
  adr: number;
  lug_lock: number;

  phone_number: number;
  contact_name: string;
  postcode: string;
  city: string;
  town: string;
  country: string;
  sic_code: number;
  created_by: string;
  assigned_to: string;
  modified_by: string;
  created_at: Date;
  modified_at: Date;
  waste_type_id: number;
  job_date: Date;
  assigned_to_label: string;
  customer_name: string;
  company_name: string;
  job_type_name: string;
  waste_type_name: string;
  bin_name: string;
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
    columnHelper.accessor("job_date", { 
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