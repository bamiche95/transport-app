"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { AssociatedBinsTable } from "@/app/components/AssociatedBinsTable";
import { WasteTypeSelector } from "@/app/components/WasteTypeSelector";
import { ToastContainer, toast } from 'react-toastify';
interface JobForm {
    jobs_notes: string;
    customer_id: number | null;
    bin_type_id: number | null;
    qty: number;
    company_id: number | null;
    company_notes: string;
    job_date: string; // YYYY-MM-DDTHH:mm
    contact_name: string;
    job_type_id: number | null;
    sic_code: string;
    job_status_id: number | null;
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
    town: string;
    country: string;
}

const INITIAL_FORM: JobForm = {
    jobs_notes: "",
    customer_id: null,
    bin_type_id: null,
    qty: 1,
    company_id: null,
    company_notes: "",
    job_date: new Date().toISOString().slice(0, 16), // Current time for datetime-local
    contact_name: "",
    job_type_id: null,
    sic_code: "",
    job_status_id: null, // Default
    assigned_to: null,
    priority: "5",
    address: "",
    postcode: "",
    city: "",
    office_notes: "",
    phone_number: "",
    lug_lock: false,
    adr: false,
    booking_portal_id: "",
    waste_type_id: null,
    town: "",
    country: ""
};

export default function UniversalJobPage() {
    const router = useRouter();
    const { id } = useParams(); // 1. Get the ID from the URL
    const isEdit = id !== "new";
    const [formData, setFormData] = useState<JobForm>(INITIAL_FORM);
    const [loading, setLoading] = useState(false); // Submitting
    const [pageLoading, setPageLoading] = useState(true); // Initial Load
    const [error, setError] = useState<string | null>(null);

    const [selectedTableBinId, setSelectedTableBinId] = useState<number | null>(null);

    const [priorityOptions, setPriorityOptions] = useState<{ label: string, value: any }[]>([]);

    // NEW: Control the editability of the page
    // If it's a NEW job, start in editing mode. If it's an existing ID, start in view mode.

    const [jobTypes, setJobTypes] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/jobs/job_typeforBins")
            .then(res => res.json())
            .then(data => {
                setJobTypes(data);
            });
    }, []);

    // Update the state type at the top
    const [binAssignments, setBinAssignments] = useState<{
        job_bin_id_collect?: number; // Added
        job_bin_id_deliver?: number; // Added
        collectBinNo: string;
        deliverBinNo: string;
        collectValid?: boolean | 'checking';
        deliverValid?: boolean | 'checking';
    }[]>([]);


    // Inside NewJobPage component, near your other useState hooks
    const [options, setOptions] = useState<{
        binTypes: any[];
        companies: any[];
        jobTypes: any[];
        wasteTypes: any[];
        customers: any[];
        users: any[];
        jobStatus: any[];
    }>({
        binTypes: [],
        companies: [],
        jobTypes: [],
        wasteTypes: [],
        customers: [],
        users: [],
        jobStatus: []
    });
    // Sync assignments array when qty changes
    // 1. Add this ref at the top of your component
    const isInitialMount = React.useRef(true);

    // 2. Update the Effect
    useEffect(() => {
        if (isEdit && isInitialMount.current) {
            if (!pageLoading) isInitialMount.current = false;
            return;
        }

        setBinAssignments(prev => {
            const next = [...prev];

            // Add missing rows
            while (next.length < (formData.qty || 0)) {
                next.push({
                    collectBinNo: '',
                    deliverBinNo: '',
                    collectValid: undefined,
                    deliverValid: undefined
                });
            }

            // Trim excess rows
            return next.slice(0, formData.qty || 0);
        });
    }, [formData.qty]);

    const validateBinNumber = async (index: number, field: 'collect' | 'deliver', value: string) => {
        if (!value) {
            setBinAssignments(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], [`${field}Valid`]: undefined };
                return updated;
            });
            return;
        }

        // Set status to checking
        setBinAssignments(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [`${field}Valid`]: 'checking' };
            return updated;
        });

        try {
            const res = await fetch(`/api/jobs/binscheck?bin_number=${encodeURIComponent(value)}`);
            const data = await res.json();

            setBinAssignments(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], [`${field}Valid`]: data.exists };
                return updated;
            });
        } catch (err) {
            console.error("Validation error:", err);
        }
    };
    // Map your database Job Type IDs to UI requirements
    const getJobTypeConfig = (jobTypeId: number | null) => {
        if (!jobTypeId) {
            return { showCollect: false, showDeliver: false, singleBinOnly: false };
        }

        const jobType = jobTypes.find(jt => jt.id === jobTypeId);

        return {
            showCollect: jobType?.allows_collect === 1,
            showDeliver: jobType?.allows_deliver === 1,
            singleBinOnly: ['Tip And Return', 'Relocate', 'Transport', 'Wait and Load'].includes(jobType?.label || ''),
            label: jobType?.label
        };
    };





    const config = getJobTypeConfig(formData.job_type_id);
    const isInspection =
        config.label === "Inspection/Repair";
    const hasNoMovement =
        !config.showCollect && !config.showDeliver;


    const handleBinChange = (index: number, field: 'collectBinNo' | 'deliverBinNo', value: string) => {
        const updated = [...binAssignments];
        updated[index][field] = value;
        setBinAssignments(updated);
    };


    const [isSearchingCust, setIsSearchingCust] = useState(false);
    const [isSearchingUser, setIsSearchingUser] = useState(false);


    const [associatedBins, setAssociatedBins] = useState<any[]>([]);
    const [loadingBins, setLoadingBins] = useState(false);



    const handleBinSelectFromTable = (binTypeId: number, binId: number) => {
        handleInputChange("bin_type_id", binTypeId);
        setSelectedTableBinId(binId);
        window.scrollTo({ top: 100, behavior: 'smooth' });
    };
    // Fetch customer details and prefill Location & Details fields
    useEffect(() => {
        const fetchCustomerData = async () => {
            if (!formData.customer_id || isEdit) return; // Only prefill for new jobs

            try {
                const res = await fetch(`/api/customers/${formData.customer_id}`);
                if (res.ok) {
                    const customer = await res.json();

                    // Prefill Location & Details fields from customer data
                    setFormData(prev => ({
                        ...prev,
                        address: customer.address || prev.address,
                        city: customer.city || prev.city,
                        town: customer.town || prev.town,
                        postcode: customer.postcode || prev.postcode,
                        country: customer.country || prev.country,
                        contact_name: customer.contact_name || prev.contact_name,
                        phone_number: customer.phone_number || prev.phone_number,
                        sic_code: customer.sic_code || prev.sic_code,
                        company_notes: customer.company_notes || prev.company_notes
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch customer details", err);
            }
        };

        fetchCustomerData();
    }, [formData.customer_id, isEdit]);

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
        const fetchAllData = async () => {
            try {
                // 1. Always fetch dropdown options
                const optionsRes = await fetch("/api/jobs/form-data");
                const optionsData = await optionsRes.json();

                setOptions({
                    binTypes: optionsData.binTypes || [],
                    companies: optionsData.companies || [],
                    jobTypes: optionsData.jobTypes || [],
                    wasteTypes: optionsData.wasteTypes || [],
                    customers: optionsData.customers || [],
                    users: optionsData.users || [],
                    jobStatus: optionsData.jobStatus || []
                });
                setPriorityOptions(optionsData.priorities || []);

                // 2. ONLY fetch job data if we are editing
                if (isEdit) {
                    const jobRes = await fetch(`/api/jobs/${id}`);
                    if (jobRes.ok) {
                        const { jobData, movements } = await jobRes.json();

                        // 1. Inject the specific labels from the API into the dropdown options
                        setOptions(prev => ({
                            ...prev,
                            customers: jobData.customer_id ?
                                [{ id: jobData.customer_id, label: jobData.customer_label }, ...prev.customers] : prev.customers,
                            users: jobData.assigned_to ?
                                [{ id: jobData.assigned_to, label: jobData.assigned_to_label }, ...prev.users] : prev.users,
                        }));

                        // 2. Map the jobData to your Form State
                        // Ensure the ID keys match (e.g., your DB has 'job_id' but INITIAL_FORM doesn't)
                        setFormData({
                            ...INITIAL_FORM,
                            ...jobData,
                            // Ensure the date format works for <input type="datetime-local">
                            job_date: jobData.job_date
                                ? new Date(jobData.job_date).toISOString().slice(0, 16)
                                : INITIAL_FORM.job_date,
                            // Handle notes specifically if they come back as null from DB
                            job_notes: jobData.job_notes ?? "",
                        });

                        // 3. Populate Bin Assignments from movements
                        if (movements && Array.isArray(movements)) {
                            const rows: any[] = [];

                            // We loop based on the qty (which determines the number of rows)
                            for (let i = 0; i < jobData.qty; i++) {
                                // Find the movements for this "pair" (index)
                                const collectMove = movements.filter(m => m.movement_type === 'COLLECT')[i];
                                const deliverMove = movements.filter(m => m.movement_type === 'DELIVER')[i];

                                rows.push({
                                    job_bin_id_collect: collectMove?.job_bin_id || undefined,
                                    job_bin_id_deliver: deliverMove?.job_bin_id || undefined,
                                    collectBinNo: collectMove?.bin_number || "",
                                    deliverBinNo: deliverMove?.bin_number || "",
                                    collectValid: collectMove?.bin_number ? true : undefined,
                                    deliverValid: deliverMove?.bin_number ? true : undefined
                                });
                            }
                            setBinAssignments(rows);
                        }
                    }
                } else {
                    // If it's a NEW job, we are done loading immediately 
                    // after the dropdown options are in.
                    setPageLoading(false);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                // This ensures the spinner stops regardless of Edit or New
                setPageLoading(false);
            }
        };
        fetchAllData();
    }, [id, isEdit]);


    if (pageLoading) {
        return <Box sx={{ display: "flex", justifyContent: "center", p: 8 }}><CircularProgress /></Box>;
    }
    // Search Logic
    const handleSearch = async (field: 'customer' | 'user', query: string) => {
        if (query.length < 3) return;

        field === 'customer' ? setIsSearchingCust(true) : setIsSearchingUser(true);
        try {
            const res = await fetch(`/api/jobs/form-data?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();

                // Preserve currently selected item in the list
                setOptions(prev => {
                    let newItems = field === 'customer' ? data.customers : data.users;
                    const selectedId = field === 'customer' ? formData.customer_id : formData.assigned_to;
                    const currentList = field === 'customer' ? prev.customers : prev.users;

                    // If there's a selected item and it's not in the new results, add it
                    if (selectedId) {
                        const selectedItem = currentList.find(item => item.id === selectedId);
                        const isInNewResults = newItems.some((item: any) => item.id === selectedId);

                        if (selectedItem && !isInNewResults) {
                            newItems = [selectedItem, ...newItems];
                        }
                    }

                    return {
                        ...prev,
                        [field === 'customer' ? 'customers' : 'users']: newItems
                    };
                });
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
        // 1️⃣ Validate bin numbers
        const hasInvalidBins = binAssignments.some(b =>
            (config.showCollect && b.collectBinNo && b.collectValid === false) ||
            (config.showDeliver && b.deliverBinNo && b.deliverValid === false)
        );

        if (hasInvalidBins) {
            setError("One or more bin numbers are invalid. Please check the red fields.");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        // 2️⃣ Basic job validation
        if (!formData.customer_id || !formData.bin_type_id || !formData.company_id || !formData.job_type_id || !formData.job_status_id) {
            setError("Please fill in all required fields.");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let jobId: number;

            if (isEdit) {
                // 3️⃣ Update existing job
                const patchRes = await fetch(`/api/jobs/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (!patchRes.ok) {
                    const data = await patchRes.json();
                    throw new Error(data.error || "Failed to update job details");
                }

                jobId = Number(id);
            } else {
                // 3️⃣ Create new job
                const postRes = await fetch(`/api/jobs`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (!postRes.ok) {
                    const data = await postRes.json();
                    throw new Error(data.error || "Failed to create job");
                }

                const data = await postRes.json();
                jobId = data.jobId; // Use the newly created job ID
            }

            // 4️⃣ POST to execute bin workflow
            const binPayload = {
                collect_numbers: binAssignments
                    .filter(b => b.collectBinNo)
                    .map(b => ({
                        job_bin_id: b.job_bin_id_collect,
                        bin_number: b.collectBinNo
                    })),
                deliver_numbers: binAssignments
                    .filter(b => b.deliverBinNo)
                    .map(b => ({
                        job_bin_id: b.job_bin_id_deliver,
                        bin_number: b.deliverBinNo
                    }))
            };

            if (binPayload.collect_numbers.length || binPayload.deliver_numbers.length) {
                const binRes = await fetch(`/api/jobs/${jobId}/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(binPayload),
                });

                if (!binRes.ok) {
                    const data = await binRes.json();
                    throw new Error(data.error || "Failed to update bin assignments");
                }
            }

            // 5️⃣ Redirect to jobs page
            router.push(`/jobs`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            console.error(err);
            toast.error(err.message);
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
                <Typography variant="h4" fontWeight="bold">
                    {isEdit ? `Edit Job #${id}` : "Create New Job"}
                </Typography>
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
                                        value={formData.jobs_notes || ""}
                                        onChange={(e) => handleInputChange("jobs_notes", e.target.value)}
                                        multiline rows={10}
                                    />
                                </Grid>

                                {/* Customer Search */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Autocomplete
                                        // Force the value to find the object in the options array
                                        value={options.customers.find((c) => c.id === formData.customer_id) || null}
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



                                {/* Date */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        type="datetime-local" label="Job Date" fullWidth
                                        value={formData.job_date}
                                        onChange={(e) => handleInputChange("job_date", e.target.value)}
                                        slotProps={{ inputLabel: { shrink: true } }}
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
                                {/* Status Select */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        select
                                        label="Status *"
                                        fullWidth
                                        required
                                        // Bind to job_status_id
                                        value={formData.job_status_id ?? ""}
                                        onChange={(e) => handleInputChange("job_status_id", Number(e.target.value))}
                                        disabled={options.jobStatus.length === 0} // Disable if data hasn't loaded
                                    >
                                        {options.jobStatus.map((status: any) => (
                                            <MenuItem key={status.id} value={status.id}>
                                                {status.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        select
                                        label="Priority"
                                        fullWidth
                                        value={formData.priority}
                                        onChange={(e) => handleInputChange("priority", e.target.value)}
                                    >
                                        {priorityOptions.map((p) => (
                                            <MenuItem key={p.value} value={p.value}>
                                                {p.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 6 }}>
                                    <Autocomplete
                                        options={options.users}
                                        // Match the ID from formData to the object in options
                                        value={options.users.find((u) => u.id === formData.assigned_to) || null}
                                        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label || "")}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        loading={isSearchingUser}
                                        onInputChange={(e, val, reason) => {
                                            // Only search when user is typing, not when selecting
                                            if (reason === 'input') {
                                                handleSearch('user', val);
                                            }
                                        }}
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
                            </Grid>
                            {/* Priority */}

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

                                {/* Contact Name */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth label="Contact Name"
                                        value={formData.contact_name}
                                        onChange={(e) => handleInputChange("contact_name", e.target.value)}
                                    />
                                </Grid>
                                {/* Assigned To Search */}

                                {/* Company Notes */}
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth label="Company Notes"
                                        value={formData.company_notes}
                                        onChange={(e) => handleInputChange("company_notes", e.target.value)}
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
                                        label="Town" fullWidth
                                        value={formData.town}
                                        onChange={(e) => handleInputChange("town", e.target.value)}
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
                                {/* Booking Portal ID */}
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        label="Booking Portal ID" type="number" fullWidth
                                        value={formData.booking_portal_id}
                                        onChange={(e) => handleInputChange("booking_portal_id", e.target.value)}
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
                        <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
                            <AssociatedBinsTable
                                bins={associatedBins}
                                loading={loadingBins}
                                selectedBinId={selectedTableBinId}
                                onSelectBin={handleBinSelectFromTable}
                            />
                        </Grid>
                    )}

                    {/* Movement Manifest Section */}
                    {/* Dynamic Workflow Section */}
                    <Card sx={{ mt: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="secondary">
                                Workflow: {config.label || "Select a Job Type"}
                            </Typography>
                            {hasNoMovement && (
                                <Alert severity="info">
                                    This job type does not require bin movement.
                                </Alert>
                            )}


                            {binAssignments.map((row, index) => (
                                <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#fff' }}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Typography fontWeight="bold" sx={{ minWidth: 80 }}>Item {index + 1}</Typography>
                                        {isInspection && (
                                            <Alert severity="info">
                                                Bin assignment is optional for Inspection / Repair jobs.
                                            </Alert>
                                        )}
                                        {config.singleBinOnly ? (
                                            <TextField
                                                label="Bin #"
                                                size="small"
                                                error={row.collectValid === false}
                                                value={row.collectBinNo}
                                                onChange={(e) => handleBinChange(index, 'collectBinNo', e.target.value)}
                                                onBlur={() => validateBinNumber(index, 'collect', row.collectBinNo)}
                                                helperText="Enter Bin number"
                                                slotProps={{
                                                    input: {
                                                        endAdornment: row.collectValid === 'checking' ? <CircularProgress size={16} /> : null
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <>
                                                {config.showCollect && (
                                                    <TextField
                                                        label="Collect Bin #"
                                                        size="small"
                                                        error={row.collectValid === false}
                                                        value={row.collectBinNo}
                                                        onChange={(e) => handleBinChange(index, 'collectBinNo', e.target.value)}
                                                        onBlur={() => validateBinNumber(index, 'collect', row.collectBinNo)}
                                                        helperText={row.collectValid === false ? "Bin not found" : "Bin to be picked up"}
                                                        slotProps={{
                                                            input: {
                                                                endAdornment: row.collectValid === 'checking' ? <CircularProgress size={16} /> : null
                                                            }
                                                        }}
                                                    />
                                                )}

                                                {config.showCollect && config.showDeliver && <Typography color="text.secondary">→</Typography>}

                                                {config.showDeliver && (
                                                    <TextField
                                                        label="Deliver Bin #"
                                                        size="small"
                                                        error={row.deliverValid === false}
                                                        value={row.deliverBinNo}
                                                        onChange={(e) => handleBinChange(index, 'deliverBinNo', e.target.value)}
                                                        onBlur={() => validateBinNumber(index, 'deliver', row.deliverBinNo)}
                                                        helperText={row.deliverValid === false ? "Invalid Bin" : "Assigning to Customer"}
                                                        slotProps={{
                                                            input: {
                                                                endAdornment: row.deliverValid === 'checking' ? <CircularProgress size={16} /> : null
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </Stack>
                                </Paper>
                            ))}

                        </CardContent>
                    </Card>
                </Grid>

                {/* RIGHT COLUMN: Waste Type Visual Selector */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <WasteTypeSelector
                        options={options.wasteTypes}
                        selectedId={formData.waste_type_id}
                        onSelect={(id) => handleInputChange("waste_type_id", id)}
                    />
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
                            {isEdit ? "Update Job" : "Create Job"}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
            <ToastContainer />
        </Box>
    );
}
