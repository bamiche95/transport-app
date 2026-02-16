"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    IconButton,
    Box,
    Alert,
} from "@mui/material";
import { Add, Close } from "@mui/icons-material";

interface AddCompanyDialogProps {
    onCompanySaved?: () => void;
}

export default function AddCompanyDialog({ onCompanySaved }: AddCompanyDialogProps) {
    const [open, setOpen] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleOpen = () => {
        setOpen(true);
        setCompanyName("");
        setError("");
    };

    const handleClose = () => {
        setOpen(false);
        setCompanyName("");
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!companyName.trim()) {
            setError("Company name is required");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/company", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company_name: companyName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create company");
            }

            // Success
            handleClose();
            if (onCompanySaved) {
                onCompanySaved();
            }
        } catch (err: any) {
            setError(err.message || "Failed to create company");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpen}
                sx={{ textTransform: "none" }}
            >
                Add Company
            </Button>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Add New Company
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            autoFocus
                            margin="dense"
                            label="Company Name"
                            type="text"
                            fullWidth
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            variant="outlined"
                            placeholder="Enter company name"
                        />
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || !companyName.trim()}
                        >
                            {loading ? "Creating..." : "Create Company"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    );
}
