import React, { useState, useEffect, useCallback } from "react";
import {
    TextField,
    Autocomplete,
    MenuItem,
    IconButton,
    Box,
    CircularProgress,
    Stack,
    Typography,
    debounce,
} from "@mui/material";
import { Theme } from "@mui/material/styles";
import { Edit as EditIcon, Check, Close } from "@mui/icons-material";
import { EditableColumnMeta } from "../types/EditableColumnMeta";

interface EditableCellProps {
    initialValue: any;
    renderedContent?: React.ReactNode;
    row: any;
    column: any;
    isEditing: boolean;
    onEditStart: () => void;
    onSave: (value: any) => Promise<void>;
    onCancel: () => void;
}

export default function EditableCell({
    initialValue,
    renderedContent,
    row,
    column,
    isEditing,
    onEditStart,
    onSave,
    onCancel,
}: EditableCellProps) {
    const meta = column.columnDef.meta as EditableColumnMeta | undefined;
    const inputType = meta?.inputType || "text";
    const isDate = inputType === "date"; // Can add checks from previous file if needed

    const [tempValue, setTempValue] = useState(initialValue);
    const [saving, setSaving] = useState(false);

    // Autocomplete State
    const [options, setOptions] = useState<any[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [inputValue, setInputValue] = useState(""); // For typing text

    // Initialize temp value on edit start
    useEffect(() => {
        if (isEditing) {
            // For autocomplete, if we have a value, we might want to set the inputValue too?
            if (inputType === "autocomplete") {
                // If initialValue is a string, set it as inputValue? 
                // Assuming initialValue is the display label.
                setInputValue(initialValue ? String(initialValue) : "");
                setTempValue(null); // Clear selection until picked
            } else {
                setTempValue(initialValue);
            }
        }
    }, [isEditing, initialValue, inputType]);


    // Debounced search for autocomplete
    const fetchOptions = useCallback(
        debounce(async (query: string) => {
            if (!meta?.searchConfig || query.length < 3) return;

            setLoadingOptions(true);
            try {
                const { searchUrl } = meta.searchConfig;
                const separator = searchUrl.includes("?") ? "&" : "?";
                const res = await fetch(`${searchUrl}${separator}search=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error("Search failed");
                const data = await res.json();

                const list = Array.isArray(data) ? data : (data.results || []);
                setOptions(list);
            } catch (err) {
                console.error(err);
                setOptions([]);
            } finally {
                setLoadingOptions(false);
            }
        }, 500),
        [meta?.searchConfig]
    );

    useEffect(() => {
        if (inputType === "autocomplete" && isEditing && inputValue) {
            fetchOptions(inputValue);
        }
    }, [inputValue, isEditing, inputType, fetchOptions]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // For autocomplete, tempValue is the selected Object.
            // We might need to extract the valueKey.
            let valueToSave = tempValue;
            if (inputType === "autocomplete" && meta?.searchConfig && tempValue && typeof tempValue === 'object') {
                valueToSave = tempValue[meta.searchConfig.valueKey];
            }

            await onSave(valueToSave);
        } finally {
            setSaving(false);
        }
    };

    if (!isEditing) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center", // Changed to center for better alignment
                    position: "relative",
                    width: "100%",
                    minHeight: "24px", // Ensure height for hover
                    "&:hover .edit-btn": { opacity: 1 },
                }}
            >
                <Typography variant="body2" noWrap sx={{ flex: 1 }} component="div">
                    {/* If initial value is an object (unexpected but checking), render label? 
                Usually initialValue is what React Table rendered, so it's a primitive or node. */}
                    {renderedContent !== undefined ? renderedContent : (initialValue || "—")}
                </Typography>

                {meta?.editable !== false && (
                    <IconButton
                        className="edit-btn"
                        size="small"
                        sx={{
                            opacity: 0,
                            padding: "4px",
                            color: "#ffffff",
                            backgroundColor: "#d41111",
                            transition: "all 0.2s",
                            "&:hover": {
                                backgroundColor: "#ff1a1a",
                                opacity: 1,
                                transform: "scale(1.1)",
                            },
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditStart();
                        }}
                    >
                        <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                )}
            </Box>
        );
    }

    return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
            {saving ? (
                <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="caption">Saving...</Typography>
                </Stack>
            ) : (
                <>
                    {inputType === "autocomplete" ? (
                        <Autocomplete
                            fullWidth
                            size="small"
                            options={options}
                            loading={loadingOptions}
                            getOptionLabel={(option) => {
                                if (typeof option === 'string') return option;
                                return option[meta?.searchConfig?.labelKey || "label"] || "";
                            }}
                            value={tempValue}
                            onChange={(_, newValue) => setTempValue(newValue)}
                            inputValue={inputValue}
                            onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
                            renderInput={(params) => <TextField {...params} variant="standard" autoFocus placeholder="Type 3+ chars..." />}
                            sx={{ minWidth: 150 }}
                        />
                    ) : inputType === "select" ? (
                        <TextField
                            select
                            fullWidth
                            size="small"
                            variant="standard"
                            value={tempValue || ""}
                            onChange={(e) => setTempValue(e.target.value)}
                        >
                            {(Array.isArray(meta?.options) ? meta.options : []).map((opt: any, i: number) => (
                                <MenuItem key={opt.id || opt.value || i} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    ) : (
                        <TextField
                            fullWidth
                            size="small"
                            type={inputType}
                            variant="standard"
                            value={tempValue || ""}
                            onChange={(e) => setTempValue(e.target.value)}
                            autoFocus
                        />
                    )}

                    <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleSave(); }} disabled={loadingOptions} sx={{ backgroundColor: '#a0f7d6ff' }}>
                        <Check fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onCancel(); }} sx={{ backgroundColor: '#ff5252ff' }}>
                        <Close fontSize="small" />
                    </IconButton>
                </>
            )}
        </Stack>
    );
}
