"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { MenuItem } from "@mui/material";
interface CustomerDetail {
  customer_id: number;
  customer_name: string;
  company_id: number;

  contact_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  town: string;
  postcode: string;
  country: string;
  opening_times: string;
  sic_code: string;
  company_notes: string;

  created_by: number;
  modified_by: number;
  created_at: string;
  modified_at: string;
  assigned_to: number;
  assigned_to_name?: string; // Add this
  first_name: string;
  last_name: string;
  company_name?: string;     // Ensure this is here
  jobs?: any[];
  bins?: any[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState<Partial<CustomerDetail>>({});
  // Change this line:
  const [users, setUsers] = useState<{
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
  }[]>([]);
  const [companies, setCompanies] = useState<{ company_id: number; company_name: string }[]>([]);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const jobsColumns: ColumnDef<any>[] = [
    { accessorKey: "job_id", header: "Job ID" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "job_datetime",
      header: "Date",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return val ? new Date(val).toLocaleDateString() : "-";
      }
    },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "town", header: "Town" },
    { accessorKey: "postcode", header: "Postcode" },
  ];

  /*
  Column for Bins Tab: 
  Bin Description, Bin Type, CUstomer Name, Company, Bin Number, Printed, Modified time and Condition.
  */
  const binsColumns: ColumnDef<any>[] = [
    { accessorKey: "bin_description", header: "Bin Description" },
    { accessorKey: "bin_name", header: "Bin Type" },
    { accessorKey: "customer_name", header: "Customer Name" },
    { accessorKey: "company_name", header: "Company" },
    { accessorKey: "bin_number", header: "Bin Number" },
    {
      accessorKey: "printed",
      header: "Printed",
      cell: ({ getValue }) => (getValue() ? "Yes" : "No")
    },
    {
      accessorKey: "modified_at",
      header: "Modified Time",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return val ? new Date(val).toLocaleString() : "-";
      }
    },
    { accessorKey: "bin_condition", header: "Condition" },
  ];


  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${id}`);
        if (!res.ok) throw new Error("Failed to fetch customer");
        const data = await res.json();
        setCustomer(data);
        setEditData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load customer");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCustomer();
  }, [id]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = await params.id; // Handling promise params

        // Fetch Customer, Users, and Companies in parallel
        const [custRes, userRes, compRes] = await Promise.all([
          fetch(`/api/customers/${id}`),
          fetch(`/api/users`),
          fetch(`/api/company`)
        ]);

        if (custRes.ok) {
          const data = await custRes.json();
          setCustomer(data);
          setEditData(data);
        }

        if (userRes.ok) {
          const data = await userRes.json();
          setUsers(data.users || []); // Your API returns { users: [] }
        }

        if (compRes.ok) {
          const data = await compRes.json();
          setCompanies(data || []); // Your API returns [] directly
        }

      } catch (err) {
        setError("Failed to load necessary data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);



  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(customer || {});
  };

  const handleInputChange = (field: keyof CustomerDetail, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error("Failed to update customer");

      const updated = await res.json();
      setCustomer(updated);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete customer");

      router.push("/customers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete customer");
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!customer) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Customer not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Customer Detail
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} variant="outlined">
          Back
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title={customer.customer_name}
          subheader={`ID: ${customer.customer_id}`}
          sx={{ bgcolor: "#f8fafc" }}
        />

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="customer tabs">
            <Tab label="Details" />
            <Tab label="Updates" />
            <Tab label="Jobs" />
            <Tab label="Bins" />
          </Tabs>
        </Box>

        <CardContent>
          <div role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && (
              <Stack spacing={3}>
                {/* Row 1: Customer Name & Email */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Customer Name
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.customer_name || ""}
                        onChange={(e) => handleInputChange("customer_name", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.customer_name}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Email
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        type="email"
                        value={editData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.email}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Row 2: Company & Contact */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Company
                    </Typography>
                    {isEditing ? (
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={editData.company_id || ""}
                        onChange={(e) => handleInputChange("company_id", Number(e.target.value))}
                        sx={{ mt: 1 }}
                      >
                        {companies.map((c) => (
                          <MenuItem key={c.company_id} value={c.company_id}>
                            {c.company_name}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.company_name || `ID: ${customer.company_id}`}
                      </Typography>
                    )}
                  </Box>


                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Contact Name
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.contact_name || ""}
                        onChange={(e) => handleInputChange("contact_name", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.contact_name || "—"}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Row 3: Phone & Address */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Phone Number
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.phone_number || ""}
                        onChange={(e) => handleInputChange("phone_number", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.phone_number || "—"}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Address
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.address || ""}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.address || "—"}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Row 4: City, Town, Postcode */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      City
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.city || ""}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.city || "—"}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Town
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.town || ""}
                        onChange={(e) => handleInputChange("town", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.town || "—"}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Postcode
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.postcode || ""}
                        onChange={(e) => handleInputChange("postcode", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.postcode || "—"}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Row 5: Country & SIC Code */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Country
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.country || ""}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.country || "—"}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      SIC Code
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editData.sic_code || ""}
                        onChange={(e) => handleInputChange("sic_code", e.target.value)}
                        fullWidth
                        disabled={editLoading}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {customer.sic_code || "—"}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Row 6: Opening Times */}
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Opening Times
                  </Typography>
                  {isEditing ? (
                    <TextField
                      size="small"
                      value={editData.opening_times || ""}
                      onChange={(e) => handleInputChange("opening_times", e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      disabled={editLoading}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                      {customer.opening_times || "—"}
                    </Typography>
                  )}
                </Box>

                {/* Row 7: Company Notes */}
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Company Notes
                  </Typography>
                  {isEditing ? (
                    <TextField
                      size="small"
                      value={editData.company_notes || ""}
                      onChange={(e) => handleInputChange("company_notes", e.target.value)}
                      fullWidth
                      multiline
                      rows={2}
                      disabled={editLoading}
                      sx={{ mt: 1 }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                      {customer.company_notes || "—"}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Assigned To
                  </Typography>
                  {isEditing ? (
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={editData.assigned_to || ""}
                      onChange={(e) => handleInputChange("assigned_to", e.target.value)}
                      sx={{ mt: 1 }}
                    >
                      <MenuItem value="">
                        <em>None (Unassigned)</em>
                      </MenuItem>
                      {users.map((u) => (
                        <MenuItem key={u.user_id} value={u.user_id}>
                          {u.first_name} {u.last_name} ({u.username})
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                      {customer.assigned_to_name || "Unassigned"}
                    </Typography>
                  )}
                </Box>
                <Divider />

                {/* Timestamps */}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Created At
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {new Date(customer.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Modified At
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {new Date(customer.modified_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Action Buttons */}
                {isEditing ? (
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button onClick={handleCancel} disabled={editLoading}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSave}
                      disabled={editLoading}
                      startIcon={editLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      {editLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleEdit}
                    >
                      Edit
                    </Button>
                  </Stack>
                )}
              </Stack>
            )}
          </div>

          <div role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && (
              <Box sx={{ py: 2 }}>
                <Typography variant="body1" color="text.secondary">No updates available.</Typography>
              </Box>
            )}
          </div>

          <div role="tabpanel" hidden={tabValue !== 2}>
            {tabValue === 2 && (
              <Box sx={{ py: 2 }}>
                <ReusableDataTable
                  data={customer.jobs || []}
                  allAvailableColumns={jobsColumns}
                  pageName="Customer Jobs"
                  idField="job_id"
                />
              </Box>
            )}
          </div>

          <div role="tabpanel" hidden={tabValue !== 3}>
            {tabValue === 3 && (
              <Box sx={{ py: 2 }}>
                <ReusableDataTable
                  data={customer.bins || []}
                  allAvailableColumns={binsColumns}
                  pageName="Customer Bins"
                  idField="bin_id"
                />
              </Box>
            )}
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}
