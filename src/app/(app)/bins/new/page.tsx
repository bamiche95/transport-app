"use client";

import React, { useState, useEffect } from 'react';
import {
    Box, TextField, Button, Typography, Paper, FormControlLabel, Checkbox,
    Card, CardContent, Stack, Alert, MenuItem, Autocomplete, CircularProgress
} from '@mui/material';
import Barcode from 'react-barcode';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
interface Option { id: number; label: string; }

export default function NewBinPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState({ customers: false, users: false });

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
        printed: false // New field
    });

const debouncedSearch = useDebouncedCallback(async (type: 'customer' | 'user', query: string) => {
        const isCust = type === 'customer';
        setSearchLoading(prev => ({ ...prev, [isCust ? 'customers' : 'users']: true }));

        try {
            const res = await fetch(`/api/bins/form-data?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setOptions(prev => ({ 
                    ...prev, 
                    [isCust ? 'customers' : 'users']: isCust ? data.customers : data.users 
                }));
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setSearchLoading(prev => ({ ...prev, [isCust ? 'customers' : 'users']: false }));
        }
    }, 500); // 500ms delay

 // Wait 500ms after typing stops
    // Initial load for static selects
    useEffect(() => {
        fetch('/api/bins/form-data').then(res => res.json()).then(data => setOptions(data));
    }, []);

    // Helper for Live Search
  const handleSearch = (type: 'customer' | 'user', query: string) => {
        if (query.length < 3) return;
        debouncedSearch(type, query);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Convert boolean printed to 1 or 0 for MySQL tinyint
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
                                    fullWidth label="Bin Number" name="bin_number" required
                                    value={formData.bin_number} onChange={(e) => setFormData({ ...formData, bin_number: e.target.value })}
                                />

                                <TextField
                                    fullWidth label="Bin Description" multiline rows={2}
                                    value={formData.bin_description} onChange={(e) => setFormData({ ...formData, bin_description: e.target.value })}
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

           <Autocomplete
            options={options.customers}
            loading={searchLoading.customers}
            onInputChange={(_, val) => handleSearch('customer', val)}
            filterOptions={(x) => x} // Critical: API handles filtering
            getOptionLabel={(option) => option.label || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={formData.customer_id === null && !searchLoading.customers ? "No customers found" : "Type 3+ characters to search"}
            onChange={(_, val) => setFormData({ ...formData, customer_id: val?.id || null })}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    label="Search Customer"
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            endAdornment: (
                                <React.Fragment>
                                    {searchLoading.customers ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </React.Fragment>
                            ),
                        },
                    }}
                />
            )}
        />

                              <Autocomplete
    options={options.users}
    loading={searchLoading.users}
    // API-side filtering: tell MUI not to filter locally
    filterOptions={(x) => x}
    onInputChange={(_, val) => handleSearch('user', val)}
    // Map the selected ID back to the option object to keep it controlled
    value={options.users.find(u => u.id === formData.assigned_to) || null}
    getOptionLabel={(option) => (typeof option === 'string' ? option : option.label || "")}
    isOptionEqualToValue={(option, value) => option.id === value.id}
    
    // Feedback when no results are found or before search starts
    noOptionsText={
        formData.assigned_to === null && !searchLoading.users 
            ? "No users found" 
            : "Type 3+ characters to search"
    }
    
    onChange={(_, val) => setFormData({ ...formData, assigned_to: val?.id || null })}
    renderInput={(params) => (
        <TextField 
            {...params} 
            label="Assign to User"
            slotProps={{
                input: {
                    ...params.InputProps,
                    endAdornment: (
                        <React.Fragment>
                            {searchLoading.users ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                        </React.Fragment>
                    ),
                },
            }}
        />
    )}
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
                                    value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                />
                            </Stack>
                        </Paper>
                    </Box>

                    <Box sx={{ width: { xs: '100%', md: 350 } }}>
                        <Card sx={{ textAlign: 'center', p: 2, position: { md: 'sticky' }, top: 20 }}>
                            <Typography variant="subtitle2" color="text.secondary">BARCODE PREVIEW</Typography>
                            <Box sx={{ my: 3, p: 2, bgcolor: 'white', display: 'inline-block', border: '1px solid #eee' }}>
                                {formData.bin_number ? (
                                    <Barcode value={formData.bin_number} width={1.2} height={50} />
                                ) : (
                                    <Typography variant="caption" color="error">Enter Bin Number</Typography>
                                )}
                            </Box>
                            <Button
                                type="submit" variant="contained" fullWidth size="large"
                                disabled={loading || !formData.bin_number}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Save Bin Asset"}
                            </Button>
                        </Card>
                    </Box>
                </Box>
            </form>
        </Box>
    );
}