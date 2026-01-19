"use client";

import React, { useEffect, useState } from "react";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { CellEditPayload } from "@/app/types/CellEditPayload";
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
    meta: { editable: false },
  }),

  columnHelper.accessor("bin_name", {
    header: "Bin Name",
    meta: {
      editable: true,
      inputType: "text",
      apiField: "bin_name",
    },
  }),

  columnHelper.accessor("created_at", {
    header: "Created Date",
    meta: {
      editable: false,
      
    },
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


  const handleInventoryEdit = async ({
  rowId,
  value,
  columnMeta,
}: CellEditPayload<BinType>) => {
  if (!columnMeta?.apiField) return;

  await fetch(`/api/bintype/${rowId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      [columnMeta.apiField]: value,
    }),
  });

  // Optimistic UI update
  setBinTypes(prev =>
  prev.map(row =>
    // Ensure you compare the correct ID field
    (row.id === rowId || row.id === Number(rowId))
      ? { ...row, [columnMeta.apiField!]: value }
      : row
  )
);
};


  if (loading) return <div>Loading Inventory Data...</div>;

  return (
    <div className="p-8">
     
  <ReusableDataTable
  data={binTypes}
  allAvailableColumns={columns}
  pageName="inventory"
  onCellEdit={handleInventoryEdit}
  detailPagePath="/inventory/[id]"
  idField="id"
/>

    </div>
  );
}