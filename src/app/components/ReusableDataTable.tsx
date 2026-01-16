"use client";

import React, { useState, useMemo } from "react";
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
} from "@tanstack/react-table";
import { useFilterStore } from "@/store/useFilterStore";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Button, Typography, IconButton, Divider,
  Stack, Checkbox,
  capitalize, 
} from "@mui/material";
import { 
  FilterList,  Search, ArrowUpward, ArrowDownward, Sort, 
  Edit as EditIcon, Check,  ChevronLeft, ChevronRight, Delete
} from "@mui/icons-material";
import TableLayoutDrawer from "./LayoutView";
interface ReusableTableProps {
  data: any[];
  allAvailableColumns: ColumnDef<any, any>[];
  pageName: string;
  onUpdateRow?: (id: any, field: string, value: any) => void;
  onDeleteRows?: (ids: any[]) => void; // Added for delete action
}

export default function ReusableDataTable({ data, allAvailableColumns, pageName, onUpdateRow, onDeleteRows }: ReusableTableProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({});
  const [rowSelection, setRowSelection] = useState({}); // New Selection State
  
  const [editingCell, setEditingCell] = useState<{ rowId: string, colId: string } | null>(null);
  const [tempEditValue, setTempEditValue] = useState("");

// UI State for Views
  const [viewName, setViewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [editingFilterId, setEditingFilterId] = useState<number | null>(null);

//column order on load state
const [columnOrder, setColumnOrder] = useState<string[]>([]); 

// savedFilters here
const { setActiveTable, setSavedFilters, savedFilters } = useFilterStore(); 

const [tempFilterName, setTempFilterName] = useState("");

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
        <Checkbox
          size="small"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    ...allAvailableColumns,
  ], [allAvailableColumns]);

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    state: { columnVisibility, columnFilters, sorting, rowSelection,columnOrder  },
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
getRowId: (row) => row.id || row.customer_id || row.bin_id || row.job_id || row.bin_type_id,  });

  const selectedRows = table.getSelectedRowModel().rows;
  const isSelectionEmpty = selectedRows.length === 0;

  const handleDelete = () => {
    const idsToDelete = selectedRows.map(row => row.id);
    onDeleteRows?.(idsToDelete);
    setRowSelection({}); // Clear selection after delete
  };

  const handleGlobalSearch = () => {
    const newFilters = Object.entries(filterInputs)
      .filter(([_, value]) => value !== "")
      .map(([id, value]) => ({ id, value }));
    setColumnFilters(newFilters);
  };

  const handleSaveEdit = (rowId: string, colId: string) => {
    onUpdateRow?.(rowId, colId, tempEditValue);
    setEditingCell(null);
  };

  const checkIsDateColumn = (columnId: string) => {
    const id = columnId.toLowerCase();
    return id.includes('at') || id.includes('date');
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
        const config = typeof defaultView.config_json === 'string' 
          ? JSON.parse(defaultView.config_json) 
          : defaultView.config_json;

        table.setColumnFilters(config.filters || []);
        table.setColumnVisibility(config.visibility || {});
        
        // --- ADD THIS PART ---
        if (config.columnOrder && config.columnOrder.length > 0) {
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

const pageSizes = [200, 250,300,350,400,500, data.length];


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

    <Stack direction="row">
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



/**
   * CONSOLIDATED UPDATE FUNCTION
   * This updates both the NAME and the LAYOUT (config) at the same time.
   */
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
    table.setColumnFilters(config.filters || []);
    table.setColumnVisibility(config.visibility || {});
    
    if (config.columnOrder) {
      table.setColumnOrder(config.columnOrder);
    } else {
      // Fallback to default order if none exists
      table.resetColumnOrder();
    }
  } catch (e) {
    console.error("Failed to parse filter config", e);
  }
};
  return (
    <Box sx={{ display: "flex", 
  flexDirection: "column", 
  gap: 2, 
  p: 3, 
  width: "100%",      // Add this
  maxWidth: "100vw",  // Add this
  boxSizing: "border-box" }}>
      {/* Top Controls with Conditional Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 'bold', textTransform: 'capitalize'}}>{pageName} Management</Typography>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<Delete />} 
            disabled={isSelectionEmpty}
            onClick={handleDelete}
          >
            Delete
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<EditIcon />} 
            disabled={selectedRows.length !== 1} // Only enable edit if exactly ONE is selected
          >
            Bulk Edit
          </Button>
        </Stack>
        
        <Button variant="outlined" startIcon={<FilterList />} onClick={() => setSidebarOpen(true)}>
          Layout & Views
        </Button>
      </Box>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <PaginationControls />
        <TableContainer sx={{ maxHeight: 600, overflowX: 600, whiteSpace: "nowrap" }}>
          <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
            <TableHead>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={headerGroup.id}>
                  <TableRow>
                    {headerGroup.headers.map(header => (
                      <TableCell 
                        key={header.id} 
                        onClick={header.column.id !== 'select' ? header.column.getToggleSortingHandler() : undefined}
                        sx={{ bgcolor: "#f1f5f9", fontWeight: 'bold', cursor: header.column.id !== 'select' ? 'pointer' : 'default', top: 0, // Sticks to the very top
                  left: 0,
                  zIndex: 3, }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.id !== 'select' && (
                            header.column.getIsSorted() === "asc" ? <ArrowUpward fontSize="inherit"/> : 
                            header.column.getIsSorted() === "desc" ? <ArrowDownward fontSize="inherit"/> : 
                            <Sort fontSize="inherit" sx={{ opacity: 0.3 }}/>
                          )}
                        </Stack>
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Search Row */}
                  <TableRow>
                    {headerGroup.headers.map((header, index) => {
                      const isDate = checkIsDateColumn(header.id);
                      const isSelect = header.id === "select";

                      return (
                        <TableCell key={header.id} sx={{ bgcolor: "#f8fafc", py: 1, top:40, zIndex: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {index === 0 && (
                              <IconButton color="primary" onClick={handleGlobalSearch} size="small" sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                                <Search fontSize="small" />
                              </IconButton>
                            )}
                            {!isSelect && (
                           <TextField
  fullWidth
  size="small"
  type={isDate ? "date" : "text"}
  value={filterInputs[header.id] || ""}
  onChange={(e) => setFilterInputs(p => ({ ...p, [header.id]: e.target.value }))}
  // Corrected slotProps syntax:
  slotProps={{
    inputLabel: {
      shrink: isDate ? true : undefined,
    },
  }}
  sx={{ 
    bgcolor: 'white', 
    '& .MuiInputBase-input': { fontSize: '0.75rem' } 
  }}
/>
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
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id} selected={row.getIsSelected()} hover>
                  {row.getVisibleCells().map(cell => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === cell.column.id;
                    const isDateCol = checkIsDateColumn(cell.column.id);
                    const isSelectCol = cell.column.id === "select";

                    return (
                      <TableCell key={cell.id} sx={{ position: 'relative', minWidth: isSelectCol ? 50 : 120,
maxWidth: 260,
overflow: "hidden",
textOverflow: "ellipsis",
whiteSpace: "nowrap", '&:hover .edit-btn': { opacity: 1 } }}>
                        {isEditing ? (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <TextField
                              autoFocus
                              size="small"
                              type={isDateCol ? "date" : "text"}
                              variant="standard"
                              value={tempEditValue}
                             
                                slotProps={{
    inputLabel: {
      shrink: isDateCol ? true : undefined,
    },
  }}
                              onChange={(e) => setTempEditValue(e.target.value)}
                            />
                            <IconButton size="small" color="success" onClick={() => handleSaveEdit(row.id, cell.column.id)}>
                              <Check fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
<Typography variant="body2" component="div">
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </Typography>                            {!isSelectCol && (
                              <IconButton 
                                className="edit-btn"
                                size="small" 
                                sx={{ opacity: 0, transition: '0.2s' }}
                                onClick={() => {
                                  setEditingCell({ rowId: row.id, colId: cell.column.id });
                                  const val = cell.getValue();
                                  setTempEditValue(isDateCol && val ? new Date(val as string).toISOString().split('T')[0] : String(val ?? ""));
                                }}
                              >
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Box>
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
    </Box>
  );
}