"use client";

import React, { useEffect, useState } from "react";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { Chip, Box, Typography } from "@mui/material";

type Bin = {
  bin_id: number;
  bin_number: string;
  bin_description: string;
  bin_status: string; // Dynamic status from SQL Join
  bin_condition: string;
  bin_name: string;
  customer_name: string | null;
  company_name: string;
  comment: string;
  printed: number;
  created_at: string;
  modified_at: string;
};

const columnHelper = createColumnHelper<Bin>();

// Dynamic helper for chip colors
const getStatusColor = (status: string) => {
  const s = status?.toLowerCase() || "";
  if (s.includes("service")) return "success";
  if (s.includes("missing")) return "error";
  if (s.includes("out")) return "warning";
  if (s.includes("wrms")) return "secondary";
  return "default";
};

export default function BinsPage() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    columnHelper.accessor("bin_number", {
      header: "Bin Number",
      cell: (info) => <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{info.getValue()}</Typography>,
    }),
    columnHelper.accessor("bin_name", {
      header: "Bin Type",
      cell: (info) => info.getValue() || "—",
    }),
      columnHelper.accessor("bin_description", {
      header: "Bin Description",
      cell: (info) => info.getValue() || "—",
    }),
    columnHelper.accessor("bin_status", {
      header: "Status",
      cell: (info) => (
        <Chip 
          label={info.getValue() || "Unknown"} 
          color={getStatusColor(info.getValue()) as any} 
          size="small" 
          variant="outlined" 
        />
      ),
    }),
    columnHelper.accessor("customer_name", {
      header: "Assigned Customer",
      cell: (info) => info.getValue() || <Typography variant="caption" color="text.secondary">Unassigned</Typography>,
    }),
    columnHelper.accessor("company_name", {
      header: "Company",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("bin_condition", {
      header: "Condition",
      cell: (info) => info.getValue() || "N/A",
    }),
    columnHelper.accessor("comment", {
      header: "Notes",
      cell: (info) => info.getValue() || "—",
    }),
    columnHelper.accessor("printed", {
      header: "Label Printed",
      cell: (info) => (info.getValue() === 1 ? "✅ Yes" : "❌ No"),
    }),
    columnHelper.accessor("created_at", {
      header: "Created date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
      columnHelper.accessor("modified_at", {
      header: "Modified date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
  ];

  useEffect(() => {
    fetch("/api/bins")
      .then((res) => res.json())
      .then((data) => {
        const result = Array.isArray(data[0]) ? data[0] : data;
        setBins(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Bins Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <Box sx={{ p: 8 }}><Typography>Loading Bins...</Typography></Box>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Assets: Bins</Typography>
      <ReusableDataTable 
        data={bins} 
        allAvailableColumns={columns} 
        pageName="bins" 
      />
    </Box>
  );
}