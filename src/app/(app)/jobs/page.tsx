"use client";

import React, { useEffect, useState, useMemo } from "react";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { Chip, Box, Typography } from "@mui/material";
import { CellEditPayload } from "@/app/types/CellEditPayload";

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
  created_at: string;
  modified_at: string;
  waste_type_id: number;
  job_date: string;
  assigned_to_label: string;
  customer_name: string;
  company_name: string;
  job_type_name: string;
  waste_type_name: string;
  bin_name: string;
  job_status: string;
  job_status_id: number;
};
type JobTypeOption = { job_type_id: number; job_type_name: string };
type WasteTypeOption = { waste_type_id: number; waste_type_name: string };
type BinTypeOption = { id: number; bin_name: string };
type JobStatusOption = { job_status_id: number; job_status_name: string };
type AssignedToOptions = { user_id: number; label: string };

const columnHelper = createColumnHelper<Job>();

const getStatusColor = (job_status: any) => {
  // Convert to string and handle null/undefined
  const s = String(job_status || "").toLowerCase();

  if (s.includes("complete")) return "success";
  if (s.includes("cancel")) return "error";
  if (s.includes("progress")) return "warning";
  return "default";
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Options States for Select Inputs
  const [jobTypeOptions, setJobTypeOptions] = useState<JobTypeOption[]>([]);
  const [wasteTypeOptions, setWasteTypeOptions] = useState<WasteTypeOption[]>([]);
  const [binTypeOptions, setBinTypeOptions] = useState<BinTypeOption[]>([]);
  const [jobStatusOptions, setJobStatusOptions] = useState<JobStatusOption[]>([]);
  const [assignedToOptions, setAssignedToOptions] = useState<AssignedToOptions[]>([]);

  const [priorityOptions, setPriorityOptions] = useState<{ label: string, value: string }[]>([]);
  // Normalized options for ReusableDataTable's EditableCell
  const normalizedJobTypes = jobTypeOptions.map((o: any) => ({ label: o.job_type_name, value: o.job_type_id }));
  const normalizedWasteTypes = wasteTypeOptions.map((o: any) => ({ label: o.waste_type_name, value: o.waste_type_id }));
  const normalizedBinTypes = binTypeOptions.map((o: any) => ({ label: o.bin_name, value: o.id }));
  const normalizedJobStatusTypes = jobStatusOptions.map((o: any) => ({ label: o.job_status_name, value: o.job_status_id }));
  const normalizedAssignedToOptions = assignedToOptions.map((o: any) => ({ label: o.label, value: o.user_id }));

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [jobTypes, wasteTypes, binTypes, jobStatusTypes, priorityRes, assignedToRes] = await Promise.all([
          fetch("/api/jobs/jobtype").then((res) => res.json()),
          fetch("/api/jobs/wastetypes").then((res) => res.json()),
          fetch("/api/bintype").then((res) => res.json()),
          fetch("/api/jobs/jobstatus").then((res) => res.json()),
          fetch("/api/jobs/priority").then((res) => res.json()),
          fetch("/api/jobs/assigned-to").then((res) => res.json()),


        ]);
        setJobTypeOptions(jobTypes);
        setWasteTypeOptions(wasteTypes);
        setBinTypeOptions(binTypes);
        setJobStatusOptions(jobStatusTypes);
        setPriorityOptions(priorityRes);
        setAssignedToOptions(assignedToRes)
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    fetchOptions();
  }, []);

  const columns = useMemo(() => [
    columnHelper.accessor("job_id", {
      id: "job_id",
      header: "ID",
      meta: { editable: false },
    }),

    columnHelper.accessor("job_status_id", {
      id: "job_status_id",
      header: "Status",
      meta: {
        editable: true,
        inputType: "select",
        apiField: "job_status_id", // Update this to match your DB column
        options: normalizedJobStatusTypes,
      },

      cell: (info) => {
        // Look up the label from options if the value is an ID, 
        // or fallback to the raw value
        const val = info.getValue();
        const option = normalizedJobStatusTypes.find(o => o.value === val);
        const label = option ? option.label : String(val || "Open");

        return <Chip label={label} color={getStatusColor(label)} size="small" variant="outlined" />;
      },
    }),

    columnHelper.accessor("customer_name", {
      id: "customer_name",
      header: "Customer",
      meta: {
        editable: true,
        inputType: "autocomplete",
        apiField: "customer_id",
        searchConfig: { searchUrl: "/api/customers", labelKey: "customer_name", valueKey: "customer_id" }
      },
      cell: (info) => info.getValue() || "—",
    }),

    columnHelper.accessor("address", {
      id: "address",
      header: "Address",
      meta: { editable: true, inputType: "text", apiField: "address" },
      cell: (info) => info.getValue() || "—",
    }),
    columnHelper.accessor("city", {
      header: "City",
      meta: { editable: true, inputType: "text", apiField: "city" },
    }),
    columnHelper.accessor("town", {
      header: "Town",
      meta: { editable: true, inputType: "text", apiField: "town" },
    }),

    columnHelper.accessor("postcode", {
      header: "Postcode",
      meta: { editable: true, inputType: "text", apiField: "postcode" },
    }),
    columnHelper.accessor("booking_portal_id", {
      header: "Booking Portal ID",
      meta: { editable: true, inputType: "text", apiField: "booking_portal_id" },
    }),
    columnHelper.accessor("contact_name", {
      header: "Contact Name",
      meta: { editable: true, inputType: "text", apiField: "contact_name" },
    }),
    columnHelper.accessor("job_type_id", {
      id: "job_type_id",
      header: "Job Type",
      meta: {
        editable: true,
        inputType: "select",
        apiField: "job_type_id",
        options: normalizedJobTypes,
      },
      cell: (info) => info.row.original.job_type_name || "—",
    }),

    columnHelper.accessor("waste_type_id", {
      id: "waste_type_id",
      header: "Waste Type",
      meta: {
        editable: true,
        inputType: "select",
        apiField: "waste_type_id",
        options: normalizedWasteTypes,
      },
      cell: (info) => info.row.original.waste_type_name || "—",
    }),
    columnHelper.accessor("assigned_to", {
      header: "Assigned to",
      meta: {
        editable: true,
        inputType: "select",
        apiField: "assigned_to",
        options: normalizedAssignedToOptions,
      },
      cell: (info) => info.row.original.assigned_to_label || "—",
    }),


    columnHelper.accessor("bin_type_id", {
      id: "bin_type_id",
      header: "Bin Type",
      meta: {
        editable: true,
        inputType: "select",
        drawerFilterType: "text",
        apiField: "bin_type_id",
        options: normalizedBinTypes,
      },
      cell: (info) => info.row.original.bin_name || "—",
    }),

    columnHelper.accessor("qty", {
      header: "Qty",
      meta: { editable: true, inputType: "text", apiField: "qty" },
    }),

    columnHelper.accessor("priority", {
      header: "Priority",
      meta: {
        editable: true,
        inputType: "select",
        apiField: "priority",
        // Generate strings '1' through '10'
        options: Array.from({ length: 10 }, (_, i) => ({
          label: String(i + 1),
          value: String(i + 1),
        })),
      },
      cell: (info) => {
        const val = info.getValue() || "5";
        const num = Number(val);

        // Gradient coloring
        let color: "success" | "warning" | "error" | "default" = "default";
        if (num <= 3) color = "success";
        else if (num <= 7) color = "warning";
        else color = "error";

        return (
          <Chip
            label={val}
            color={color}
            size="small"
            variant="filled"
            sx={{ fontWeight: 'bold', width: 32 }}
          />
        );
      },
    }),

    columnHelper.accessor("adr", {
      header: "ADR",
      meta: {
        editable: true,
        inputType: "select",
        apiField: "adr",
        options: [{ label: "Yes", value: 1 }, { label: "No", value: 0 }]
      },
      cell: (info) => (info.getValue() === 1 ? "✅ Yes" : "❌ No"),
    }),

    columnHelper.accessor("job_date", {
      id: "job_date",
      header: "Job Date",
      meta: { editable: true, inputType: "date", apiField: "job_date" },
      cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : "—",
    }),



    columnHelper.accessor("phone_number", {
      header: "Phone",
      meta: { editable: true, inputType: "text", apiField: "phone_number" },
    }),

    columnHelper.accessor("office_notes", {
      header: "Office Notes",
      meta: { editable: true, inputType: "text", apiField: "office_notes" },
    }),
    columnHelper.accessor("sic_code", {
      header: "Sic Code",
      meta: { editable: true, inputType: "text", apiField: "sic_code" },
    }),
    columnHelper.accessor("lug_lock", {
      header: "Lug Lock",
      meta: { editable: true, inputType: "text", apiField: "lug_log" },
    }),
    columnHelper.accessor("jobs_notes", {
      header: "Driver Notes",
      meta: { editable: true, inputType: "text", apiField: "jobs_notes" },
    }),

    columnHelper.accessor("created_at", {
      header: "Created",
      meta: { editable: false },
      cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : "—",
    }),
  ], [normalizedJobTypes, normalizedWasteTypes, normalizedBinTypes, normalizedJobStatusTypes]);

  const handleJobsEdit = async ({ rowId, value, columnMeta }: CellEditPayload<Job>) => {
    if (!columnMeta?.apiField) throw new Error("Column not configured for editing");

    // 1. Handle Numeric Conversions
    const numericFields = ["customer_id", "job_type_id", "waste_type_id", "bin_type_id", "qty", "adr", "job_status_id", "assigned_to"];
    const finalValue = numericFields.includes(columnMeta.apiField) ? Number(value) : value;

    // 2. Optimistic Update Logic
    setJobs((prev) =>
      prev.map((row) => {
        if (String(row.job_id) === String(rowId)) {
          const updatedRow = { ...row, [columnMeta.apiField!]: finalValue };

          // 3. Update companion "Label" fields so the UI updates immediately
          if (columnMeta.apiField === "job_status_id") {
            const match = jobStatusOptions.find(o => o.job_status_id === finalValue);
            // Change updatedRow.job_status to updatedRow.status
            updatedRow.status = match?.job_status_name || "";
          }
          if (columnMeta.apiField === "job_type_id") {
            updatedRow.job_type_name = jobTypeOptions.find(o => o.job_type_id === finalValue)?.job_type_name || "";
          }
          if (columnMeta.apiField === "waste_type_id") {
            updatedRow.waste_type_name = wasteTypeOptions.find(o => o.waste_type_id === finalValue)?.waste_type_name || "";
          }
          if (columnMeta.apiField === "bin_type_id") {
            updatedRow.bin_name = binTypeOptions.find(o => o.id === finalValue)?.bin_name || "";
          }
          if (columnMeta.apiField === "assigned_to") {
            updatedRow.assigned_to_label = assignedToOptions.find(o => o.user_id === finalValue)?.label || "";
          }

          return updatedRow;
        }
        return row;
      })
    );

    // 4. Sync with API
    try {
      const res = await fetch(`/api/jobs/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [columnMeta.apiField]: finalValue }),
      });

      if (!res.ok) throw new Error("Update failed");
    } catch (err) {
      console.error("PATCH Error:", err);
      // Optional: Refresh data from server on error to revert optimistic update
      // fetchJobs(); 
      throw err;
    }
  };

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ p: 8 }}><Typography>Loading Jobs...</Typography></Box>;

  return (
    <div>
      <ReusableDataTable
        data={jobs}
        allAvailableColumns={columns}
        pageName="jobs"
        onCellEdit={handleJobsEdit}
        detailPagePath="/jobs/[id]/jobdetails"
        idField="job_id"
      />
    </div>
  );
}