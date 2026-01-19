"use client";

import React, { useEffect, useState } from "react";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { Chip, Box, Typography } from "@mui/material";
import { CellEditPayload } from "@/app/types/CellEditPayload";
type Bin = {
  bin_id: number;
  bin_number: string;
  bin_description: string;
  bin_status: string; // Dynamic status from SQL Join
  bin_condition: string;
  bin_name: string;
  bin_type_id?: number; // FK to bintype table
  company_id: number;
  customer_name: string | null;
  company_name: string;
  comment: string;
  printed: number;
  created_at: string;
  modified_at: string;
  bin_status_id: number;
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
const [statusOptions, setStatusOptions] = useState<{ bin_status_id: number; label: string }[]>([]);
const normalizedStatusOptions = statusOptions.map(opt => ({
  id: opt.bin_status_id,
  // Ensure these match your database column names!
  label: opt.label , 
  value: opt.bin_status_id ,
}));
const [companyOptions, setCompanyOptions] = useState<{company_id: number; company_name:string}[]>([])
const normalizedCompanyOptions = companyOptions.map(opt => ({
  id: opt.company_id,
  label: opt.company_name,
  value: opt.company_id,
}));
const [binTypeOptions, setBinTypeOptions] = useState<{bin_type_id?: number; id?: number; bin_name: string}[]>([]);
const normalizedBinTypeOptions = binTypeOptions.map(opt => {
  const typeId = opt.bin_type_id ?? opt.id; // Use bin_type_id if available, otherwise use id
  return {
    id: typeId,
    label: opt.bin_name,
    value: typeId,
  };
});
useEffect(()=>{
  fetch("/api/company")
    .then((res) => res.json())
    .then((data) => {
      setCompanyOptions(data);
    })
    .catch((err) => console.error("Failed to load company options", err));
  
  }, []);


useEffect(() => {
  fetch("/api/bin_status")
    .then((res) => res.json())
    .then((data) => {
      setStatusOptions(data);
    })
    .catch((err) => console.error("Failed to load bin statuses", err));
}, []);

useEffect(() => {
  fetch("/api/bintype")
    .then((res) => res.json())
    .then((data) => {
      setBinTypeOptions(data);
    })
    .catch((err) => console.error("Failed to load bin types", err));
}, []);


  const columns= React.useMemo(() =>[
    columnHelper.accessor("bin_number", {
      header: "Bin Number",
          meta: { editable: true, inputType: "text", apiField: "bin_number" }, 

      cell: (info) => info.getValue() || "—",
    }),
    columnHelper.accessor("bin_type_id", {
      header: "Bin Type",
      meta: { 
        editable: true, 
        inputType: "select", 
        apiField: "bin_type_id",
        options: normalizedBinTypeOptions
      },
      cell: (info) => {
        // Display bin_name from the row data since API returns it
        const rowData = info.row.original;
        return rowData.bin_name || "—";
      },
    }),
 columnHelper.accessor("bin_description", {
  header: "Bin Description",
  meta: { editable: true, inputType: "text", apiField: "bin_description" },
  size: 100,
  cell: (info) => {
    const value = info.getValue();
    if (React.isValidElement(value)) return value;
    return value || "—";
  }
}),

columnHelper.accessor("bin_status_id", {
  header: "Status",
  meta: {
    editable: true,
    inputType: "select",
    apiField: "bin_status_id",
    options: normalizedStatusOptions,
  },
  cell: (info) => {
    const statusId = info.getValue();
    const rowData = info.row.original;

    // Look for the label in the mapped options
    const foundOption = normalizedStatusOptions.find(
      (o) => Number(o.value) === Number(statusId)
    );
    // Fallback to the bin_status string that came directly from the /api/bins join
    const statusLabel = foundOption?.label || rowData.bin_status || "Unknown";

    return (
      <Chip
        label={statusLabel}
        color={getStatusColor(statusLabel)}
        size="small"
        variant="outlined"
      />
    );
  },
}),

columnHelper.accessor("customer_name", {
  header: "Customer",
  meta: { editable: true, inputType: "text" },
  cell: (info) => {
    const value = info.getValue();
    if (React.isValidElement(value)) return value;
    return value || '-';
  }
}),

columnHelper.accessor("company_id", {
  header: "Company",
  meta: { 
    editable: true, 
    inputType: "select",
    apiField: "company_id", // The field sent to your PATCH API
    options: normalizedCompanyOptions 
  },
  cell: (info) => {
    const companyId = info.getValue();
    const rowData = info.row.original;

    // Look for the label in the fetched company list
    const found = normalizedCompanyOptions.find(
      (o) => Number(o.value) === Number(companyId)
    );

    // Use the found label, or fallback to the company_name already in the bin data
    return found?.label || rowData.company_name || "—";
  },
}),
    columnHelper.accessor("bin_condition", {
      header: "Condition",
      meta: { editable: true, inputType: "text", apiField:'bin_condition'  },
      cell: (info) => info.getValue() || "N/A",
    }),
    columnHelper.accessor("comment", {
      header: "Comment",
      meta: { editable: true, inputType: "text",apiField:'comment'  },

      cell: (info) => info.getValue() || "—",
    }),
columnHelper.accessor("printed", {
  header: "Label Printed",
  meta: { 
    editable: true, 
    inputType: "select",
    apiField: "printed", // Fixed typo here
    options: [
      { id: "yes", label: "Yes", value: 1 },
      { id: "no", label: "No", value: 0 }
    ]
  },
  cell: (info) => (Number(info.getValue()) === 1 ? "✅ Yes" : "❌ No"),
}),
    columnHelper.accessor("created_at", {
      header: "Created date",
      meta: { editable: false,   },

      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
      columnHelper.accessor("modified_at", {
      header: "Modified date",
      meta: { editable: false,  },

      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
  ], [normalizedStatusOptions, normalizedCompanyOptions, normalizedBinTypeOptions]);

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


const handleBinsEdit = async ({ rowId, value, columnMeta }: CellEditPayload<Bin>) => {
  if (!columnMeta?.apiField) {
    throw new Error("Column not configured for editing");
  }

  console.log("DEBUG: Raw value received:", value, "Type:", typeof value);

  // Convert numeric fields to proper types
  const numericFields = ["bin_type_id", "bin_status_id", "company_id", "printed"];
  let finalValue: any = value;
  
  if (numericFields.includes(columnMeta.apiField)) {
    finalValue = Number(value);
    if (isNaN(finalValue)) {
      console.error("ERROR: Failed to convert value to number:", value);
      throw new Error(`Invalid value for ${columnMeta.apiField}: ${value}`);
    }
  }

  console.log("DEBUG: Final value:", finalValue, "Type:", typeof finalValue, "For field:", columnMeta.apiField);

  // Optimistic UI update FIRST
  setBins((prev) =>
    prev.map((row) => {
      if (row.bin_id === rowId || row.bin_id === Number(rowId)) {
        const updatedRow = { ...row, [columnMeta.apiField!]: finalValue };
        
        // If updating bin_type_id, also update bin_name from the binTypeOptions lookup
        if (columnMeta.apiField === "bin_type_id") {
          const foundType = binTypeOptions.find(opt => (opt.bin_type_id ?? opt.id) === finalValue);
          if (foundType) {
            updatedRow.bin_name = foundType.bin_name;
          }
        }
        
        return updatedRow;
      }
      return row;
    })
  );

  // Then sync with API
  try {
    const payload = { [columnMeta.apiField]: finalValue };
    console.log("Sending payload:", JSON.stringify(payload), "to /api/bins/", rowId);
    const res = await fetch(`/api/bins/${rowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update bin");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update bin";
    throw new Error(message);
  }
};



  if (loading) return <Box sx={{ p: 8 }}><Typography>Loading Bins...</Typography></Box>;

  return (
    <div className="p-8">
     
      <ReusableDataTable 

        data={bins} 
        allAvailableColumns={columns} 
        pageName="bins" 
          onCellEdit={handleBinsEdit}

      />
    </div>
  );
}