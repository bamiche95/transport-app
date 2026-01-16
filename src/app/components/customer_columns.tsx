// src/app/customers/columns.tsx
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { Typography, Box, Tooltip } from "@mui/material";
import { 
  Email, Phone, LocationOn, AccessTime, 
  Notes, Public, Business, Person 
} from "@mui/icons-material";

export type Customer = {
  customer_id: number;
  customer_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  postcode: string;
  created_at: Date;
  modified_at: Date;
  sic_code: number;
  created_by: string;
  modified_by: string;
  town: string;
  country: string;
  opening_times: string;
  company_notes: string;
};

const columnHelper = createColumnHelper<Customer>();

export const customerColumns: ColumnDef<Customer, any>[] = [
  columnHelper.accessor("customer_id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("customer_name", {
    header: "Customer Name",
    cell: (info) => (
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {info.getValue()}
      </Typography>
    ),
  }),
  columnHelper.accessor("contact_name", {
    header: "Contact Person",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Email sx={{ fontSize: 16, color: 'action.active' }} />
        {info.getValue() || "—"}
      </Box>
    ),
  }),
  columnHelper.accessor("phone_number", {
    header: "Phone",
    cell: (info) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Phone sx={{ fontSize: 16, color: 'action.active' }} />
        {info.getValue() || "—"}
      </Box>
    ),
  }),
  columnHelper.accessor("address", {
    header: "Street Address",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.accessor("city", {
    header: "City",
    cell: (info) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LocationOn sx={{ fontSize: 16, color: 'error.light' }} />
        <Typography variant="caption">{info.getValue() || "—"}</Typography>
      </Box>
    ),
  }),
  columnHelper.accessor("town", {
    header: "Town",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.accessor("postcode", {
    header: "Postcode",
    cell: (info) => (
      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        {info.getValue() || "—"}
      </Typography>
    ),
  }),
  columnHelper.accessor("country", {
    header: "Country",
    cell: (info) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Public sx={{ fontSize: 16, color: 'text.secondary' }} />
        {info.getValue() || "—"}
      </Box>
    ),
  }),
  columnHelper.accessor("opening_times", {
    header: "Opening Times",
    cell: (info) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTime sx={{ fontSize: 16, color: 'warning.main' }} />
        <Typography variant="caption">{info.getValue() || "Not Set"}</Typography>
      </Box>
    ),
  }),
  columnHelper.accessor("sic_code", {
    header: "SIC Code",
    cell: (info) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Business sx={{ fontSize: 16, color: 'text.disabled' }} />
        {info.getValue() || "—"}
      </Box>
    ),
  }),
  columnHelper.accessor("company_notes", {
    header: "Notes",
    cell: (info) => {
      const val = info.getValue();
      return val ? (
        <Tooltip title={val}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notes sx={{ fontSize: 16, color: 'info.main' }} />
            <Typography variant="caption" noWrap sx={{ maxWidth: 150 }}>{val}</Typography>
          </Box>
        </Tooltip>
      ) : "—";
    },
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
      return isNaN(date.getTime()) ? "—" : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
      return isNaN(date.getTime()) ? "—" : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    },
  }),
];