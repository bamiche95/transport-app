"use client";

import { useState, useEffect } from "react";
import {
    Box, Card, CardContent, Typography, Grid, MenuItem, Select, FormControl,
    InputLabel, Checkbox, ListItemText, Button, TextField, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
    Drawer, List, ListItem, ListItemButton, Divider, Dialog, DialogTitle,
    DialogContent, DialogActions, Tooltip, FormControlLabel, Switch
} from "@mui/material";
import {
    Download, FileText, Play, Plus, Trash2, Filter, Settings, FileSpreadsheet,
    Save, Bookmark, ChevronRight, X
} from "lucide-react";
import { REPORT_SCHEMA, ReportEntity } from "@/lib/reports/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FilterRow = {
    id: string;
    fieldId: string;
    operator: string;
    value: string;
};

type SavedReport = {
    id: number;
    report_name: string;
    entity: string;
    config_json: {
        fields: string[];
        filters: Omit<FilterRow, 'id'>[];
    };
    created_at: string;
};

export default function ReportsPage() {
    const [entity, setEntity] = useState<string>("jobs");
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [filters, setFilters] = useState<FilterRow[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatedSql, setGeneratedSql] = useState<string>("");

    // Saved Reports State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [newReportName, setNewReportName] = useState("");
    const [activeReportId, setActiveReportId] = useState<number | null>(null);

    const currentSchema = REPORT_SCHEMA[entity];

// Add these to your state declarations
const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
const [scheduleForm, setScheduleForm] = useState({
  recipient_emails: "",
  frequency: "daily",
  scheduled_time: "17:00",
  is_active: true
});



const [loadingSchedule, setLoadingSchedule] = useState(false);
const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
// Add this useEffect to fetch data when the dialog opens
useEffect(() => {
    if (scheduleDialogOpen && activeReportId) {
        fetchCurrentSchedule();
    }
}, [scheduleDialogOpen, activeReportId]);

async function fetchCurrentSchedule() {
    setLoadingSchedule(true);
    try {
        const res = await fetch(`/api/reports/saved/${activeReportId}/schedule`);
        if (res.ok) {
            const data = await res.json();
            setExistingSchedules(data); // Store the list
            // If list is empty, reset form. Otherwise, don't auto-fill yet.
            if (data.length === 0) resetScheduleForm();
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingSchedule(false);
    }
}

const handleEditExisting = (sch: any) => {
    setScheduleForm({
        recipient_emails: sch.recipient_emails,
        frequency: sch.frequency,
        scheduled_time: sch.scheduled_time.substring(0, 5),
        is_active: sch.is_active === 1
    });
};

const resetScheduleForm = () => {
    setScheduleForm({
        recipient_emails: "",
        frequency: "daily",
        scheduled_time: "17:00",
        is_active: true
    });
};


const handleSaveSchedule = async () => {
  try {
    const res = await fetch(`/api/reports/saved/${activeReportId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scheduleForm),
    });

    if (res.ok) {
      alert("Schedule updated successfully!");
      setScheduleDialogOpen(false);
    }
  } catch (error) {
    alert("Failed to save schedule");
  }
};
    //Reports send

const handleManualSend = async (reportId: number) => {
    const email = prompt("Enter email address:");
    if (!email) return;
    
    const res = await fetch(`/api/reports/send-now`, {
        method: 'POST',
        body: JSON.stringify({ reportId, email })
    });
    if (res.ok) alert("Email sent!");
};

    // Load saved reports on mount
    useState(() => {
        fetchSavedReports();
    });

    async function fetchSavedReports() {
        try {
            const res = await fetch("/api/reports/saved");
            if (res.ok) {
                const json = await res.json();
                setSavedReports(json);
            }
        } catch (e) {
            console.error(e);
        }
    }


    const handleDeleteSchedule = async () => {
    if (!confirm("Are you sure you want to remove all automation for this report?")) return;
    
    try {
        const res = await fetch(`/api/reports/saved/${activeReportId}/schedule`, {
            method: "DELETE",
        });

        if (res.ok) {
            alert("Schedule removed.");
            setScheduleDialogOpen(false);
            resetScheduleForm();
        }
    } catch (error) {
        alert("Failed to delete schedule");
    }
};


    const handleSaveReport = async () => {
        if (!newReportName.trim()) return;

        try {
            const config = {
                fields: selectedFields,
                filters: filters.map(({ fieldId, operator, value }) => ({ fieldId, operator, value }))
            };

            const res = await fetch("/api/reports/saved", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    report_name: newReportName,
                    entity,
                    config_json: config
                })
            });

            if (res.ok) {
                setSaveDialogOpen(false);
                setNewReportName("");
                fetchSavedReports();
                alert("Report configuration saved!");
            } else {
                alert("Failed to save report.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadReport = (report: SavedReport) => {
        setEntity(report.entity);
        setSelectedFields(report.config_json.fields);
        setFilters(
            report.config_json.filters.map(f => ({ ...f, id: Math.random().toString(36).substr(2, 9) }))
        );
        setActiveReportId(report.id);
        setDrawerOpen(false);
    };

    const deleteReport = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this saved report?")) return;

        try {
            const res = await fetch(`/api/reports/saved/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchSavedReports();
                if (activeReportId === id) setActiveReportId(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Reset fields when entity changes
    const handleEntityChange = (newEntity: string) => {
        setEntity(newEntity);
        setSelectedFields([]);
        setFilters([]);
        setData([]);
    };

    const handleAddField = (fieldId: string) => {
        if (selectedFields.includes(fieldId)) {
            setSelectedFields(selectedFields.filter(f => f !== fieldId));
        } else {
            setSelectedFields([...selectedFields, fieldId]);
        }
    };

    const addFilter = () => {
        const firstField = currentSchema.fields[0].id;
        setFilters([
            ...filters,
            { id: Date.now().toString(), fieldId: firstField, operator: 'contains', value: '' }
        ]);
    };

    const updateFilter = (id: string, key: keyof FilterRow, val: string) => {
        setFilters(filters.map(f => f.id === id ? { ...f, [key]: val } : f));
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    const generateReport = async () => {
        if (selectedFields.length === 0) {
            alert("Please select at least one field.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/reports/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity,
                    fields: selectedFields,
                    filters: filters.map(({ fieldId, operator, value }) => ({ fieldId, operator, value }))
                })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error);

            setData(json.data);
            setGeneratedSql(json.sql); // For debug/transparency
        } catch (err: any) {
            console.error(err);
            alert("Failed to generate report: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (data.length === 0) return;

        // Get headers
        const headers = selectedFields.map(fid =>
            currentSchema.fields.find(f => f.id === fid)?.label || fid
        );

        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(header => {
                const val = row[header];
                return `"${String(val ?? '').replace(/"/g, '""')}"`; // Escape quotes
            }).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `report_${entity}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = () => {
        if (data.length === 0) return;

        const doc = new jsPDF();

        const headers = selectedFields.map(fid =>
            currentSchema.fields.find(f => f.id === fid)?.label || fid
        );

        const rows = data.map(row => headers.map(header => row[header] ?? ''));

        doc.text(`Report: ${currentSchema.label}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 30,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 163, 74] } // Green-600
        });

        doc.save(`report_${entity}.pdf`);
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 4, color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Report Generator
                <Button
                    variant="outlined"
                    startIcon={<Bookmark size={20} />}
                    onClick={() => setDrawerOpen(true)}
                    sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', color: '#475569' }}
                >
                    Saved Reports
                </Button>
            </Typography>

            <Grid container spacing={3}>
                {/* Configuration Panel */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Settings size={20} /> Configuration
                                </Typography>
                                <Tooltip title="Save current configuration">
                                    <IconButton size="small" onClick={() => setSaveDialogOpen(true)} color="primary">
                                        <Save size={18} /> Save 
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            {/* Entity Selection */}
                            <FormControl fullWidth sx={{ mb: 3 }} size="small">
                                <InputLabel>Primary Source</InputLabel>
                                <Select
                                    value={entity}
                                    label="Primary Source"
                                    onChange={(e) => handleEntityChange(e.target.value)}
                                >
                                    {Object.values(REPORT_SCHEMA).map((sch) => (
                                        <MenuItem key={sch.id} value={sch.id}>{sch.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Fields Selection */}
                            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5, color: '#64748b' }}>
                                Select Fields
                            </Typography>
                            <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3, border: '1px solid #f1f5f9', borderRadius: 1, p: 1 }}>
                                {currentSchema.fields.map((field) => (
                                    <div key={field.id} onClick={() => handleAddField(field.id)} className="cursor-pointer hover:bg-gray-50 p-1 rounded flex items-center">
                                        <Checkbox
                                            checked={selectedFields.includes(field.id)}
                                            size="small"
                                            sx={{ p: 0.5, mr: 1 }}
                                        />
                                        <Typography variant="body2">{field.label}</Typography>
                                    </div>
                                ))}
                            </Box>

                            {/* Filters */}
                            <Box sx={{ mb: 3 }}>
                                <div className="flex items-center justify-between mb-2">
                                    <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#64748b' }}>
                                        Filters
                                    </Typography>
                                    <Button startIcon={<Plus size={14} />} size="small" onClick={addFilter} sx={{ fontSize: '0.75rem' }}>
                                        Add Filter
                                    </Button>
                                </div>

                                {filters.map((filter, index) => (
                                    <Box key={filter.id} sx={{ mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                            <Select
                                                value={filter.fieldId}
                                                onChange={(e) => updateFilter(filter.id, 'fieldId', e.target.value)}
                                                sx={{ bgcolor: 'white' }}
                                            >
                                                {currentSchema.fields.map(f => (
                                                    <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <div className="flex gap-2">
                                            <FormControl size="small" sx={{ width: '120px' }}>
                                                <Select
                                                    value={filter.operator}
                                                    onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                                                    sx={{ bgcolor: 'white' }}
                                                >
                                                    <MenuItem value="equals">Equals</MenuItem>
                                                    <MenuItem value="contains">Contains</MenuItem>
                                                    <MenuItem value="gt">Greater Than</MenuItem>
                                                    <MenuItem value="lt">Less Than</MenuItem>
                                                    <MenuItem value="date_is">Date Is</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Value"
                                                value={filter.value}
                                                onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                                sx={{ bgcolor: 'white' }}
                                            />
                                            <IconButton size="small" color="error" onClick={() => removeFilter(filter.id)}>
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </div>
                                    </Box>
                                ))}
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                startIcon={<Play size={18} />}
                                onClick={generateReport}
                                disabled={loading}
                                sx={{
                                    bgcolor: '#16a34a',
                                    '&:hover': { bgcolor: '#15803d' },
                                    mt: 2
                                }}
                            >
                                {loading ? 'Generating...' : 'Generate Report'}
                            </Button>

                        </CardContent>
                    </Card>
                </Grid>

                {/* Results Panel */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="flex items-center justify-between mb-4">
                                <Typography variant="h6" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FileText size={20} /> Results
                                    {data.length > 0 && <Chip label={`${data.length} records`} size="small" sx={{ ml: 1, bgcolor: '#ecfccb', color: '#365314', fontWeight: 'bold' }} />}
                                </Typography>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outlined"
                                        startIcon={<FileSpreadsheet size={16} />}
                                        onClick={exportCSV}
                                        disabled={data.length === 0}
                                        size="small"
                                    >
                                        Export CSV
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<FileText size={16} />}
                                        onClick={exportPDF}
                                        disabled={data.length === 0}
                                        size="small"
                                    >
                                        Export PDF
                                    </Button>
                                </div>
                            </div>

                            {data.length === 0 ? (
                                <Box sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: 300,
                                    bgcolor: '#f8fafc',
                                    borderRadius: 2,
                                    border: '2px dashed #e2e8f0',
                                    flexDirection: 'column',
                                    py: 8
                                }}>
                                    <Filter size={48} className="text-gray-300 mb-2" />
                                    <Typography color="textSecondary">Configure settings and click Generate to see results</Typography>
                                </Box>
                            ) : (
                                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', maxHeight: 600 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                {selectedFields.map(fid => {
                                                    const label = currentSchema.fields.find(f => f.id === fid)?.label || fid;
                                                    return (
                                                        <TableCell key={fid} sx={{ bgcolor: '#f1f5f9', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                            {label}
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.map((row, idx) => (
                                                <TableRow key={idx} hover>
                                                    {selectedFields.map(fid => {
                                                        const label = currentSchema.fields.find(f => f.id === fid)?.label || fid;
                                                        return (
                                                            <TableCell key={fid} sx={{ whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {row[label]}
                                                            </TableCell>
                                                        )
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            {/* Saved Reports Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                slotProps={{ paper: { sx: { width: 1200 } } }}

            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Saved Reports</Typography>
                    <IconButton onClick={() => setDrawerOpen(false)}><X size={20} /></IconButton>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <List>
                    {savedReports.length === 0 ? (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
                            No saved reports found.
                        </Typography>
                    ) : (
                        savedReports.map((report) => (
                            <ListItem
                                key={report.id}
                                disablePadding
                                sx={{
                                    mb: 1,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    bgcolor: activeReportId === report.id ? '#f0fdf4' : 'transparent',
                                    borderColor: activeReportId === report.id ? '#16a34a' : '#e2e8f0'
                                }}
                            >
                                <ListItemButton onClick={() => loadReport(report)}>
                                    <ListItemText
                                        primary={report.report_name}
                                        secondary={`${report.entity} • ${new Date(report.created_at).toLocaleDateString()}`}
                                        slotProps={{ primary: { fontWeight: 600, fontSize: '0.9rem' }, secondary: { fontSize: '0.75rem' } }}
                                    />
                                    <IconButton size="small" onClick={(e) => deleteReport(report.id, e)} color="default" sx={{ opacity: 0.6, '&:hover': { opacity: 1, color: '#ef4444' } }}>
                                        <Trash2 size={16} />
                                    </IconButton>
                                </ListItemButton>
                                <Box sx={{ display: 'flex', gap: 1 }}>
    <Tooltip title="Send Now">
        <IconButton size="small" onClick={() => handleManualSend(report.id)}>
            <Play size={14} />
        </IconButton>
    </Tooltip>
<Tooltip title="Schedule Automation">
    <IconButton size="small" onClick={() => {
        setActiveReportId(report.id);
        setScheduleDialogOpen(true); // Changed from setScheduleOpen
    }}>
        <Settings size={14} />
    </IconButton>
</Tooltip>
</Box>
                            </ListItem>
                        ))
                    )}
                </List>
            </Drawer>

            {/* Save Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
                <DialogTitle>Save Report Configuration</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Give your report a name to easily access it later. This saves the selected entity, fields, and filters.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Report Name"
                        fullWidth
                        variant="outlined"
                        value={newReportName}
                        onChange={(e) => setNewReportName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveReport} variant="contained" color="primary">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Schedule Dialog */}
<Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="md" fullWidth>
    <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings size={20} /> Automation Management
        </Box>
        <IconButton onClick={() => setScheduleDialogOpen(false)}><X size={20} /></IconButton>
    </DialogTitle>

    <DialogContent sx={{ p: 0 }}>
        <Grid container sx={{ minHeight: 400 }}>
            {/* LEFT SIDE: List of existing schedules */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ borderRight: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" sx={{ p: 2, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                    Saved Schedules ({existingSchedules.length})
                </Typography>
                <List sx={{ p: 0 }}>
                    {existingSchedules.map((sch) => (
                        <ListItem 
                            key={sch.schedule_id} 
                            divider
                            secondaryAction={
                                <IconButton edge="end" size="small" onClick={() => handleEditExisting(sch)}>
                                    <ChevronRight size={18} />
                                </IconButton>
                            }
                            sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}
                        >
                            <ListItemText 
                                primary={sch.recipient_emails.split(',')[0] + (sch.recipient_emails.includes(',') ? '...' : '')}
                                secondary={`${sch.scheduled_time} • ${sch.is_active ? 'Active' : 'Paused'}`}
                                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                            />
                        </ListItem>
                    ))}
                    <ListItemButton onClick={resetScheduleForm} sx={{ color: '#2563eb' }}>
                        <Plus size={18} style={{ marginRight: 8 }} />
                        <Typography variant="body2" fontWeight="500">Add New Schedule</Typography>
                    </ListItemButton>
                </List>
            </Grid>

            {/* RIGHT SIDE: Editor Form */}
            <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    {scheduleForm.recipient_emails ? "Edit Schedule" : "New Schedule"}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Recipient Emails"
                            size="small"
                            placeholder="email1@example.com..."
                            value={scheduleForm.recipient_emails}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, recipient_emails: e.target.value })}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Frequency</InputLabel>
                            <Select
                                value={scheduleForm.frequency}
                                label="Frequency"
                                onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                            >
                                <MenuItem value="daily">Daily</MenuItem>
                                <MenuItem value="manual">Manual</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Send Time"
                            type="time"
                            value={scheduleForm.scheduled_time}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={scheduleForm.is_active}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, is_active: e.target.checked })}
                                />
                            }
                            label="Enable this schedule"
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    </DialogContent>

    <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
        <Button 
            color="error" 
            startIcon={<Trash2 size={16} />} 
            onClick={handleDeleteSchedule}
            sx={{ mr: 'auto' }}
        >
            Remove
        </Button>
        <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
        <Button 
            onClick={handleSaveSchedule} 
            variant="contained" 
            sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
        >
            Save Schedule
        </Button>
    </DialogActions>
</Dialog>
        </Box>
    );
}
