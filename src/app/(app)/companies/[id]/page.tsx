"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Grid,
    IconButton,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Divider,
} from "@mui/material";
import { ArrowBack, Save, Delete, Business } from "@mui/icons-material";

export default function CompanyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const companyId = params?.id as string;

    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        if (companyId) {
            fetchCompany();
        }
    }, [companyId]);

    const fetchCompany = async () => {
        try {
            const res = await fetch(`/api/company/${companyId}`);
            if (!res.ok) throw new Error("Failed to fetch company");
            const data = await res.json();
            setCompany(data);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || "Failed to load company");
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!company?.company_name?.trim()) {
            setError("Company name is required");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`/api/company/${companyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company_name: company.company_name }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update company");
            }

            setSuccess("Company updated successfully");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to update company");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/company/${companyId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete company");
            }

            router.push("/companies");
        } catch (err: any) {
            setError(err.message || "Failed to delete company");
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!company) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error">Company not found</Alert>
                <Button startIcon={<ArrowBack />} onClick={() => router.push("/companies")} sx={{ mt: 2 }}>
                    Back to Companies
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => router.push("/companies")} size="large">
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                            Company Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ID: {company.company_id}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialogOpen(true)}
                >
                    Delete Company
                </Button>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
                    {success}
                </Alert>
            )}

            {/* Main Form */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Business color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Company Information
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={company.company_name || ""}
                            onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                            variant="outlined"
                            required
                        />
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Audit Information */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                        Audit Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Created By
                            </Typography>
                            <Typography variant="body2">
                                {company.created_by || "—"}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Created At
                            </Typography>
                            <Typography variant="body2">
                                {company.created_at
                                    ? new Date(company.created_at).toLocaleString()
                                    : "—"}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Modified By
                            </Typography>
                            <Typography variant="body2">
                                {company.modified_by || "—"}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Modified At
                            </Typography>
                            <Typography variant="body2">
                                {company.modified_at
                                    ? new Date(company.modified_at).toLocaleString()
                                    : "—"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Save Button */}
                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving || !company.company_name?.trim()}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => router.push("/companies")}
                        >
                            Cancel
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Company</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{company.company_name}</strong>?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
