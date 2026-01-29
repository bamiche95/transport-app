"use client";

import React from "react";
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Card,
    CardContent
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export interface Bin {
    bin_id: number;
    bin_type_id: number;
    bin_name: string;
    bin_description: string;
    bin_number: string;
    printed: boolean;
}

interface AssociatedBinsTableProps {
    bins: Bin[];
    loading: boolean;
    selectedBinId?: number | null;
    onSelectBin?: (binTypeId: number, binId: number) => void;
}

export const AssociatedBinsTable: React.FC<AssociatedBinsTableProps> = ({
    bins,
    loading,
    selectedBinId,
    onSelectBin
}) => {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (bins.length === 0) {
        return <Alert severity="info">No specific bins found for this customer.</Alert>;
    }

    return (
        <Card variant="outlined" sx={{ borderRadius: 2, mb: 4 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                    Available Bins for Selected Customer
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Bin Type</th>
                                <th style={{ padding: '12px' }}>Bin Description</th>
                                <th style={{ padding: '12px' }}>Bin Number</th>
                                <th style={{ padding: '12px' }}>Printed</th>
                                {onSelectBin && <th style={{ padding: '12px' }}>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {bins.map((bin) => (
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
                                    {onSelectBin && (
                                        <td style={{ padding: '12px' }}>
                                            <Button
                                                size="small"
                                                variant={selectedBinId === bin.bin_id ? "contained" : "outlined"}
                                                onClick={() => onSelectBin(bin.bin_type_id, bin.bin_id)}
                                            >
                                                {selectedBinId === bin.bin_id ? "Selected" : "Select"}
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
            </CardContent>
        </Card>
    );
};