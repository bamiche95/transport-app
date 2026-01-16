"use client";

import React, { useEffect, useState } from "react";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { createColumnHelper } from "@tanstack/react-table";

type BinType = {
  id: number;
  bin_name: string;
  created_at: string;
  modified_at: string;
};

const columnHelper = createColumnHelper<BinType>();

export default function InventoryPage() {
  const [binTypes, setBinTypes] = useState<BinType[]>([]);
  const [loading, setLoading] = useState(true);

  // Define columns specific to Bin Types
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("bin_name", {
      header: "Bin Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("created_at", {
      header: "Created Date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
  ];

  useEffect(() => {
    fetch("/api/bintype")
      .then((res) => res.json())
      .then((data) => {
        setBinTypes(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading Inventory Data...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Inventory: Bin Types</h1>
      <ReusableDataTable 
        data={binTypes} 
        allAvailableColumns={columns} 
        pageName="inventory"
      />
    </div>
  );
}