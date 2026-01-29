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
    Chip
} from "@mui/material";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { CellEditPayload } from "@/app/types/CellEditPayload";
import Grid from '@mui/material/Grid';
import Barcode from 'react-barcode';
import PrintIcon from "@mui/icons-material/Print";


interface BinDetail {
    bin_id: number;
    bin_number: string;
    bin_description: string;
    bin_type_id: number;
    bin_name?: string; // from join
    customer_id: number;
    customer_name?: string; // from join
    company_id: number;
    company_name?: string; // from join
    bin_status_id: number;
    bin_status_label?: string; // from join
    bin_condition: string;
    comment: string;
    printed: number;
    created_at: string;
    modified_at: string;
    jobs?: any[];
    assigned_to: number | null;
    assigned_to_label?: string;
}

const columnHelper = createColumnHelper<any>();

export default function BinDetailPage() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();

    const [bin, setBin] = useState<BinDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editData, setEditData] = useState<Partial<BinDetail>>({});
    const [tabValue, setTabValue] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // Options for Dropdowns
    const [statusOptions, setStatusOptions] = useState<{ bin_status_id: number; label: string }[]>([]);
    const [binTypeOptions, setBinTypeOptions] = useState<{ bin_type_id: number; bin_name: string; label: string; id: number }[]>([]);
    const [companyOptions, setCompanyOptions] = useState<{ company_id: number; company_name: string; label: string; id: number }[]>([]);
    console.log('companyOptions', companyOptions)
    // We might want full customer list if editing customer, but it can be huge. 
    // For now, let's stick to displaying the name, or fetch strictly if needed.
    // Using a simple fetch for now if the list isn't massive.
    const [customerOptions, setCustomerOptions] = useState<{ customer_id: number; customer_name: string }[]>([]);

    const [activities, setActivities] = useState<any[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [userOptions, setUserOptions] = useState<{ id: number; label: string }[]>([]);
    const [isSearchingCust, setIsSearchingCust] = useState(false);
    const [isSearchingUser, setIsSearchingUser] = useState(false);


    const fetchActivities = async () => {
        setActivityLoading(true);
        try {
            const res = await fetch(`/api/bins/${id}/activity`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data);
            }
        } catch (err) {
            console.error("Failed to load activity", err);
        } finally {
            setActivityLoading(false);
        }
    };

    // Fetch activities when switching to the Updates tab (Tab 1)
    useEffect(() => {
        if (tabValue === 1 && id) {
            fetchActivities();
        }
    }, [tabValue, id]);


    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Fetch Options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [statusRes, typeRes, compRes, custRes] = await Promise.all([
                    fetch("/api/bin_status"),
                    fetch("/api/bintype"),
                    fetch("/api/company"),
                    fetch("/api/customers?limit=100") // Limiting for safety
                ]);

                if (statusRes.ok) setStatusOptions(await statusRes.json());
                if (typeRes.ok) setBinTypeOptions(await typeRes.json());
                if (compRes.ok) setCompanyOptions(await compRes.json());
                if (custRes.ok) {
                    const data = await custRes.json();
                    setCustomerOptions(Array.isArray(data) ? data : (data.results || []));
                }

            } catch (err) {
                console.error("Failed to load options", err);
            }
        };
        fetchOptions();
    }, []);

    // Fetch Bin Data
    useEffect(() => {
        const fetchBin = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/bins/${id}`);
                if (!res.ok) throw new Error("Failed to fetch bin details");
                const data = await res.json();

                setBin(data);
                setEditData(data); // Initialize edit form
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load bin");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBin();
    }, [id]);

    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(bin || {});
    };

    const handleInputChange = (field: keyof BinDetail, value: any) => {
        setEditData((prev) => ({ ...prev, [field]: value }));
    };


    const handleSearch = async (field: 'customer' | 'user', query: string) => {
        if (query.length < 3) return; // Only search after 3 characters

        field === 'customer' ? setIsSearchingCust(true) : setIsSearchingUser(true);

        try {
            const res = await fetch(`/api/bins/form-data?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                if (field === 'customer') {
                    // Mapping to match your existing state structure
                    setCustomerOptions(data.customers.map((c: any) => ({
                        customer_id: c.id,
                        customer_name: c.label
                    })));
                } else {
                    setUserOptions(data.users);
                }
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            field === 'customer' ? setIsSearchingCust(false) : setIsSearchingUser(false);
        }
    };

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch("/api/bins/form-data");
                if (res.ok) {
                    const data = await res.json();
                    setStatusOptions(data.statuses);
                    setBinTypeOptions(data.types);
                    setCompanyOptions(data.companies);
                    setCustomerOptions(data.customers); // Initial top 10
                    setUserOptions(data.users);        // Initial top 10
                }
            } catch (err) {
                console.error("Failed to load options", err);
            }
        };
        fetchOptions();
    }, []);

    const handleSave = async () => {
        setEditLoading(true);
        try {
            const res = await fetch(`/api/bins/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });

            if (!res.ok) throw new Error("Failed to update bin");

            const success = await res.json();
            if (success.error) throw new Error(success.error);

            // Refetch or update local state
            // Simple re-fetch to get updated joins (like bin_status_label)
            const freshRes = await fetch(`/api/bins/${id}`);
            const freshData = await freshRes.json();

            setBin(freshData);
            setEditData(freshData);
            setIsEditing(false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save changes");
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this bin?")) return;
        try {
            const res = await fetch(`/api/bins/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete bin");
            router.push("/bins");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete");
        }
    };

    // Columns for Jobs Tab
    const jobsColumns = useMemo<ColumnDef<any>[]>(() => [
        columnHelper.accessor("job_id", { header: "Job ID" }),
        columnHelper.accessor("job_status_name", {
            header: "Job Status",
            cell: (info) => {
                const val = info.getValue() as string;
                // Simple status chip or text
                return <Chip label={val || "Unknown"} size="small" variant="outlined" />;
            }
        }),
        // Assuming 'type' or similar column exists in jobs, or we map `job_type_id`
        // The previous plan mentioned "Job Type", but `jobs` schema shows `job_type_id`.
        // We didn't join `job_type` in the API, so we might just show ID or skip for now if not critical. 
        // Let's fallback to ID or omitted if we don't have the name.
        // columnHelper.accessor("job_type_id", { header: "Job Type" }), 

        columnHelper.accessor("address", { header: "Address" }),
        columnHelper.accessor("job_datetime", {
            header: "Date",
            cell: (info) => info.getValue() ? new Date(info.getValue() as string).toLocaleString() : "-"
        }),
        columnHelper.accessor("customer_name", { header: "Customer" }),
        columnHelper.accessor("company_name", { header: "Company" }),
    ], []);


    if (loading) {
        return <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}><CircularProgress /></Box>;
    }

    if (!bin) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">Bin not found</Alert>
                <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/bins")} sx={{ mt: 2 }}>Back to Bins</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h4" fontWeight="bold">Bin Details</Typography>
                    <Chip label={bin.bin_status_label || "Unknown"} color="primary" variant="outlined" />
                </Stack>
                <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/bins")} variant="outlined">
                    Back
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Card>
                <CardHeader
                    title={bin.bin_number}
                    subheader={`Bin ID: ${bin.bin_id}`}
                    sx={{ bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
                />

                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="bin tabs">
                        <Tab label="Details" />
                        <Tab label="Updates" />
                        <Tab label="Jobs" />
                    </Tabs>
                </Box>

                <CardContent>
                    {/* DETAILS TAB */}
                    <div role="tabpanel" hidden={tabValue !== 0}>
                        {tabValue === 0 && (
                            <Stack spacing={3}>
                                <Grid container spacing={3}>
                                    {/* Bin Number & Type */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Bin Number</Typography>
                                        {isEditing ? (
                                            <TextField
                                                fullWidth size="small"
                                                value={editData.bin_number || ""}
                                                onChange={(e) => handleInputChange("bin_number", e.target.value)}
                                                sx={{ mt: 1 }}
                                            />
                                        ) : (
                                            <Typography variant="body1" mt={0.5}>{bin.bin_number}</Typography>
                                        )}
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Bin Type</Typography>
                                        {isEditing ? (
                                            <TextField
                                                select fullWidth size="small"
                                                value={editData.bin_type_id ?? ""}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    handleInputChange("bin_type_id", isNaN(val) ? null : val);
                                                }}
                                                sx={{ mt: 1 }}
                                            >
                                                {binTypeOptions.map(opt => (
                                                    <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
                                                ))}
                                            </TextField>
                                        ) : (
                                            <Typography variant="body1" mt={0.5}>{bin.bin_name || "—"}</Typography>
                                        )}
                                    </Grid>

                                    {/* Description & Condition */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Description</Typography>
                                        {isEditing ? (
                                            <TextField
                                                fullWidth size="small"
                                                value={editData.bin_description || ""}
                                                onChange={(e) => handleInputChange("bin_description", e.target.value)}
                                                sx={{ mt: 1 }}
                                            />
                                        ) : (
                                            <Typography variant="body1" mt={0.5}>{bin.bin_description || "—"}</Typography>
                                        )}
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Condition</Typography>
                                        {isEditing ? (
                                            <TextField
                                                fullWidth size="small"
                                                value={editData.bin_condition || ""}
                                                onChange={(e) => handleInputChange("bin_condition", e.target.value)}
                                                sx={{ mt: 1 }}
                                            />
                                        ) : (
                                            <Typography variant="body1" mt={0.5}>{bin.bin_condition || "—"}</Typography>
                                        )}
                                    </Grid>

                                    {/* Status & Printed */}
<Grid size={{ xs: 12, sm: 6 }}>
    <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
    {isEditing ? (
        <TextField
            select
            fullWidth
            size="small"
            // Use an empty string if null to satisfy the Select component
            value={editData.bin_status_id ?? ""}
            onChange={(e) => {
                const val = e.target.value;
                handleInputChange("bin_status_id", val === "" ? null : Number(val));
            }}
            sx={{ mt: 1 }}
        >
            <MenuItem value=""><em>None</em></MenuItem>
            {statusOptions.map((opt: any) => (
                <MenuItem 
                    key={opt.id || opt.bin_status_id} 
                    value={opt.id !== undefined ? opt.id : opt.bin_status_id}
                >
                    {opt.label}
                </MenuItem>
            ))}
        </TextField>
    ) : (
        <Typography variant="body1" mt={0.5}>{bin.bin_status_label || "—"}</Typography>
    )}
</Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Label Printed</Typography>
                                        {isEditing ? (
                                            <TextField
                                                select fullWidth size="small"
                                                value={editData.printed ? 1 : 0}
                                                onChange={(e) => handleInputChange("printed", Number(e.target.value))}
                                                sx={{ mt: 1 }}
                                            >
                                                <MenuItem value={1}>Yes</MenuItem>
                                                <MenuItem value={0}>No</MenuItem>
                                            </TextField>
                                        ) : (
                                            <Typography variant="body1" mt={0.5}>{bin.printed ? "✅ Yes" : "❌ No"}</Typography>
                                        )}
                                    </Grid>

                                    {/* Customer & Company */}
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Customer</Typography>
                                        {isEditing ? (
                                            <Autocomplete
                                                options={customerOptions}
                                                getOptionLabel={(option) => option.customer_name || ""}
                                                isOptionEqualToValue={(option, value) => option.customer_id === value.customer_id}
                                                value={customerOptions.find(o => o.customer_id === editData.customer_id) || null}
                                                loading={isSearchingCust}
                                                onInputChange={(e, value) => handleSearch('customer', value)}
                                                onChange={(e, newValue) => handleInputChange("customer_id", newValue?.customer_id || null)}
                                                renderOption={(props, option) => {
                                                    // 1. Destructure 'key' from props specifically
                                                    const { key, ...otherProps } = props;

                                                    return (
                                                        // 2. Pass that 'key' directly to the <li>
                                                        <li key={option.customer_id} {...otherProps}>
                                                            {option.customer_name}
                                                        </li>
                                                    );
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        size="small"
                                                        placeholder="Search Customer..."
                                                        sx={{ mt: 1 }}
                                                        slotProps={{
                                                            input: {
                                                                ...params.InputProps,
                                                                endAdornment: (
                                                                    <React.Fragment>
                                                                        {isSearchingCust ? <CircularProgress color="inherit" size={20} /> : null}
                                                                        {params.InputProps.endAdornment}
                                                                    </React.Fragment>
                                                                ),
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <Typography variant="body1" mt={0.5}>{bin.customer_name || "—"}</Typography>
                                        )}
                                    </Grid>
                                  <Grid size={{ xs: 12, sm: 6 }}>
    <Typography variant="caption" color="text.secondary" fontWeight={600}>Company</Typography>
    {isEditing ? (
        <TextField
            select
            fullWidth
            size="small"
            // Keep as Number to match the option value type
            value={editData.company_id ?? ""} 
            onChange={(e) => {
                const val = e.target.value;
                handleInputChange("company_id", val === "" ? null : Number(val));
            }}
            sx={{ mt: 1 }}
        >
            <MenuItem value=""><em>None</em></MenuItem>
            {companyOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                    {opt.label}
                </MenuItem>
            ))}
        </TextField>
    ) : (
        <Typography variant="body1" mt={0.5}>{bin.company_name || "—"}</Typography>
    )}
</Grid>

                                    {/* Comment (Full Width) */}
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Comment</Typography>
                                        {isEditing ? (
                                            <TextField
                                                fullWidth size="small" multiline rows={3}
                                                value={editData.comment || ""}
                                                onChange={(e) => handleInputChange("comment", e.target.value)}
                                                sx={{ mt: 1 }}
                                            />
                                        ) : (
                                            <Typography variant="body1" mt={0.5}>{bin.comment || "—"}</Typography>
                                        )}
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>Assigned To</Typography>
                                        {isEditing ? (
                                            <Autocomplete
                                                options={userOptions}
                                                getOptionLabel={(option) => typeof option === 'string' ? option : (option.label || "")}
                                                isOptionEqualToValue={(option, value) =>
                                                    typeof option === 'object' && typeof value === 'object' && option.id === value.id
                                                }
                                                // Matches based on the label string since assigned_to is a string in your interface
                                                // Matches based on ID now
                                                value={
                                                    userOptions.find(o => o.id === editData.assigned_to) ||
                                                    (editData.assigned_to === bin?.assigned_to && bin?.assigned_to_label
                                                        ? { id: editData.assigned_to!, label: bin.assigned_to_label }
                                                        : null)
                                                }
                                                loading={isSearchingUser}
                                                freeSolo // Allows manual entry if name isn't in DB
                                                onInputChange={(e, value) => handleSearch('user', value)}
                                                onChange={(e, newValue) => {
                                                    // Send the numeric ID to the state/database
                                                    if (typeof newValue === 'string') {
                                                        handleInputChange("assigned_to", null);
                                                    } else {
                                                        handleInputChange("assigned_to", newValue?.id || null);
                                                    }
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        size="small"
                                                        placeholder="Search Staff..."
                                                        sx={{ mt: 1 }}
                                                        slotProps={{
                                                            input: {
                                                                ...params.InputProps,
                                                                endAdornment: (
                                                                    <React.Fragment>
                                                                        {isSearchingUser ? <CircularProgress color="inherit" size={20} /> : null}
                                                                        {params.InputProps.endAdornment}
                                                                    </React.Fragment>
                                                                ),
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <Typography variant="body1" mt={0.5}>
                                                {bin.assigned_to_label ? bin.assigned_to_label : "Not Assigned"}
                                            </Typography>
                                        )}
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Box sx={{
                                            mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2,
                                            textAlign: 'center', bgcolor: '#fafafa', justifyContent: 'center', alignItems: 'center',
                                            "@media print": { border: "none", bgcolor: "transparent", p: 0, mt: 0 }
                                        }}>
                                            <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ "@media print": { display: "none" } }}>
                                                4" x 4" LABEL PREVIEW
                                            </Typography>

                                            {/* Print Section */}
                                            <Box id="barcode-section" sx={{
                                                display: 'flex',
                                                p: 4,
                                                bgcolor: 'white',
                                                width: '4in', // Matches physical label
                                                height: '4in', // Matches physical label
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}>
                                                <Typography sx={{ fontSize: '16pt', fontWeight: 'bold', color: 'black', mb: 0, lineHeight: 1 }}>
                                                    Recycling Management Ltd
                                                </Typography>
                                                <Typography sx={{ fontSize: '18pt', color: 'black', mb: 2 }}>
                                                    0121 328 5000
                                                </Typography>

                                                <Barcode
                                                    value={bin.bin_number}
                                                    width={3}      // Increased for 4" width
                                                    height={120}   // Increased for 4" height
                                                    fontSize={35}  // Larger text under barcode

                                                    margin={0}
                                                    background="#ffffff"
                                                />

                                                <Typography sx={{ fontSize: '22pt', fontWeight: 'bold', color: 'black', mt: 2, textAlign: 'center' }}>
                                                    {bin.bin_description}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={2} justifyContent="center" mt={2} sx={{ "@media print": { display: "none" } }}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => window.print()}
                                                    startIcon={<PrintIcon />}
                                                >
                                                    Print Label
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Divider />

                                <Stack direction="row" spacing={2} justifyContent="flex-end">
                                    {isEditing ? (
                                        <>
                                            <Button onClick={handleCancel} disabled={editLoading}>Cancel</Button>
                                            <Button
                                                variant="contained" color="success"
                                                onClick={handleSave} disabled={editLoading}
                                                startIcon={editLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                                            >
                                                Save Changes
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>Delete</Button>
                                            <Button variant="contained" onClick={handleEdit}>Edit</Button>
                                        </>
                                    )}
                                </Stack>
                            </Stack>
                        )}
                    </div>

                    {/* UPDATES TAB */}
                    <div role="tabpanel" hidden={tabValue !== 1}>


                        {tabValue === 1 && (
                            <Box sx={{ py: 3, maxWidth: 800, mx: "auto" }}>
                                {activityLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <CircularProgress size={32} />
                                    </Box>
                                ) : activities.length === 0 ? (
                                    <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                        No history or movement records found for this bin.
                                    </Typography>
                                ) : (
                                    <Stack spacing={3}>
                                        {activities.map((item) => {
                                            const isMovement = item.record_type === 'MOVEMENT';

                                            // Helper to get the correct text label for the chips
                                            const getDisplayLabel = (type: 'old' | 'new') => {
                                                if (isMovement) {
                                                    return type === 'old' ? item.old_label : item.new_label;
                                                }

                                                const val = type === 'old' ? item.old_value : item.new_value;

                                                switch (item.field_name) {
                                                    case 'customer_id':
                                                        return (type === 'old' ? item.old_label : item.new_label) || "None";
                                                    case 'bin_status_id':
                                                        return (type === 'old' ? item.old_status : item.new_status) || "Unknown";
                                                    case 'company_id':
                                                        // Logic for the newly added company mapping
                                                        return (type === 'old' ? item.old_company : item.new_company) || "None";
                                                    case 'printed':
                                                        return val == "1" ? "Yes" : "No";
                                                    default:
                                                        return val || "—";
                                                }
                                            };
                                            return (
                                                <Box key={`${item.record_type}-${item.id}`} sx={{ display: 'flex', gap: 2 }}>
                                                    {/* Timeline Visuals */}
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <Box
                                                            sx={{
                                                                width: 36, height: 36, borderRadius: '50%',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                bgcolor: isMovement ? 'success.main' : 'primary.main',
                                                                boxShadow: 1, color: 'white'
                                                            }}
                                                        >
                                                            {isMovement ? '🚚' : '📝'}
                                                        </Box>
                                                        <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', mt: 1 }} />
                                                    </Box>

                                                    {/* Activity Card */}
                                                    <Card variant="outlined" sx={{ flexGrow: 1, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                                                <Box>
                                                                    <Typography variant="subtitle2" fontWeight="bold" color={isMovement ? "success.dark" : "primary.dark"}>
                                                                        {isMovement ? "BIN MOVEMENT" : `EDITED: ${item.field_name?.replace(/_/g, " ").toUpperCase()}`}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {new Date(item.event_date).toLocaleString()}
                                                                    </Typography>
                                                                </Box>
                                                                <Chip
                                                                    label={isMovement ? "Movement" : "Edit"}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color={isMovement ? "success" : "default"}
                                                                />
                                                            </Stack>

                                                            {/* Value Transition */}
                                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1 }}>
                                                                <Box sx={{ textAlign: 'center', flex: 1 }}>
                                                                    <Typography variant="caption" color="text.secondary" display="block">FROM</Typography>
                                                                    <Typography variant="body2" fontWeight="medium">{getDisplayLabel('old') || "Unassigned"}</Typography>
                                                                </Box>

                                                                <Typography variant="h6" color="text.disabled">→</Typography>

                                                                <Box sx={{ textAlign: 'center', flex: 1 }}>
                                                                    <Typography variant="caption" color="text.secondary" display="block">TO</Typography>
                                                                    <Typography variant="body2" fontWeight="bold" color="primary">{getDisplayLabel('new') || "Unassigned"}</Typography>
                                                                </Box>
                                                            </Stack>

                                                            {/* Meta Data (Job Notes / User) */}
                                                            <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                                                                {isMovement && (
                                                                    <Typography variant="body2" color="text.primary" sx={{ bgcolor: '#fff9c4', p: 1, borderRadius: 1, borderLeft: '3px solid #fbc02d' }}>
                                                                        <strong>Job #{item.job_id}:</strong> {item.job_notes || "No job notes provided."}
                                                                    </Typography>
                                                                )}
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Performed by: <strong>{item.user_name || "System"}</strong>
                                                                </Typography>
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Box>
                        )}
                    </div>

                    {/* JOBS TAB */}
                    <div role="tabpanel" hidden={tabValue !== 2}>
                        {tabValue === 2 && (
                            <Box sx={{ py: 2 }}>
                                <ReusableDataTable
                                    data={bin.jobs || []}
                                    allAvailableColumns={jobsColumns}
                                    pageName="Bin Related Jobs"
                                    idField="job_id"
                                />
                            </Box>
                        )}
                    </div>

                </CardContent>
            </Card>
        </Box>
    );
}
