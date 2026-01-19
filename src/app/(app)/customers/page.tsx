"use client";

import React, { useEffect, useState } from "react";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { Box, Typography } from "@mui/material";
// Import the columns and the type
import { customerColumns, Customer } from "@/app/components/customer_columns"; 
import { CellEditPayload } from "@/app/types/CellEditPayload";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        const result = Array.isArray(data[0]) ? data[0] : data;
        setCustomers(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  const handleCustomersEdit = async ({ rowId, value, columnMeta }: CellEditPayload<Customer>) => {
    if (!columnMeta?.apiField) {
      throw new Error("Column not configured for editing");
    }

    // Optimistic update FIRST
    setCustomers(prev => prev.map(row => 
      row.customer_id === rowId || row.customer_id === Number(rowId)
        ? { ...row, [columnMeta.apiField as string]: value }
        : row
    ));

    // Then sync with API
    try {
      const res = await fetch(`/api/customers/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [columnMeta.apiField]: value })
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to update customer");
    }
  };

  if (loading) return (
    <Box sx={{ p: 8, textAlign: 'center' }}>
      <Typography>Loading Customer Directory...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 4 }}>
      <ReusableDataTable 
        data={customers} 
        allAvailableColumns={customerColumns} 
        pageName="customers"
        onCellEdit={handleCustomersEdit}
        detailPagePath="/customers/[id]"
        idField="customer_id"
      />
    </Box>
  );
}