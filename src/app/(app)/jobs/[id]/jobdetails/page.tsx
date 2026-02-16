"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Button,
    Stack,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    CardHeader,
    Divider,
    TextField,
    Tabs,
    Tab,
    MenuItem,
    Autocomplete,
    Chip,
    Paper
} from "@mui/material";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import Grid from '@mui/material/Grid';
import { IconButton, Tooltip, Snackbar } from "@mui/material";
import { AssociatedBinsTable, Bin } from "@/app/components/AssociatedBinsTable";
import ScheduleJob from "@/app/components/ScheduleJob";
interface JobMovement {
    job_bin_id: number;
    job_id: number;
    bin_id: number | null;
    movement_type: 'COLLECT' | 'DELIVER';
    bin_number: string | null;
    assigned_at: string;
}

interface JobDetail {
    job_id: number;
    customer_id: number;
    customer_name: string;
    customer_label: string;
    bin_type_id: number;
    bin_name: string;
    qty: number;
    company_id: number;
    company_name: string;
    job_status_id: number;
    job_status_name: string;
    job_date: string;
    jobs_notes: string;
    contact_name: string;
    phone_number: string;
    address: string;
    city: string;
    town: string;
    postcode: string;
    sic_code: string;
    booking_portal_id: string;
    priority: string;
    office_notes: string;
    lug_lock: number | boolean;
    adr: number | boolean;
    waste_type_id: number;
    waste_type_name: string;
    job_type_id: number;
    job_type_name: string;
    assigned_to: number | null;
    assigned_to_label: string | null;
    bins?: Bin[];

}

// Using any for the column helper to avoid complex TanStack type errors in this specific UI context
const columnHelper = createColumnHelper<any>();

export default function JobDetailPage() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();

    const [job, setJob] = useState<JobDetail | null>(null);
    const [movements, setMovements] = useState<JobMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [associatedBins, setAssociatedBins] = useState<Bin[]>([]);
    const [loadingBins, setLoadingBins] = useState(false);

    const [options, setOptions] = useState<{
        binTypes: any[];
        companies: any[];
        jobTypes: any[];
        wasteTypes: any[];
        customers: any[];
        users: any[];
        jobStatus: any[];

        priorities: any[];
    }>({
        binTypes: [],
        companies: [],
        jobTypes: [],
        wasteTypes: [],
        customers: [],
        users: [],
        jobStatus: [],
        priorities: [],

    });

    const [isSearchingCust, setIsSearchingCust] = useState(false);
    const [isSearchingUser, setIsSearchingUser] = useState(false);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/jobs/${id}`);
                if (!res.ok) throw new Error("Failed to fetch job details");
                const data = await res.json();

                setJob(data.jobData);
                setMovements(data.movements || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load job");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchJobData();
    }, [id]);

    useEffect(() => {
        const fetchBins = async () => {
            if (!job?.customer_id) {
                setAssociatedBins([]);
                return;
            }

            setLoadingBins(true);
            try {
                const res = await fetch(`/api/jobs/related-bins?customer_id=${job.customer_id}`);
                if (res.ok) {
                    const data = await res.json();
                    setAssociatedBins(data);
                }
            } catch (err) {
                console.error("Failed to load bins", err);
            } finally {
                setLoadingBins(false);
            }
        };

        fetchBins();
    }, [job?.customer_id]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch("/api/jobs/form-data");
                if (res.ok) {
                    const data = await res.json();
                    setOptions(prev => ({ ...prev, ...data }));
                }
            } catch (err) {
                console.error("Failed to load options", err);
            }
        };
        fetchOptions();
    }, []);

    const handleSearch = async (field: 'customer' | 'user', query: string) => {
        if (query.length < 3) return;
        field === 'customer' ? setIsSearchingCust(true) : setIsSearchingUser(true);
        try {
            const res = await fetch(`/api/jobs/form-data?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setOptions(prev => ({
                    ...prev,
                    [field === 'customer' ? 'customers' : 'users']: field === 'customer' ? data.customers : data.users
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            field === 'customer' ? setIsSearchingCust(false) : setIsSearchingUser(false);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/jobs/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete job");
            }

            router.push("/jobs");
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdate = async (field: string, value: any, label?: string) => {
        try {
            const res = await fetch(`/api/jobs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: value })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update field");
            }

            // Update local state
            setJob(prev => {
                if (!prev) return null;
                const updated = { ...prev, [field]: value };

                // Use provided label or find it in options
                if (field === 'customer_id') {
                    const newLabel = label || options.customers.find(c => c.id === value)?.label;
                    updated.customer_label = newLabel || updated.customer_label;  // <-- ADD THIS
                    updated.customer_name = newLabel || updated.customer_name;    // optional, keep in sync
                } else if (field === 'job_type_id') {
                    updated.job_type_name = label || options.jobTypes.find(j => j.id === value)?.label || updated.job_type_name;
                } else if (field === 'bin_type_id') {
                    updated.bin_name = label || options.binTypes.find(b => b.id === value)?.label || updated.bin_name;
                } else if (field === 'waste_type_id') {
                    updated.waste_type_name = label || options.wasteTypes.find(w => w.id === value)?.label || updated.waste_type_name;
                } else if (field === 'assigned_to') {
                    const uLabel = label || options.users.find(us => us.id === value)?.label;
                    updated.assigned_to_label = uLabel || (value === null ? "Unassigned" : updated.assigned_to_label);
                } else if (field === 'job_status_id') {
                    updated.job_status_name = label || options.jobStatus.find(js => js.id === value)?.label || updated.job_status_name;
                }

                return updated;
            });

            setSuccessMessage("Update successful");
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    interface EditableFieldProps {
        label: string;
        value: any;
        field: keyof JobDetail;
        type?: 'text' | 'select' | 'autocomplete' | 'datetime' | 'number' | 'multiline' | 'toggle';
        optionsList?: any[];
        onSearch?: (query: string) => void;
        isSearching?: boolean;
        displayValue?: string;
        multiline?: boolean;
        rows?: number;
    }

    const EditableField: React.FC<EditableFieldProps> = ({
        label, value, field, type = 'text', optionsList = [], onSearch, isSearching, displayValue, multiline, rows
    }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [tempValue, setTempValue] = useState(value);
        const [updating, setUpdating] = useState(false);

        const handleSave = async (forceValue?: any, forceLabel?: string) => {
            setUpdating(true);
            const success = await handleUpdate(field, forceValue !== undefined ? forceValue : tempValue, forceLabel);
            setUpdating(false);
            if (success) setIsEditing(false);
        };

        const renderInput = () => {
            if (type === 'select') {
                return (
                    <TextField
                        select fullWidth size="small"
                        value={tempValue ?? ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            setTempValue(val);
                            handleSave(val);
                        }}
                    >
                        {optionsList.map((opt: any) => (
                            <MenuItem key={opt.id ?? opt.value} value={opt.id ?? opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </TextField>
                );
            }
            if (type === 'autocomplete') {
                return (
                    <Autocomplete
                        options={optionsList}
                        getOptionLabel={(option) => typeof option === 'string' ? option : (option.label || "")}
                        isOptionEqualToValue={(option, value) => (option?.id ?? option?.value) === (value?.id ?? value?.value)}
                        value={optionsList.find(o => o.id === tempValue) || null}
                        onChange={(e, val) => {
                            const newVal = val?.id || null;
                            const newLabel = val?.label || "";
                            setTempValue(newVal);
                            handleSave(newVal, newLabel);
                        }}
                        onInputChange={(e, val) => onSearch?.(val)}
                        loading={isSearching}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                slotProps={{
                                    input: {
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }
                                }}
                            />
                        )}
                    />
                );
            }
            if (type === 'datetime') {
                const dateVal = tempValue ? new Date(tempValue).toISOString().slice(0, 16) : "";
                return (
                    <TextField
                        type="datetime-local" fullWidth size="small"
                        value={dateVal}
                        onChange={(e) => setTempValue(e.target.value)}
                    />
                );
            }
            // Inside EditableField component -> renderInput function

            if (type === 'multiline') {
                return (
                    <TextField
                        fullWidth size="small" multiline={multiline ?? true} rows={rows ?? 3}
                        value={tempValue ?? ""}
                        onChange={(e) => setTempValue(e.target.value)}
                        // Add this to allow saving with Ctrl+Enter or similar
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleSave();
                            }
                        }}
                        autoFocus
                    />
                );
            }

            return (
                <TextField
                    fullWidth size="small"
                    type={type === 'number' ? 'number' : 'text'}
                    value={tempValue ?? ""}
                    onChange={(e) => setTempValue(type === 'number' ? Number(e.target.value) : e.target.value)}
                    // Trigger save when user presses Enter
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSave();
                        }
                    }}
                    autoFocus
                    onBlur={() => {
                        // Only save if the value actually changed to avoid redundant API calls
                        if (tempValue !== value) {
                            handleSave();
                        } else {
                            setIsEditing(false);
                        }
                    }}
                />
            );
        };

        if (type === 'toggle') {
            const handleToggle = () => handleUpdate(field, !value);
            return (
                <Chip
                    label={label}
                    color={value ? "success" : "default"}
                    variant={value ? "filled" : "outlined"}
                    onClick={handleToggle}
                    sx={{ cursor: 'pointer' }}
                />
            );
        }
        if (isEditing) {
            return (
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                        {renderInput()}
                        {updating ? (
                            <CircularProgress size={20} />
                        ) : (
                            <Stack direction="row">
                                {/* 1. Ensure mousedown is used to beat the blur event */}
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevents focus from leaving input before save
                                        handleSave();
                                    }}
                                >
                                    <CheckIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setIsEditing(false)}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        )}
                    </Stack>
                </Box>
            );
        }

        return (
            <Box
                onMouseEnter={(e) => {
                    const target = e.currentTarget.querySelector('.edit-btn') as HTMLElement;
                    if (target) target.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                    const target = e.currentTarget.querySelector('.edit-btn') as HTMLElement;
                    if (target) target.style.opacity = '0';
                }}
            >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                    <Typography variant="body1">
                        {displayValue || (type === 'datetime' && value ? new Date(value).toLocaleString() : value) || "—"}
                    </Typography>
                    <IconButton
                        size="small"
                        className="edit-btn"
                        sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                        onClick={() => {
                            setTempValue(value);
                            setIsEditing(true);
                        }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Box>
        );
    };

    const movementColumns = useMemo<ColumnDef<any>[]>(() => [
        columnHelper.accessor("job_bin_id", { header: "ID" }),
        columnHelper.accessor("bin_number", {
            header: "Bin Number",
            cell: (info) => (info.getValue() as string) || "—"
        }),
        columnHelper.accessor("job_type_name", {
            header: "Job Type",
            cell: (info) => (info.getValue() as string) || "—"
        }),
        columnHelper.accessor("created_at", {
            header: "Time",
            cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleString() : "—"
        }),
    ], []);

    if (loading) {
        return <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}><CircularProgress /></Box>;
    }

    if (!job) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">Job not found</Alert>
                <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/jobs")} sx={{ mt: 2 }}>Back to Jobs</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h4" fontWeight="bold">Job Details</Typography>
                    <Chip label={job.job_status_name || `Status ID: ${job.job_status_id}`} color="primary" variant="outlined" />
                </Stack>
                <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/jobs")} variant="outlined">
                    Back
                </Button>
                <Button startIcon={<DeleteIcon />} onClick={() => handleDelete()} variant="outlined">
                    Delete
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Card>
                <CardHeader
                    title={`Job #${job.job_id}`}
                    subheader={job.customer_name}
                    sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0", marginRight: 2 }}
                    action={
                        <>
                            <Button
                                startIcon={<EditIcon />}
                                variant="contained"
                                onClick={() => router.push(`/jobs/${id}`)}
                                sx={{ marginRight: 2 }}
                            >
                                Edit Job
                            </Button>
                            <ScheduleJob job={job} />

                        </>
                    }
                />

                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="job tabs">
                        <Tab label="Details" />
                        <Tab label="Movements" />
                    </Tabs>
                </Box>

                <CardContent>
                    {/* DETAILS TAB */}
                    <div role="tabpanel" hidden={tabValue !== 0}>
                        <Grid container spacing={3}>
                            {/* Section: Core Info */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="h6" color="primary" gutterBottom>Job Information</Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField label="Job Notes" value={job.jobs_notes} field="jobs_notes" type="multiline" multiline rows={10} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Customer"
                                    value={job.customer_id}
                                    field="customer_id"
                                    type="autocomplete"
                                    optionsList={options.customers}
                                    onSearch={(q) => handleSearch('customer', q)}
                                    isSearching={isSearchingCust}
                                    displayValue={job.customer_label}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Job Type"
                                    value={job.job_type_id}
                                    field="job_type_id"
                                    type="select"
                                    optionsList={options.jobTypes}
                                    displayValue={job.job_type_name}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Date"
                                    value={job.job_date}
                                    field="job_date"
                                    type="datetime"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Bin Type"
                                    value={job.bin_type_id}
                                    field="bin_type_id"
                                    type="select"
                                    optionsList={options.binTypes}
                                    displayValue={job.bin_name}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Quantity"
                                    value={job.qty}
                                    field="qty"
                                    type="number"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Waste Type"
                                    value={job.waste_type_id}
                                    field="waste_type_id"
                                    type="select"
                                    optionsList={options.wasteTypes}
                                    displayValue={job.waste_type_name}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Job Status"
                                    value={job.job_status_id}
                                    field="job_status_id"
                                    type="select"
                                    optionsList={options.jobStatus}
                                    displayValue={job.job_status_name}
                                />
                            </Grid>

                            {/* Section: Contact & Location */}
                            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                                <Typography variant="h6" color="primary" gutterBottom>Contact & Location</Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <EditableField label="Contact Name" value={job.contact_name} field="contact_name" />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <EditableField label="Phone Number" value={job.phone_number} field="phone_number" />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <EditableField label="Address" value={job.address} field="address" />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <EditableField label="City" value={job.city} field="city" />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <EditableField label="Town" value={job.town} field="town" />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <EditableField label="Postcode" value={job.postcode} field="postcode" />
                            </Grid>

                            {/* Section: Additional Details */}
                            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                                <Typography variant="h6" color="primary" gutterBottom>Additional Details</Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Assigned To"
                                    value={job.assigned_to}
                                    field="assigned_to"
                                    type="autocomplete"
                                    optionsList={options.users}
                                    onSearch={(q) => handleSearch('user', q)}
                                    isSearching={isSearchingUser}
                                    displayValue={job.assigned_to_label || "Unassigned"}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField
                                    label="Priority"
                                    value={job.priority}
                                    field="priority"
                                    type="select"
                                    optionsList={options.priorities}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <EditableField label="SIC Code" value={job.sic_code} field="sic_code" />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                                    <EditableField label="Lug Lock" value={job.lug_lock} field="lug_lock" type="toggle" />
                                    <EditableField label="ADR" value={job.adr} field="adr" type="toggle" />
                                </Stack>
                            </Grid>



                            <Grid size={{ xs: 12 }}>
                                <EditableField label="Office Notes" value={job.office_notes} field="office_notes" type="multiline" />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <AssociatedBinsTable
                                    bins={associatedBins}
                                    loading={loadingBins}
                                />
                            </Grid>
                        </Grid>
                    </div>

                    {/* MOVEMENTS TAB */}
                    <div role="tabpanel" hidden={tabValue !== 1}>
                        <Box sx={{ py: 2 }}>
                            <ReusableDataTable
                                data={movements}
                                allAvailableColumns={movementColumns}
                                pageName="Job Movements"
                                idField="job_bin_id"
                            />
                        </Box>
                    </div>
                </CardContent>
            </Card>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage(null)}
                message={successMessage}
            />
        </Box>
    );
}
