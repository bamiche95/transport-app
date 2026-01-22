"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Typography,
    Button,
    Stack,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    TextField,
    MenuItem,
    Autocomplete,
    FormControlLabel,
    Checkbox,
    Grid,
    Paper,
    Divider
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
interface JobForm {
    job_notes: string;
    customer_id: number | null;
    bin_type_id: number | null;
    qty: number;
    company_id: number | null;
    company_notes: string;
    job_date: string; // YYYY-MM-DDTHH:mm
    contact_name: string;
    job_type_id: number | null;
    sic_code: string;
    status: string;
    assigned_to: number | null;
    priority: string;
    address: string;
    postcode: string;
    city: string;
    office_notes: string;
    phone_number: string;
    lug_lock: boolean;
    adr: boolean;
    booking_portal_id: string; // Stored as string, number input
    waste_type_id: number | null;
}

const INITIAL_FORM: JobForm = {
    job_notes: "",
    customer_id: null,
    bin_type_id: null,
    qty: 1,
    company_id: null,
    company_notes: "",
    job_date: new Date().toISOString().slice(0, 16), // Current time for datetime-local
    contact_name: "",
    job_type_id: null,
    sic_code: "",
    status: "Open", // Default
    assigned_to: null,
    priority: "Medium",
    address: "",
    postcode: "",
    city: "",
    office_notes: "",
    phone_number: "",
    lug_lock: false,
    adr: false,
    booking_portal_id: "",
    waste_type_id: null
};

export default function NewJobPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<JobForm>(INITIAL_FORM);
    const [loading, setLoading] = useState(false); // Submitting
    const [pageLoading, setPageLoading] = useState(true); // Initial Load
    const [error, setError] = useState<string | null>(null);
    // Inside your NewJobPage component
    const [selectedTableBinId, setSelectedTableBinId] = useState<number | null>(null);
    // Dropdown Options
    const [options, setOptions] = useState({
        binTypes: [] as any[],
        companies: [] as any[],
        jobTypes: [] as any[],
        wasteTypes: [] as any[],
        customers: [] as any[], // Initial list
        users: [] as any[]      // Initial list
    });

    const [isSearchingCust, setIsSearchingCust] = useState(false);
    const [isSearchingUser, setIsSearchingUser] = useState(false);


    const [associatedBins, setAssociatedBins] = useState<any[]>([]);
    const [loadingBins, setLoadingBins] = useState(false);

    // Fetch bins when customer changes
    useEffect(() => {
        const fetchBins = async () => {
            if (!formData.customer_id) {
                setAssociatedBins([]);
                return;
            }

            setLoadingBins(true);
            try {
                // Assuming you create an endpoint to fetch bins by customer
                const res = await fetch(`/api/jobs/related-bins?customer_id=${formData.customer_id}`);
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
    }, [formData.customer_id]);


    // Load initial data
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch("/api/jobs/form-data");
                if (res.ok) {
                    const data = await res.json();
                    setOptions({
                        binTypes: data.binTypes || [],
                        companies: data.companies || [],
                        jobTypes: data.jobTypes || [],
                        wasteTypes: data.wasteTypes || [],
                        customers: data.customers || [],
                        users: data.users || []
                    });
                }
            } catch (err) {
                console.error("Failed to load options", err);
                setError("Failed to load form options. Please refresh.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchOptions();
    }, []);

    // Search Logic
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

const handleInputChange = (field: keyof JobForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If the user manually changes the Bin Type via Autocomplete, 
    // reset the specific table selection highlight.
    if (field === "bin_type_id" && selectedTableBinId !== null) {
        // We only reset if the new value doesn't match the type of the selected bin
        const currentlySelectedBin = associatedBins.find(b => b.bin_id === selectedTableBinId);
        if (!currentlySelectedBin || currentlySelectedBin.bin_type_id !== value) {
            setSelectedTableBinId(null);
        }
    }
};

    const handleSubmit = async () => {
        if (!formData.customer_id || !formData.bin_type_id || !formData.company_id || !formData.job_type_id) {
            setError("Please fill in all required fields (Customer, Bin Type, Company, Job Type).");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create job");

            // Success! Redirect.
            router.push(`/jobs`); // Or /jobs/${data.jobId} if we want to go nicely to detailed view
        } catch (err: any) {
            setError(err.message);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={4}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Back</Button>
                <Typography variant="h4" fontWeight="bold">Create New Job</Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={4}>
                {/* LEFT COLUMN: Main Job Details */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">Job Details</Typography>
                            <Grid container spacing={2}>
                                {/* Job Notes */}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth label="Job Notes" variant="outlined"
                                        value={formData.job_notes}
                                        onChange={(e) => handleInputChange("job_notes", e.target.value)}
                                        multiline rows={2}
                                    />
                                </Grid>

                                {/* Customer Search */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Autocomplete
                                        options={options.customers}
                                        getOptionLabel={(option) => option.label || ""}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        loading={isSearchingCust}
                                        onInputChange={(e, val) => handleSearch('customer', val)}
                                        onChange={(e, val) => handleInputChange("customer_id", val?.id || null)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Customer *"
                                                fullWidth
                                                required
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
                                </Grid>

                                {/* Bin Type Search */}
                        {/* Bin Type Search */}
<Grid size={{ xs: 12, sm: 6 }}>
    <Autocomplete
        options={options.binTypes}
        // This line ensures the Autocomplete updates when the table button is clicked
        value={options.binTypes.find((opt) => opt.id === formData.bin_type_id) || null}
        getOptionLabel={(option) => option.label || ""}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(e, val) => handleInputChange("bin_type_id", val?.id || null)}
        renderInput={(params) => (
            <TextField 
                {...params} 
                label="Bin Type *" 
                required 
                fullWidth 
                helperText={formData.bin_type_id ? "Selected from list or table" : ""}
            />
        )}
    />
</Grid>

                                {/* Quantity */}
                                <Grid size={{ xs: 6, sm: 4 }}>
                                    <TextField
                                        label="Quantity" type="number" fullWidth
                                        value={formData.qty}
                                        onChange={(e) => handleInputChange("qty", Number(e.target.value))}
                                    />
                                </Grid>

                                {/* Company Select */}
                                <Grid size={{ xs: 6, sm: 8 }}>
                                    <TextField
                                        select label="Company *" fullWidth required
                                        value={formData.company_id ?? ""}
                                        onChange={(e) => handleInputChange("company_id", Number(e.target.value))}
                                    >
                                        {options.companies.map((opt: any) => (
                                            <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Company Notes */}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth label="Company Notes"
                                        value={formData.company_notes}
                                        onChange={(e) => handleInputChange("company_notes", e.target.value)}
                                    />
                                </Grid>

                                {/* Date */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        type="datetime-local" label="Job Date" fullWidth
                                        value={formData.job_date}
                                        onChange={(e) => handleInputChange("job_date", e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                </Grid>

                                {/* Contact Name */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth label="Contact Name"
                                        value={formData.contact_name}
                                        onChange={(e) => handleInputChange("contact_name", e.target.value)}
                                    />
                                </Grid>

                                {/* Job Type Select */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select label="Job Type *" fullWidth required
                                        value={formData.job_type_id ?? ""}
                                        onChange={(e) => handleInputChange("job_type_id", Number(e.target.value))}
                                    >
                                        {options.jobTypes.map((opt: any) => (
                                            <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Status Select */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select label="Status *" fullWidth required
                                        value={formData.status}
                                        onChange={(e) => handleInputChange("status", e.target.value)}
                                    >
                                        {['Open', 'In Progress', 'Complete', 'Idle', 'Cancel'].map((s) => (
                                            <MenuItem key={s} value={s}>{s}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom color="primary">Location & Details</Typography>
                            <Grid container spacing={2}>
                                {/* SIC Code */}
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth label="SIC Code"
                                        value={formData.sic_code}
                                        onChange={(e) => handleInputChange("sic_code", e.target.value)}
                                    />
                                </Grid>

                                {/* Assigned To Search */}
                                <Grid size={{ xs: 6 }}>
                                    <Autocomplete
                                        options={options.users}
                                        getOptionLabel={(option) => typeof option === 'string' ? option : (option.label || "")}
                                        freeSolo // As per schema "searchable text field" that references users but might be loose?
                                        // Schema usually implies ID if referencing table. Let's assume ID binding but allowing text search.
                                        // "Assigned_to(searchable text field referencing users table.)"
                                        // Actually the schema has `assigned_to` as INT in `jobs` but VARCHAR in user request description?
                                        // Wait, the schema provided earlier: `assigned_to int`.
                                        // So we should bind the ID.
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        loading={isSearchingUser}
                                        onInputChange={(e, val) => handleSearch('user', val)}
                                        onChange={(e, val) => handleInputChange("assigned_to", typeof val === 'string' ? null : val?.id || null)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Assigned To"
                                                fullWidth
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
                                </Grid>

                                {/* Priority */}
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        select label="Priority" fullWidth
                                        value={formData.priority}
                                        onChange={(e) => handleInputChange("priority", e.target.value)}
                                    >
                                        {['Low', 'Medium', 'High'].map((p) => (
                                            <MenuItem key={p} value={p}>{p}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Booking Portal ID */}
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        label="Booking Portal ID" type="number" fullWidth
                                        value={formData.booking_portal_id}
                                        onChange={(e) => handleInputChange("booking_portal_id", e.target.value)}
                                    />
                                </Grid>

                                {/* Address Fields */}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Address" fullWidth
                                        value={formData.address}
                                        onChange={(e) => handleInputChange("address", e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        label="City" fullWidth
                                        value={formData.city}
                                        onChange={(e) => handleInputChange("city", e.target.value)}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        label="Postcode" fullWidth
                                        value={formData.postcode}
                                        onChange={(e) => handleInputChange("postcode", e.target.value)}
                                    />
                                </Grid>

                                {/* Phone */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        label="Phone Number" fullWidth
                                        value={formData.phone_number}
                                        onChange={(e) => handleInputChange("phone_number", e.target.value)}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Office Notes" fullWidth multiline rows={2}
                                        value={formData.office_notes}
                                        onChange={(e) => handleInputChange("office_notes", e.target.value)}
                                    />
                                </Grid>

                                {/* Checkboxes */}
                                <Grid size={{ xs: 12 }}>
                                    <Stack direction="row" spacing={3}>
                                        <FormControlLabel
                                            control={<Checkbox checked={formData.lug_lock} onChange={(e) => handleInputChange("lug_lock", e.target.checked)} />}
                                            label="Lug Lock"
                                        />
                                        <FormControlLabel
                                            control={<Checkbox checked={formData.adr} onChange={(e) => handleInputChange("adr", e.target.checked)} />}
                                            label="ADR"
                                        />
                                    </Stack>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* NEW SECTION: Associated Bins Table */}
                    {formData.customer_id && (
                        <Grid size={{ xs: 12 }}>
                            <Card variant="outlined" sx={{ borderRadius: 2, mb: 4 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        Available Bins for Selected Customer
                                    </Typography>

                                    {loadingBins ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                            <CircularProgress size={24} />
                                        </Box>
                                    ) : associatedBins.length === 0 ? (
                                        <Alert severity="info">No specific bins found for this customer.</Alert>
                                    ) : (
                                        <Box sx={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
                                                        <th style={{ padding: '12px' }}>Bin Type</th>
                                                        <th style={{ padding: '12px' }}>Bin Description</th>
                                                        <th style={{ padding: '12px' }}>Bin Number</th>
                                                        <th style={{ padding: '12px' }}>Printed</th>
                                                        <th style={{ padding: '12px' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {associatedBins.map((bin) => (
                                                        <tr key={bin.bin_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                            <td style={{ padding: '12px' }}>{bin.bin_name}</td>
                                                            <td style={{ padding: '12px' }}>{bin.bin_description}</td>
                                                            <td style={{ padding: '12px' }}>{bin.bin_number}</td>
                                                            <td style={{ padding: '12px' }}>
                                                               {bin.printed ? (
    <CheckCircleIcon color="success" fontSize="small" /> 
) : (
    "No"
)}
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                               <Button
    size="small"
    // Check against the unique bin_id instead of the generic bin_type_id
    variant={selectedTableBinId === bin.bin_id ? "contained" : "outlined"}
    onClick={() => {
        // 1. Set the form value for the database
        handleInputChange("bin_type_id", bin.bin_type_id);
        
        // 2. Set the local state for the UI button highlight
        setSelectedTableBinId(bin.bin_id);
        
        window.scrollTo({ top: 100, behavior: 'smooth' });
    }}
>
    {selectedTableBinId === bin.bin_id ? "Selected" : "Select"}
</Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>

                {/* RIGHT COLUMN: Waste Type Visual Selector */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">Waste Type Selection</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                Please select the content type for this job.
                            </Typography>

                            <Grid container spacing={2}>
                                {options.wasteTypes.map((type: any) => {
                                    const isSelected = formData.waste_type_id === type.id;
                                    return (
                                        <Grid size={{ xs: 12, sm: 6, md: 12 }} key={type.id}>
                                            <Paper
                                                variant={isSelected ? "elevation" : "outlined"}
                                                elevation={isSelected ? 4 : 0}
                                                onClick={() => handleInputChange("waste_type_id", type.id)}
                                                sx={{
                                                    p: 2,
                                                    cursor: 'pointer',
                                                    borderRadius: 2,
                                                    transition: 'all 0.2s',
                                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                                    bgcolor: isSelected ? 'primary.light' : 'background.paper',
                                                    color: isSelected ? 'primary.contrastText' : 'text.primary',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        bgcolor: isSelected ? 'primary.light' : 'action.hover'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography fontWeight="bold">{type.label}</Typography>
                                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                        {type.description}
                                                    </Typography>
                                                </Box>
                                                {isSelected && <CheckCircleIcon color="primary" />}
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Footer Actions */}
                <Grid size={{ xs: 12 }}>
                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                        <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            Create Job
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
