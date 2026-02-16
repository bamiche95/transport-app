// src/app/components/email_config_columns.tsx
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { Typography, Box, Chip } from "@mui/material";
import { Email, Info, CheckCircle, Cancel } from "@mui/icons-material";

export type EmailConfig = {
    config_id: number;
    config_name: string;
    smtp_host: string;
    smtp_port: number;
    from_email: string;
    from_name: string;
    is_active: boolean | number;
    is_default: boolean | number;
    created_at: Date;
    modified_at: Date;
    created_by_name: string;
    modified_by_name: string;
};

const columnHelper = createColumnHelper<EmailConfig>();

export const emailConfigColumns: ColumnDef<EmailConfig, any>[] = [
    columnHelper.accessor("config_id", {
        header: "ID",
        cell: (info) => (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {info.getValue()}
            </Typography>
        ),
    }),
    columnHelper.accessor("config_name", {
        header: "Configuration Name",
        meta: { editable: true, inputType: "text", apiField: "config_name" },
        cell: (info) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {info.getValue()}
                </Typography>
            </Box>
        ),
    }),
    columnHelper.accessor("smtp_host", {
        header: "SMTP Host",
        cell: (info) => (
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {info.getValue()}
            </Typography>
        ),
    }),
    columnHelper.accessor("smtp_port", {
        header: "Port",
        cell: (info) => (
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                {info.getValue()}
            </Typography>
        ),
    }),
    columnHelper.accessor("from_email", {
        header: "From Email",
        cell: (info) => (
            <Typography variant="caption">
                {info.getValue()}
            </Typography>
        ),
    }),
    columnHelper.accessor("from_name", {
        header: "From Name",
        cell: (info) => info.getValue() || "—",
    }),
    columnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) => {
            const isActive = info.getValue();
            return (
                <Chip
                    icon={isActive ? <CheckCircle /> : <Cancel />}
                    label={isActive ? "Active" : "Inactive"}
                    color={isActive ? "success" : "default"}
                    size="small"
                    variant="outlined"
                />
            );
        },
    }),
    columnHelper.accessor("is_default", {
        header: "Default",
        cell: (info) => {
            const isDefault = info.getValue();
            return isDefault ? (
                <Chip
                    label="Default"
                    color="primary"
                    size="small"
                    variant="filled"
                />
            ) : null;
        },
    }),
    columnHelper.accessor("created_by_name", {
        header: "Created By",
        cell: (info) => (
            <Typography variant="caption">{info.getValue() || "System"}</Typography>
        ),
    }),
    columnHelper.accessor("created_at", {
        header: "Created Date",
        cell: (info) => {
            const date = new Date(info.getValue());
            return isNaN(date.getTime())
                ? "—"
                : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        },
    }),
];
