"use client";

import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Button, Typography, Paper, FormControlLabel, Checkbox,
    Card, Stack, Autocomplete, CircularProgress, MenuItem
} from '@mui/material';
import Barcode from 'react-barcode';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

interface Option { id: number; label: string; }

export default function NewBinPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState({ customers: false, users: false });

    const [binError, setBinError] = useState<string | null>(null);
    const [checkingBin, setCheckingBin] = useState(false);

    // options now tracks everything, including our persistent selections
    const [options, setOptions] = useState<{ [key: string]: Option[] }>({
        statuses: [], types: [], companies: [], customers: [], users: []
    });

    const [formData, setFormData] = useState({
        bin_number: '',
        bin_description: '',
        bin_type_id: '',
        customer_id: null as number | null,
        company_id: '',
        bin_status_id: '',
        comment: '',
        bin_condition: 'New',
        assigned_to: null as number | null,
        printed: false
    });

    // To prevent the selection from disappearing, we keep track of the selected objects themselves
    const [selectedUser, setSelectedUser] = useState<Option | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Option | null>(null);

    const debouncedSearch = useDebouncedCallback(async (type: 'customer' | 'user', query: string) => {
        const isCust = type === 'customer';
        setSearchLoading(prev => ({ ...prev, [isCust ? 'customers' : 'users']: true }));

        try {
            const res = await fetch(`/api/bins/form-data?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setOptions(prev => {
                    const newResults = isCust ? data.customers : data.users;
                    const currentlySelected = isCust ? selectedCustomer : selectedUser;
                    
                    // Merge new results with the currently selected item so it doesn't vanish
                    const merged = [...newResults];
                    if (currentlySelected && !merged.find(item => item.id === currentlySelected.id)) {
                        merged.push(currentlySelected);
                    }

                    return { 
                        ...prev, 
                        [isCust ? 'customers' : 'users']: merged 
                    };
                });
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearchLoading(prev => ({ ...prev, [isCust ? 'customers' : 'users']: false }));
        }
    }, 500);

    const checkBinAvailability = useDebouncedCallback(async (num: string) => {
        if (num.length < 1) { setBinError(null); return; }
        setCheckingBin(true);
        try {
            const res = await fetch(`/api/bins/check-exists?bin_number=${num}`);
            const data = await res.json();
            setBinError(data.exists ? "This Bin Number already exists in the system." : null);
        } catch (err) {
            console.error("Availability check failed", err);
        } finally {
            setCheckingBin(false);
        }
    }, 600);

    useEffect(() => {
        fetch('/api/bins/form-data').then(res => res.json()).then(data => setOptions(data));
    }, []);

    const handleSearch = (type: 'customer' | 'user', query: string) => {
        if (query.length < 3) return;
        debouncedSearch(type, query);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (binError) return;
        setLoading(true);
        const payload = { ...formData, printed: formData.printed ? 1 : 0 };
        const res = await fetch('/api/bins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) router.push('/bins');
        setLoading(false);
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto' }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Add New Bin Asset</Typography>

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ flex: 1 }}>
                        <Paper sx={{ p: 3 }}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth label="Bin Number" required
                                    error={!!binError}
                                    helperText={binError || (checkingBin ? "Checking availability..." : "Maximum 6 digits")}
                                    value={formData.bin_number}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val) && val.length <= 6) {
                                            setFormData({ ...formData, bin_number: val });
                                            setBinError(null);
                                            checkBinAvailability(val);
                                        }
                                    }}
                                />

                                <TextField
                                    fullWidth label="Bin Description" multiline rows={2}
                                    value={formData.bin_description} 
                                    onChange={(e) => setFormData({ ...formData, bin_description: e.target.value })}
                                />

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        select fullWidth label="Bin Type" value={formData.bin_type_id}
                                        onChange={(e) => setFormData({ ...formData, bin_type_id: e.target.value })}
                                    >
                                        {options.types.map(opt => <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>)}
                                    </TextField>
                                    <TextField
                                        select fullWidth label="Status" value={formData.bin_status_id}
                                        onChange={(e) => setFormData({ ...formData, bin_status_id: e.target.value })}
                                    >
                                        {options.statuses.map(opt => <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>)}
                                    </TextField>
                                </Box>

                                <TextField
                                    select fullWidth label="Owning Company" value={formData.company_id}
                                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                >
                                    {options.companies.map(opt => <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>)}
                                </TextField>

                                {/* FIXED CUSTOMER AUTOCOMPLETE */}
                                <Autocomplete
                                    options={options.customers}
                                    loading={searchLoading.customers}
                                    filterOptions={(x) => x}
                                    value={selectedCustomer}
                                    onInputChange={(_, val) => handleSearch('customer', val)}
                                    getOptionLabel={(option) => option.label || ""}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, val) => {
                                        setSelectedCustomer(val);
                                        setFormData({ ...formData, customer_id: val?.id || null });
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Search Customer" />}
                                />

                                {/* FIXED USER AUTOCOMPLETE */}
                                <Autocomplete
                                    options={options.users}
                                    loading={searchLoading.users}
                                    filterOptions={(x) => x}
                                    value={selectedUser}
                                    onInputChange={(_, val) => handleSearch('user', val)}
                                    getOptionLabel={(option) => option.label || ""}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, val) => {
                                        setSelectedUser(val);
                                        setFormData({ ...formData, assigned_to: val?.id || null });
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Assign to User" />}
                                />

                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <TextField
                                        fullWidth label="Condition" sx={{ flex: 2 }}
                                        value={formData.bin_condition}
                                        onChange={(e) => setFormData({ ...formData, bin_condition: e.target.value })}
                                    />
                                    <FormControlLabel
                                        sx={{ flex: 1 }}
                                        control={<Checkbox checked={formData.printed} onChange={(e) => setFormData({ ...formData, printed: e.target.checked })} />}
                                        label="Already Printed?"
                                    />
                                </Box>

                                <TextField
                                    fullWidth label="Comment / Internal Notes" multiline rows={3}
                                    value={formData.comment} 
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                />
                            </Stack>
                        </Paper>
                    </Box>

                    <Box sx={{ width: { xs: '100%', md: 350 } }}>
                        <Card sx={{ textAlign: 'center', p: 2, position: { md: 'sticky' }, top: 20 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>BARCODE PREVIEW</Typography>
                            <Box sx={{ my: 2, p: 2, bgcolor: 'white', border: '1px solid #ddd', borderRadius: 1, color: 'black' }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>Recycling Management Ltd</Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>0121 328 5000</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    {formData.bin_number ? (
                                        <Barcode value={formData.bin_number} width={1.5} height={50} fontSize={14} margin={0} />
                                    ) : (
                                        <Box sx={{ height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', width: '100%' }}>
                                            <Typography variant="caption" color="error">Enter Bin Number</Typography>
                                        </Box>
                                    )}
                                </Box>
                                {formData.bin_description && (
                                    <Typography variant="body2" sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {formData.bin_description}
                                    </Typography>
                                )}
                            </Box>
                            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading || !formData.bin_number || !!binError} sx={{ mt: 2 }}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Save Bin Asset"}
                            </Button>
                        </Card>
                    </Box>
                </Box>
            </form>
        </Box>
    );
}