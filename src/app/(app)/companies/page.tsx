"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    CircularProgress,
    IconButton,
    Tooltip
} from "@mui/material";
import { Building2, History, User } from "lucide-react";
import AddCompanyDialog from "@/app/components/AddCompanyDialog";

export interface Company {
    company_id: number;
    company_name: string;
    created_at: string;
    created_by: string;
    modified_at: string;
    modified_by: string;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);

    const fetchCompanies = async () => {
        try {
            const res = await fetch("/api/company");
            const data = await res.json();
            // Handle both direct arrays and nested wrapper arrays from MySQL
            const result = Array.isArray(data[0]) ? data[0] : data;
            setCompanies(result);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleUpdateName = async (id: number, newValue: string, originalValue: string) => {
        if (newValue === originalValue) return;

        setSavingId(id);
        
        // 1. Optimistic Update
        setCompanies(prev => prev.map(c => 
            c.company_id === id ? { ...c, company_name: newValue } : c
        ));

        try {
            const res = await fetch(`/api/company/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company_name: newValue })
            });

            if (!res.ok) throw new Error();
        } catch (error) {
            // Rollback if failed
            setCompanies(prev => prev.map(c => 
                c.company_id === id ? { ...c, company_name: originalValue } : c
            ));
            alert("Failed to update company name.");
        } finally {
            setSavingId(null);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 8, gap: 2 }}>
            <CircularProgress size={40} />
            <Typography color="textSecondary">Loading company registry...</Typography>
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Building2 size={32} /> Companies
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Manage and edit companies
                    </Typography>
                      <Typography variant="body2" sx={{ color: '#ff0808ff' }}>
                       ***Please contact the admin before making any changes as this could disrupt the system
                    </Typography>
                </Box>
                <AddCompanyDialog onCompanySaved={fetchCompanies} />
            </Box>

            {/* Table Section */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Created By</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Last Modified</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {companies.map((company) => (
                            <TableRow 
                                key={company.company_id}
                                sx={{ '&:hover': { bgcolor: '#f1f5f9' }, transition: 'background 0.2s' }}
                            >
                                <TableCell sx={{ py: 1, width: '30%' }}>
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        defaultValue={company.company_name}
                                        onBlur={(e) => handleUpdateName(company.company_id, e.target.value, company.company_name)}
                                        disabled={savingId === company.company_id}
                                        InputProps={{
                                            disableUnderline: true,
                                            sx: { 
                                                fontSize: '0.95rem', 
                                                fontWeight: 500,
                                                p: 1,
                                                borderRadius: 1,
                                                '&:hover': { bgcolor: '#fff', boxShadow: '0 0 0 1px #cbd5e1' },
                                                '&.Mui-focused': { bgcolor: '#fff', boxShadow: '0 0 0 2px #3b82f6' }
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <User size={14} color="#64748b" />
                                        <Typography variant="body2">{company.created_by}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="textSecondary">
                                        {new Date(company.created_at).toLocaleDateString()}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Tooltip title={`Modified by ${company.modified_by}`}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <History size={14} color="#64748b" />
                                            <Typography variant="body2" color="textSecondary">
                                                {new Date(company.modified_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}