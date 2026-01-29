"use client";

import React from "react";
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface WasteType {
    id: number;
    label: string;
    description?: string;
}

interface WasteTypeSelectorProps {
    options: WasteType[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}

export const WasteTypeSelector: React.FC<WasteTypeSelectorProps> = ({
    options,
    selectedId,
    onSelect
}) => {
    return (
        <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Waste Type Selection
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Please select the content type for this job.
                </Typography>

                <Grid container spacing={2}>
                    {options.map((type) => {
                        const isSelected = selectedId === type.id;
                        return (
                          <Grid size={{ xs: 12, sm: 6, md: 12 }} key={type.id}>
                                <Paper
                                    variant={isSelected ? "elevation" : "outlined"}
                                    elevation={isSelected ? 4 : 0}
                                    onClick={() => onSelect(type.id)}
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
                                        {type.description && (
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                {type.description}
                                            </Typography>
                                        )}
                                    </Box>
                                    {isSelected && <CheckCircleIcon color="primary" />}
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </CardContent>
        </Card>
    );
};