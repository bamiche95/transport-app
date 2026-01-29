"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Table } from "@tanstack/react-table";
import {
  Box, Drawer, List, TextField, Button, Typography, IconButton, Divider,
  Switch, FormControlLabel, Stack, Checkbox, ListItemButton, ListItemText, Paper, ListItem, Chip,
} from "@mui/material";
import { Add, Delete, Settings } from "@mui/icons-material";
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from "@mui/icons-material";

const RELATIVE_DATE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This Week", value: "this_week" },
  { label: "Last Week", value: "last_week" },
  { label: "Next Week", value: "next_week" },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Next 7 Days", value: "next_7_days" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
];


interface TableLayoutDrawerProps {
  open: boolean;
  onClose: () => void;
  table: Table<any>;
  savedFilters: any[];
  pageName: string;
  viewName: string;
  setViewName: React.Dispatch<React.SetStateAction<string>>;
  isDefault: boolean;
  setIsDefault: React.Dispatch<React.SetStateAction<boolean>>;
  applyFilter: (config: any) => void;
  deleteFilter: (id: number) => Promise<void>;
  saveView: () => Promise<void>;
  updateView: (id: number) => Promise<void>;
  // These props are still kept for logic, though renaming now uses viewName
  editingFilterId: number | null;
  setEditingFilterId: React.Dispatch<React.SetStateAction<number | null>>;
  handleRenameFilter: (id: number) => Promise<void>;
}

// --- Sub-component for Sortable Item ---
function SortableColumnItem({ column, index, isLast, table }: { column: any, index: number, isLast: boolean, table: Table<any> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#eff6ff' : 'transparent',
  };

  const selectedValue = table.getState().columnFilters.find((f: any) => f.id === column.id)?.value || "";

  // Check if column has meta options
  const hasOptions = column.columnDef?.meta?.options && column.columnDef.meta.options.length > 0;

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        py: 1.25, px: 2,
        borderBottom: !isLast ? '1px solid #f1f5f9' : 'none',
        '&:hover': { bgcolor: '#f8fafc' },
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      {/* Drag Handle */}
      <Box {...attributes} {...listeners} sx={{ display: 'flex', cursor: 'grab', mr: 1, color: '#cbd5e1' }}>
        <DragIndicator fontSize="small" />
      </Box>

      {/* Column Label */}
      <Typography sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize', color: '#1e293b' }}>
        {column.id.replace(/_/g, ' ')}
      </Typography>

      {/* Right-side Control */}
      <Stack direction="row" alignItems="center" spacing={1}>
        {column.columnDef?.meta?.drawerFilterType === "text" ? (
          <TextField
            size="small"
            placeholder="Search..."
            value={selectedValue}
            onChange={(e) => {
              const newFilters = table.getState().columnFilters.filter((f: any) => f.id !== column.id);
              if (e.target.value) newFilters.push({ id: column.id, value: e.target.value });
              table.setColumnFilters(newFilters);
            }}
            sx={{ width: 140, '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
          />
        ) : (hasOptions || column.columnDef?.meta?.inputType === "date") ? (
          <TextField
            select
            size="small"
            value={selectedValue}
            onChange={(e) => {
              const newFilters = table.getState().columnFilters.filter((f: any) => f.id !== column.id);
              if (e.target.value) newFilters.push({ id: column.id, value: e.target.value });
              table.setColumnFilters(newFilters);
            }}
            slotProps={{
              select: {
                native: true,
              },
            }}
            sx={{ width: 140 }}
          >
            <option value="">All</option>
            {column.columnDef?.meta?.inputType === "date" ? (
              RELATIVE_DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            ) : (
              column.columnDef.meta.options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            )}
          </TextField>
        ) : null}

        <Switch
          edge="end"
          size="small"
          checked={column.getIsVisible()}
          onChange={column.getToggleVisibilityHandler()}
        />
      </Stack>
    </ListItem>
  );
}

export default function TableLayoutDrawer({
  open,
  onClose,
  table,
  savedFilters,
  viewName,
  setViewName,
  isDefault,
  setIsDefault,
  applyFilter,
  deleteFilter,
  saveView,
  updateView,
  editingFilterId,
  setEditingFilterId,
  handleRenameFilter
}: TableLayoutDrawerProps) {
  const [selectedDrawerFilter, setSelectedDrawerFilter] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    table.getAllLeafColumns()
      .map(c => c.id)
      .filter(id => id !== "select" && id !== "actions")
  );




  const handleReset = () => {
    table.resetColumnFilters();
    table.resetColumnVisibility();
    setSelectedDrawerFilter(null);
    setIsCreatingNew(false);
    setViewName("");
  };

  const handleSelectFilter = (f: any) => {
    setIsCreatingNew(false);
    setEditingFilterId(null);
    setSelectedDrawerFilter(f);
    setViewName(f.filter_name);
    setIsDefault(f.is_default === 1);
    applyFilter(f.config_json);
  };

  const handleEditClick = (e: React.MouseEvent, f: any) => {
    e.stopPropagation();
    setIsCreatingNew(false);
    setSelectedDrawerFilter(f);
    setViewName(f.filter_name); // Shared input will now show this name
    setIsDefault(f.is_default === 1);
    // Logic: we don't necessarily "apply" the filter just to rename it, 
    // but usually, it helps the user see what they are renaming.
    applyFilter(f.config_json);
  };


  useEffect(() => {
    const ids = table.getAllLeafColumns()
      .map(c => c.id)
      .filter(id => id !== "select" && id !== "actions");

    setColumnOrder(prev =>
      JSON.stringify(prev) === JSON.stringify(ids) ? prev : ids
    );
  }, [table]);

  // 1. Set up DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 2. Filter out the "select" column for the UI list
  // 2. Ensure we get columns in the current state's order
  const displayColumns = useMemo(() => {
    const columnOrder = table.getState().columnOrder;
    const allLeafColumns = table.getAllLeafColumns();

    // 1. Create a master list of IDs based on current state
    // 2. If columnOrder is missing any columns (like when you first load), 
    //    append the missing ones from the leaf columns.
    const allIds = Array.from(new Set([...columnOrder, ...allLeafColumns.map(c => c.id)]));

    // 3. Map the IDs to actual column objects
    return allIds
      .map((columnId) => allLeafColumns.find((col) => col.id === columnId))
      .filter((col): col is any =>
        !!col &&
        col.id !== "select" &&
        col.id !== "actions" // exclude internal helper columns
      );
  }, [table.getState().columnOrder, table.getAllLeafColumns()]);

  // 3. Handle Drag End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // 1. Get the current order. If empty, initialize it from the current visible leaf columns
      let currentOrder = table.getState().columnOrder;
      if (currentOrder.length === 0) {
        currentOrder = table.getAllLeafColumns().map(c => c.id);
      }

      const oldIndex = currentOrder.indexOf(active.id as string);
      const newIndex = currentOrder.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
        table.setColumnOrder(newOrder);
      }
    }
  };


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 1200 } } }}
    >
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* LEFT SIDEBAR: Navigation */}
        <Box sx={{
          width: 300,
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8fafc'
        }}>
          {/* Header */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Settings sx={{ color: '#3b82f6', fontSize: '1.3rem' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Saved Views
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
              {savedFilters.length} view{savedFilters.length !== 1 ? 's' : ''} saved
            </Typography>
          </Box>

          {/* List */}
          <List sx={{

            overflow: 'auto',
            p: 1.5,
            gap: 0.75,
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '3px' }
          }}>
            {/* Create New Button */}
            <ListItemButton
              selected={isCreatingNew}
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedDrawerFilter(null);
                table.resetColumnVisibility();
                setViewName("");
                setIsDefault(false);
              }}
              sx={{
                borderRadius: 1.5,
                border: '2px dashed #3b82f6',
                bgcolor: isCreatingNew ? '#eff6ff' : 'transparent',
                color: '#3b82f6',
                mb: 1,
                '&:hover': { bgcolor: '#eff6ff' }
              }}
            >
              <Add sx={{ mr: 1.5, fontSize: '1.3rem' }} />
              <ListItemText
                primary="Create New View"
                slotProps={{ primary: { fontWeight: 600, fontSize: '0.9rem' } }}
              />
            </ListItemButton>
            <Divider sx={{ marginTop: 5 }} />
            <Box>
              <Typography sx={{ color: 'gray', fontFamily: 'poppins', fontWeight: 500 }}>Your saved filters</Typography>
              {savedFilters.length === 0 ? (
                <Typography variant="caption" sx={{ p: 2, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                  No saved views. Create one to get started.
                </Typography>
              ) : (
                savedFilters.map((f) => {
                  const isSelected = selectedDrawerFilter?.filter_id === f.filter_id;
                  return (
                    <ListItemButton
                      key={f.filter_id}
                      selected={isSelected}
                      onClick={() => handleSelectFilter(f)}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.5,
                        '&.Mui-selected': {
                          bgcolor: '#3b82f6',
                          color: 'white',
                          '&:hover': { bgcolor: '#2563eb' },
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {f.filter_name}
                            </Typography>
                            {f.is_default === 1 && (
                              <Chip
                                label="DEFAULT"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.6rem',
                                  bgcolor: isSelected ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                                  color: isSelected ? 'white' : '#64748b'
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleEditClick(e, f)}
                          sx={{ color: isSelected ? 'white' : '#64748b' }}
                        >
                          <ModeEditOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); deleteFilter(f.filter_id); }}
                          sx={{ color: isSelected ? 'white' : '#ef4444' }}
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>
                    </ListItemButton>
                  );
                })
              )}
            </Box>

          </List>

          {/* Footer */}
          <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              onClick={handleReset}
              sx={{ textTransform: 'none', fontWeight: 500, borderColor: '#cbd5e1', color: '#64748b' }}
            >
              Reset Table
            </Button>
          </Box>
        </Box>

        {/* RIGHT CONTENT: Configuration */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#ffffff' }}>
          {!selectedDrawerFilter && !isCreatingNew ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
              <Settings sx={{ fontSize: '3rem', color: '#cbd5e1' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Select a view to get started
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Choose a saved view or create a new one
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* Header Section */}
              <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#3b82f6', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                  {isCreatingNew ? "✨ CREATE NEW VIEW" : "⚙️ CONFIGURE VIEW"}
                </Typography>

                <Stack spacing={2.5} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block', mb: 0.8, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      View Name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={viewName}
                      onChange={(e) => setViewName(e.target.value)}
                      placeholder="e.g., Low Stock Items"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, bgcolor: 'white', fontSize: '0.9rem' } }}
                    />
                  </Box>

                  <Box sx={{ bgcolor: '#f1f5f9', p: 2, borderRadius: 1.5, border: '1px solid #cbd5e1' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                          sx={{ '&.Mui-checked': { color: '#3b82f6' } }}
                        />
                      }
                      label={
                        <Stack spacing={0.25}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                            Set as default
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Loads automatically when opening this table
                          </Typography>
                        </Stack>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => isCreatingNew ? saveView() : updateView(selectedDrawerFilter.filter_id)}
                    sx={{ textTransform: 'none', fontWeight: 600, py: 1.2, bgcolor: '#3b82f6' }}
                  >
                    {isCreatingNew ? "Save New View" : "Update Layout & Name"}
                  </Button>
                </Stack>
              </Box>

              {/* Columns Section */}
              <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1e293b' }}>
                  Rearrange & Toggle Columns
                </Typography>

                <Paper variant="outlined" sx={{ borderRadius: 1.5, flex: 1, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={displayColumns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <List dense sx={{ height: '100%', overflow: 'auto' }}>
                        {displayColumns.map((column, index) => (
                          <SortableColumnItem
                            key={column.id}
                            column={column}
                            index={index}
                            isLast={index === displayColumns.length - 1}
                            table={table}
                          />
                        ))}
                      </List>
                    </SortableContext>
                  </DndContext>
                </Paper>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}