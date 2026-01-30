"use client";

import React, { useState, useEffect } from "react";
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
    Button,
    IconButton,
    Card,
    CardContent,
    Stack,
    Alert,
} from "@mui/material";
import { Delete, Colorize } from "@mui/icons-material";

interface ColorRule {
    id: number;
    match_term: string;
    color_code: string;
    text_color: string;
}

export default function ColorSchemesPage() {
    const [rules, setRules] = useState<ColorRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRule, setNewRule] = useState({ match_term: "", color_code: "#e2e8f0", text_color: "#000000" });
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch("/api/color-rules");
            const data = await res.json();
            if (Array.isArray(data)) {
                setRules(data);
            }
        } catch (err) {
            console.error("Failed to load rules", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRule = async () => {
        if (!newRule.match_term.trim()) {
            setError("Please enter a term to match");
            return;
        }

        try {
            const res = await fetch("/api/color-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRule),
            });

            if (!res.ok) throw new Error("Failed to add rule");

            const createdObj = await res.json();
            setRules([createdObj, ...rules]);
            setNewRule({ match_term: "", color_code: "#e2e8f0", text_color: "#000000" });
            setError("");
        } catch (err: any) {
            setError(err.message || "Error adding rule");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        try {
            await fetch(`/api/color-rules/${id}`, { method: "DELETE" });
            setRules(rules.filter((r) => r.id !== id));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 300 }}>
                Color Schemes
            </Typography>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="md:col-span-1">
                    <Card elevation={3}>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Add New Rule
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                Rows in the Jobs table will be colored if their <strong>Bin Type</strong> contains this term.
                            </Typography>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Stack spacing={3}>
                                <TextField
                                    label="Match Term (e.g., 'roro', 'skip')"
                                    fullWidth
                                    value={newRule.match_term}
                                    onChange={(e) => setNewRule({ ...newRule, match_term: e.target.value })}
                                />

                                <Box>
                                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                        Background Color
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={newRule.color_code}
                                            onChange={(e) => setNewRule({ ...newRule, color_code: e.target.value })}
                                            className="h-10 w-20 cursor-pointer border rounded"
                                        />
                                        <TextField
                                            size="small"
                                            value={newRule.color_code}
                                            onChange={(e) => setNewRule({ ...newRule, color_code: e.target.value })}
                                            sx={{ flex: 1 }}
                                        />
                                    </div>
                                </Box>

                                <Box>
                                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                        Text Color
                                    </Typography>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={newRule.text_color}
                                            onChange={(e) => setNewRule({ ...newRule, text_color: e.target.value })}
                                            className="h-10 w-20 cursor-pointer border rounded"
                                        />
                                        <TextField
                                            size="small"
                                            value={newRule.text_color}
                                            onChange={(e) => setNewRule({ ...newRule, text_color: e.target.value })}
                                            sx={{ flex: 1 }}
                                        />
                                    </div>
                                </Box>

                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: newRule.color_code,
                                        color: newRule.text_color,
                                        borderRadius: 1,
                                        textAlign: "center",
                                        border: "1px solid #ddd",
                                    }}
                                >
                                    Preview: {newRule.match_term || "Term"}
                                </Box>

                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<Colorize />}
                                    onClick={handleAddRule}
                                    disabled={!newRule.match_term}
                                >
                                    Add Rule
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </div>

                {/* List Section */}
                <div className="md:col-span-2">
                    <Paper elevation={3}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                        <TableCell>Match Term</TableCell>
                                        <TableCell>Preview</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : rules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                                No rules defined.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rules.map((rule) => (
                                            <TableRow key={rule.id} hover>
                                                <TableCell sx={{ fontWeight: "bold" }}>{rule.match_term}</TableCell>
                                                <TableCell>
                                                    <span
                                                        style={{
                                                            backgroundColor: rule.color_code,
                                                            color: rule.text_color,
                                                            padding: "4px 12px",
                                                            borderRadius: "16px",
                                                            display: "inline-block",
                                                            border: "1px solid rgba(0,0,0,0.1)",
                                                        }}
                                                    >
                                                        {rule.match_term}
                                                    </span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton onClick={() => handleDelete(rule.id)} color="error" size="small">
                                                        <Delete />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </div>
            </div>
        </Box>
    );
}
