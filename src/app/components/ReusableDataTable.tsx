"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  SortingState,
  HeaderGroup,
  Row,
  Cell,
  Table as ReactTable
} from "@tanstack/react-table";
import { useFilterStore } from "@/store/useFilterStore";
import GetAppIcon from '@mui/icons-material/GetApp';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Typography, IconButton, Divider,
  Stack, Checkbox, Snackbar, Alert, CircularProgress,
  capitalize
} from "@mui/material";
import {
  FilterList, Search, ArrowUpward, ArrowDownward, Sort,
  Edit as EditIcon, Check, ChevronLeft, ChevronRight, Delete, Close,
} from "@mui/icons-material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TableLayoutDrawer from "./LayoutView";
import { CellEditPayload } from "../types/CellEditPayload";
import { EditableColumnMeta } from "../types/EditableColumnMeta";
import EditableCell from "./EditableCell";
import DetailQuickView from "./DetailQuickView";

interface ReusableTableProps {
  data: any[];
  allAvailableColumns: ColumnDef<any, any>[];
  pageName: string;
  onCellEdit?: (payload: CellEditPayload<any>) => Promise<void> | void;
  onDeleteRows?: (ids: any[]) => void;
  detailPagePath?: string; // Path pattern like "/inventory/[id]"
  idField?: string; // ID field name like "id" or "bin_type_id"
  getRowStyle?: (row: any) => React.CSSProperties; // New prop for row styling
}

export default function ReusableDataTable({ data, allAvailableColumns, pageName, onCellEdit, onDeleteRows, detailPagePath, idField = "id", getRowStyle }: ReusableTableProps) {
  const router = useRouter();
  const [tableData, setTableData] = useState(data);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const [editingCell, setEditingCell] = useState<{ rowId: string, colId: string } | null>(null);
  const [errorSnackbar, setErrorSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  // UI State for Views
  const [viewName, setViewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [editingFilterId, setEditingFilterId] = useState<number | null>(null);

  //column order on load state
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // savedFilters here
  const { setActiveTable, setSavedFilters, savedFilters } = useFilterStore();
  const rowLength = tableData.length;

  // Helper to sanitize state against current columns
  const sanitizeState = (config: any, tableInstance: ReactTable<any>) => {
    const validIds = new Set(tableInstance.getAllLeafColumns().map(c => c.id));
    return {
      filters: (config.filters || []).filter((f: any) => validIds.has(f.id)) as ColumnFiltersState,
      visibility: Object.fromEntries(
        Object.entries(config.visibility || {}).filter(([id]) => validIds.has(id))
      ) as VisibilityState,
      columnOrder: (config.columnOrder || []).filter((id: string) => validIds.has(id)) as string[]
    };
  };

  // Define custom filter functions
  const filterFns = useMemo(() => ({
    weakEquals: (row: any, columnId: string, filterValue: any) => {
      const rowValue = row.getValue(columnId);
      if (filterValue === "" || filterValue === undefined || filterValue === null) return true;
      return String(rowValue) === String(filterValue);
    },
    // flexibleSearch is now defined inline in columnsWithSelection to avoid circular dependency with 'table'
    relativeDate: (row: any, columnId: string, filterValue: any) => {
      if (!filterValue) return true;
      const rowValue = row.getValue(columnId);
      if (!rowValue) return false;

      const date = new Date(rowValue);
      const now = new Date();

      const startOfDay = (d: Date) => {
        const res = new Date(d);
        res.setHours(0, 0, 0, 0);
        return res;
      };

      const endOfDay = (d: Date) => {
        const res = new Date(d);
        res.setHours(23, 59, 59, 999);
        return res;
      };

      const today = startOfDay(now);
      const tomorrow = addDays(today, 1);
      const yesterday = subDays(today, 1);

      function addDays(d: Date, days: number) {
        const res = new Date(d);
        res.setDate(res.getDate() + days);
        return res;
      }
      function subDays(d: Date, days: number) {
        return addDays(d, -days);
      }

      const jobTime = date.getTime();

      // Handle Range Filter (comma separated)
      if (filterValue.includes(',')) {
        const [startStr, endStr] = filterValue.split(',');
        const s = startStr ? startOfDay(new Date(startStr)).getTime() : -Infinity;
        const e = endStr ? endOfDay(new Date(endStr)).getTime() : Infinity;
        return jobTime >= s && jobTime <= e;
      }

      switch (filterValue) {
        case "today":
          return jobTime >= today.getTime() && jobTime <= endOfDay(today).getTime();
        case "yesterday":
          return jobTime >= yesterday.getTime() && jobTime <= endOfDay(yesterday).getTime();
        case "tomorrow":
          return jobTime >= tomorrow.getTime() && jobTime <= endOfDay(tomorrow).getTime();
        case "this_week": {
          const start = new Date(today);
          start.setDate(today.getDate() - today.getDay());
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return jobTime >= start.getTime() && jobTime <= endOfDay(end).getTime();
        }
        case "last_week": {
          const start = new Date(today);
          start.setDate(today.getDate() - today.getDay() - 7);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return jobTime >= start.getTime() && jobTime <= endOfDay(end).getTime();
        }
        case "next_week": {
          const start = new Date(today);
          start.setDate(today.getDate() - today.getDay() + 7);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return jobTime >= start.getTime() && jobTime <= endOfDay(end).getTime();
        }
        case "last_7_days":
          return jobTime >= subDays(today, 7).getTime() && jobTime <= endOfDay(today).getTime();
        case "next_7_days":
          return jobTime >= today.getTime() && jobTime <= endOfDay(addDays(today, 7)).getTime();
        case "this_month": {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return jobTime >= start.getTime() && jobTime <= endOfDay(end).getTime();
        }
        case "last_month": {
          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const end = new Date(now.getFullYear(), now.getMonth(), 0);
          return jobTime >= start.getTime() && jobTime <= endOfDay(end).getTime();
        }
        default:
          return true;
      }
    },
  }), []);

  // Add Checkbox Column to the beginning of columns
  const columnsWithSelection = useMemo<ColumnDef<any, any>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          size="small"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Stack direction="row" spacing={1}>
          <Checkbox
            size="small"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onClick={(e) => e.stopPropagation()} // <<< Prevent row click
            onChange={row.getToggleSelectedHandler()}
          />

          <DetailQuickView data={row.original} />
        </Stack>
      ),
    },
    ...allAvailableColumns.map(col => ({
      ...col,
      id: col.id || (col as any).accessorKey, // Ensure ID is preserved
      // Use robust flexibleSearch mapping for all non-date columns
      filterFn: (col.meta as any)?.inputType === 'date'
        ? 'relativeDate'
        : (row: any, columnId: string, filterValue: any) => {
          if (!filterValue) return true;
          const rowValue = row.getValue(columnId);
          const search = String(filterValue).toLowerCase();

          // 1. Search in raw value (works for text, IDs, numbers, etc)
          if (String(rowValue ?? "").toLowerCase().includes(search)) return true;

          // 2. Search in option labels if options exist (for columns where IDs are stored but labels shown)
          const options = (col.meta as any)?.options;
          if (options) {
            return options.some((opt: any) =>
              opt.label.toLowerCase().includes(search) && String(opt.value) === String(rowValue)
            );
          }
          return false;
        },
    }) as any),
  ], [allAvailableColumns]);

  const table: ReactTable<any> = useReactTable({
    data: tableData,
    columns: columnsWithSelection,
    filterFns, // Register custom filter functions
    state: { columnVisibility, columnFilters, sorting, rowSelection, columnOrder },
    initialState: {
      pagination: {
        pageSize: 200, // Set your desired default here (e.g., 25 instead of 10)
      },
    },
    enableRowSelection: true, // Enable selection
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnOrderChange: setColumnOrder, // Add this handler
    getRowId: (row) => {
      const id = row.id ?? row.bin_id ?? row.job_id ?? row.customer_id ?? row.bin_type_id;
      return String(id);
    }
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const isSelectionEmpty = selectedRows.length === 0;

  const handleDeleteSelected = async (entityName: string, idField: string = "id") => {
    const selectedRowIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    if (selectedRowIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedRowIds.length} ${entityName}(s)?`)) return;

    try {
      const res = await fetch(`/api/tabledeleterows`, {
        method: "POST", // generic delete endpoint
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: entityName, ids: selectedRowIds, idField: 'bin_type_id' }),
      });

      if (!res.ok) throw new Error("Failed to delete rows");

      // ✅ Remove deleted rows from local state
      setTableData(prev => prev.filter(row => !selectedRowIds.includes(String(row[idField]))));

      // Clear selection
      setRowSelection({});

      alert(`${selectedRowIds.length} ${entityName}(s) deleted successfully!`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete rows");
    }
  };



  const handleGlobalSearch = () => {
    const newFilters = Object.entries(filterInputs)
      .filter(([_, value]) => value !== "")
      .map(([id, value]) => ({ id, value }));
    setColumnFilters(newFilters);
  };


  const handleAdd = async () => {
    const baseRoute = pageName.toLowerCase().trim();

    if (baseRoute === "jobs") {
      // This will trigger the [id] page with params.id = "new"
      router.push("/jobs/new");
    } else if (baseRoute === "customer") {
      // This will trigger the [id] page with params.id = "new"
      router.push("/customers/new");
    } else {
      const pageRoute = baseRoute.replace(/\s+management/i, '');
      router.push(`/${pageRoute}/new`);
    }
  };

  const handleSaveEdit = async (row: any, cell: any, newValue: any) => {
    const columnDef = cell.column.columnDef;
    const meta = columnDef.meta as EditableColumnMeta | undefined;

    if (!meta?.apiField) {
      setErrorSnackbar({ open: true, message: "Cannot save: column not configured for editing" });
      return;
    }

    try {
      await onCellEdit?.({
        rowId: row.id,
        columnId: cell.column.id,
        value: newValue,
        row: row.original,
        columnMeta: meta,
      });
      setEditingCell(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save changes";
      setErrorSnackbar({ open: true, message });
      throw error; // Re-throw so EditableCell knows it failed
    }
  };


  const checkIsDateColumn = (columnId: string) => {
    const id = columnId.toLowerCase();
    // Matches "date", "created_at", "updated_at", but NOT "status"
    return id === 'date' || id.endsWith('_at') || id.includes('date');
  };



  // Sync this table instance to the sidebar whenever the page loads
  React.useEffect(() => {
    setActiveTable(table);

    const fetchFilters = async () => {
      try {
        const res = await fetch(`/api/filters?page=${pageName}`);
        const data = await res.json();
        const filters = Array.isArray(data[0]) ? data[0] : data;
        setSavedFilters(filters);

        const defaultView = filters.find((f: any) => f.is_default === 1);

        if (defaultView) {
          const rawConfig = typeof defaultView.config_json === 'string'
            ? JSON.parse(defaultView.config_json)
            : defaultView.config_json;

          const config = sanitizeState(rawConfig, table);

          table.setColumnFilters(config.filters);
          table.setColumnVisibility(config.visibility);

          // --- ADD THIS PART ---
          if (config.columnOrder.length > 0) {
            table.setColumnOrder(config.columnOrder);
          } else {
            // If no order saved, initialize with default column IDs
            table.setColumnOrder(columnsWithSelection.map(c => c.id as string));
          }
        } else {
          // If NO default view exists, still initialize the order state 
          // to prevent dnd-kit "snap back" issues later
          table.setColumnOrder(columnsWithSelection.map(c => c.id as string));
        }
      } catch (error) {
        console.error("Error loading default view:", error);
      }
    };
    if (pageName) fetchFilters();
  }, [pageName]); // Removed 'table' from deps to prevent infinite loops

  // Sync filter inputs when column filters change (e.g. from drawer)
  React.useEffect(() => {
    const inputs: Record<string, string> = {};
    columnFilters.forEach((f) => {
      inputs[f.id] = String(f.value);
    });
    setFilterInputs(inputs);
  }, [columnFilters]);

  const pageSizes = [200, 250, 300, 350, 400, 500, data.length];


  const PaginationControls = () => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        p: 1,
        bgcolor: "#f8fafc",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="caption">
          {selectedRows.length} selected | Page{" "}
          {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </Typography>

        <TextField
          select
          size="small"
          label="Rows"
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          sx={{ width: 80 }}

          slotProps={{ select: { native: true } }}
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>

          ))}
        </TextField>
      </Stack>

      <Stack direction="row" alignItems="center">
        <Typography variant="caption" sx={{ mr: 1 }}>
          Showing {table.getFilteredRowModel().rows.length} records of {data.length}
        </Typography>
        <IconButton
          size="small"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );

  const saveCurrentView = async () => {
    if (!viewName.trim()) {
      alert("Please enter a name for this view");
      return;
    }
    setIsSaving(true);
    const config = {
      filters: table.getState().columnFilters,
      visibility: table.getState().columnVisibility,
      columnOrder: table.getState().columnOrder,
    };

    try {
      const response = await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_name: pageName,
          filter_name: viewName,
          config_json: JSON.stringify(config),
          is_default: isDefault,
        }),
      });

      if (response.ok) {
        const newFilter = await response.json();
        setSavedFilters([...savedFilters, newFilter]);
        setViewName("");
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Save Error:", error);
    } finally {
      setIsSaving(false);
    }
  };


  const handleUpdateView = async (filterId: number) => {
    const currentConfig = {
      filters: table.getState().columnFilters,
      visibility: table.getState().columnVisibility,
      columnOrder: table.getState().columnOrder, // ADD THIS
    };

    try {
      const response = await fetch(`/api/filters/${filterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter_name: viewName, // Updated name from the shared TextField
          config_json: JSON.stringify(currentConfig),
          is_default: isDefault ? 1 : 0
        }),
      });

      if (response.ok) {
        setSavedFilters(savedFilters.map(f =>
          f.filter_id === filterId
            ? { ...f, filter_name: viewName, config_json: JSON.stringify(currentConfig), is_default: isDefault ? 1 : 0 }
            : f
        ));
        alert("View updated successfully!");
      }
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  const deleteFilter = async (filterId: number) => {
    if (!window.confirm("Are you sure you want to delete this view?")) return;
    try {
      const response = await fetch(`/api/filters/${filterId}`, { method: "DELETE" });
      if (response.ok) {
        setSavedFilters(savedFilters.filter(f => f.filter_id !== filterId));
      }
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const applyFilter = (configJson: any) => {
    try {
      const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
      const clean = sanitizeState(config, table);

      table.setColumnFilters(clean.filters);
      table.setColumnVisibility(clean.visibility);

      if (clean.columnOrder.length > 0) {
        table.setColumnOrder(clean.columnOrder);
      } else {
        // Fallback to default order if none exists
        table.resetColumnOrder();
      }
    } catch (e) {
      console.error("Failed to parse filter config", e);
    }
  };


  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,

      maxWidth: "100vw",  // Add this
      boxSizing: "border-box"
    }}>
      {/* Top Controls with Conditional Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{pageName} Management</Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            disabled={Object.keys(rowSelection).filter(id => rowSelection[id]).length === 0}
            onClick={() => handleDeleteSelected(pageName.toLowerCase(), idField)}
          >
            Delete
          </Button>



          <Button
            variant="contained"
            color="primary"
            startIcon={<GetAppIcon />}
            disabled={selectedRows.length !== 1} // Only enable edit if exactly ONE is selected
          >
            Export
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">

          <Button startIcon={<AddCircleIcon />} variant="contained" onClick={() => handleAdd()}>
            Add {pageName}
          </Button>

          <Button variant="outlined" startIcon={<FilterList />} onClick={() => setSidebarOpen(true)}>
            Layout & Views
          </Button>
        </Stack>


      </Box>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <PaginationControls />
        <TableContainer sx={{ maxHeight: 700, overflowX: 600, whiteSpace: "nowrap" }}>
          <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup: HeaderGroup<any>) => (
                <React.Fragment key={headerGroup.id}>
                  <TableRow>
                    {headerGroup.headers.map(header => (
                      <TableCell
                        key={header.id}
                        onClick={header.column.id !== 'select' ? header.column.getToggleSortingHandler() : undefined}
                        sx={{
                          bgcolor: "#f1f5f9", fontWeight: 'bold', cursor: header.column.id !== 'select' ? 'pointer' : 'default', top: 0, // Sticks to the very top
                          left: 0,
                          zIndex: 3,
                          fontSize: 12
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.id !== 'select' && (
                            header.column.getIsSorted() === "asc" ? <ArrowUpward fontSize="inherit" /> :
                              header.column.getIsSorted() === "desc" ? <ArrowDownward fontSize="inherit" /> :
                                <Sort fontSize="inherit" sx={{ opacity: 0.3 }} />
                          )}
                        </Stack>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Search Row */}
                  <TableRow>
                    {headerGroup.headers.map((header, index) => {
                      // Get the meta from the column definition
                      const columnMeta = header.column.columnDef.meta as EditableColumnMeta | undefined;

                      // Use the explicit inputType if it exists, otherwise fallback to string check
                      const isDate = columnMeta?.inputType === "date" || checkIsDateColumn(header.id);

                      const isSelect = header.id === "select";
                      return (
                        <TableCell key={header.id} sx={{ bgcolor: "#f8fafc", py: 1, top: 40, zIndex: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {index === 0 && (
                              <Button  onClick={handleGlobalSearch}  sx={{ bgcolor: '#1ad414ff', border: '1px solid #e2e8f0', fontSize: 11, color: '#000000ff' }}>
                                <Search fontSize="small" /> Search
                              </Button>
                            )}
                            {!isSelect && (
                              columnMeta?.options ? (
                                <TextField
                                  select
                                  fullWidth
                                  size="small"
                                  value={filterInputs[header.id] || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setFilterInputs(p => ({ ...p, [header.id]: val }));
                                    table.getColumn(header.id)?.setFilterValue(val);
                                  }}
                                  slotProps={{
                                    select: {
                                      native: true,
                                    },
                                  }}
                                  sx={{
                                    bgcolor: 'white',
                                    '& .MuiInputBase-input': { fontSize: '0.75rem' }
                                  }}
                                >
                                  <option value="">All</option>
                                  {columnMeta.options.map((opt: any) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </TextField>
                              ) : isDate ? (
                                <Stack direction="row" spacing={0.5} sx={{ width: '100%' }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    value={filterInputs[header.id]?.split(',')[0] || ""}
                                    onChange={(e) => {
                                      const current = filterInputs[header.id] || ",";
                                      const parts = current.split(',');
                                      const to = parts[1] || "";
                                      setFilterInputs(p => ({ ...p, [header.id]: `${e.target.value},${to}` }));
                                    }}
                                    slotProps={{
                                      inputLabel: { shrink: true },
                                    }}
                                    sx={{
                                      bgcolor: 'white',
                                      '& .MuiInputBase-input': { fontSize: '0.65rem', padding: '4px' }
                                    }}
                                  />
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="date"
                                    value={filterInputs[header.id]?.split(',')[1] || ""}
                                    onChange={(e) => {
                                      const current = filterInputs[header.id] || ",";
                                      const parts = current.split(',');
                                      const from = parts[0] || "";
                                      setFilterInputs(p => ({ ...p, [header.id]: `${from},${e.target.value}` }));
                                    }}
                                    slotProps={{
                                      inputLabel: { shrink: true },
                                    }}
                                    sx={{
                                      bgcolor: 'white',
                                      '& .MuiInputBase-input': { fontSize: '0.65rem', padding: '4px' }
                                    }}
                                  />
                                </Stack>
                              ) : (
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="text"
                                  value={filterInputs[header.id] || ""}
                                  onChange={(e) => setFilterInputs(p => ({ ...p, [header.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleGlobalSearch();
                                    }
                                  }}
                                  sx={{
                                    bgcolor: 'white',
                                    '& .MuiInputBase-input': { fontSize: '0.75rem' }
                                  }}
                                />
                              )
                            )}
                          </Stack>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </React.Fragment>
              ))}
            </TableHead>

            <TableBody>
              {table.getRowModel().rows.map((row: Row<any>) => (
                <TableRow
                  key={row.id}
                  selected={row.getIsSelected()}
                  hover
                  onClick={() => {
                    if (detailPagePath && !editingCell) {
                      const rowData = row.original;
                      const id = rowData[idField];
                      if (id) {
                        const finalPath = detailPagePath.replace("[id]", id);
                        router.push(finalPath);
                      }
                    }
                  }}
                  sx={{
                    cursor: detailPagePath ? "pointer" : "default",
                    transition: "background-color 0.2s",
                    ...(getRowStyle ? getRowStyle(row.original) : {}), // Apply custom styles here
                  }}
                >
                  {row.getVisibleCells().map((cell: Cell<any, any>) => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === cell.column.id;

                    return (
                      <TableCell
                        key={`${row.id}-${cell.column.id}`}
                        sx={{
                          position: "relative",
                          minWidth: cell.column.id === 'select' ? 50 : 120,
                          maxWidth: 260,
                          overflow: isEditing ? "visible" : "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          zIndex: isEditing ? 10 : "auto",
                          "&:hover .edit-btn": { opacity: 1 },

                          // --- ADD THIS ---
                          fontSize: "11px !important", // Use !important to override component defaults
                          "& *": {
                            fontSize: "11px !important", // Force all child elements (Chips, Inputs, Typography)
                          },
                        }}
                      >
                        {cell.column.id === 'select' ? (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        ) : (
                          <EditableCell
                            initialValue={cell.getValue()}
                            renderedContent={flexRender(cell.column.columnDef.cell, cell.getContext())}
                            row={row}
                            column={cell.column}
                            isEditing={isEditing}
                            onEditStart={() =>
                              setEditingCell({ rowId: row.id, colId: cell.column.id })
                            }
                            onSave={(value: any) => handleSaveEdit(row, cell, value)}
                            onCancel={() => setEditingCell(null)}

                          />
                        )}
                      </TableCell>
                    );
                  })}

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationControls />
      </Paper>
      <TableLayoutDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        table={table}
        savedFilters={savedFilters}
        pageName={pageName}
        viewName={viewName}
        setViewName={setViewName}
        isDefault={isDefault}
        setIsDefault={setIsDefault}

        // Pass the editing ID so the drawer knows which one is being modified
        editingFilterId={editingFilterId}
        setEditingFilterId={setEditingFilterId}

        applyFilter={applyFilter}
        deleteFilter={deleteFilter}
        saveView={saveCurrentView}
        updateView={handleUpdateView} // This now handles name + layout
        handleRenameFilter={handleUpdateView} // Map to same function for UX consistency
      />
      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={4000}
        onClose={() => setErrorSnackbar({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setErrorSnackbar({ open: false, message: "" })}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}