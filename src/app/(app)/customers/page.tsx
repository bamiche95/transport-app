"use client";

import React, { useEffect, useState } from "react";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { Box, Typography } from "@mui/material";
// Import the columns and the type
import { customerColumns, Customer } from "@/app/components/customer_columns"; 

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
      />
    </Box>
  );
}