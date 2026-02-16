// src/app/components/company_columns.tsx
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { Typography, Box } from "@mui/material";
import { Business, Person } from "@mui/icons-material";

export type Company = {
    company_id: number;
    company_name: string;
    created_at: Date;
    modified_at: Date;
    created_by: string;
    modified_by: string;
};

const columnHelper = createColumnHelper<Company>();

export const companyColumns: ColumnDef<Company, any>[] = [
    columnHelper.accessor("company_id", {
        header: "ID",
        cell: (info) => (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {info.getValue()}
            </Typography>
        ),
    }),
    columnHelper.accessor("company_name", {
        header: "Company Name",
        meta: { editable: true, inputType: "text", apiField: "company_name" },
        cell: (info) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {info.getValue()}
                </Typography>
            </Box>
        ),
    }),
    columnHelper.accessor("created_by", {
        header: "Created By",
        cell: (info) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption">{info.getValue() || "System"}</Typography>
            </Box>
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
    columnHelper.accessor("modified_by", {
        header: "Modified By",
        cell: (info) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption">{info.getValue() || "—"}</Typography>
            </Box>
        ),
    }),
    columnHelper.accessor("modified_at", {
        header: "Modified Date",
        cell: (info) => {
            const date = new Date(info.getValue());
            return isNaN(date.getTime())
                ? "—"
                : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        },
    }),
];
