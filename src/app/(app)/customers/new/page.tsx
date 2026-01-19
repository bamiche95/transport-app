"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  Stack,
  MenuItem,
  Divider,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";

interface Company {
  company_id: number;
  company_name: string;
}

interface User {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface FormData {
  customer_name: string;
  company_id: string;
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
  assigned_to: string;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<FormData>({
    customer_name: "",
    company_id: "",
    contact_name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    town: "",
    postcode: "",
    country: "",
    opening_times: "",
    sic_code: "",
    company_notes: "",
    assigned_to: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [companiesRes, usersRes] = await Promise.all([
          fetch("/api/company"),
          fetch("/api/users"),
        ]);

        if (!companiesRes.ok || !usersRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const companiesData = await companiesRes.json();
        const usersData = await usersRes.json();

        setCompanies(Array.isArray(companiesData) ? companiesData : companiesData.data || []);
        
        // Handle different user response formats
        let usersList = [];
        if (Array.isArray(usersData)) {
          usersList = usersData;
        } else if (usersData.data && Array.isArray(usersData.data)) {
          usersList = usersData.data;
        } else if (usersData.users && Array.isArray(usersData.users)) {
          usersList = usersData.users;
        }
        setUsers(usersList);
      
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.customer_name.trim()) {
      setError("Customer Name is required");
      return;
    }

    if (!formData.company_id) {
      setError("Company is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          company_id: Number(formData.company_id),
          contact_name: formData.contact_name || null,
          email: formData.email,
          phone_number: formData.phone_number || null,
          address: formData.address || null,
          city: formData.city || null,
          town: formData.town || null,
          postcode: formData.postcode || null,
          country: formData.country || null,
          opening_times: formData.opening_times || null,
          sic_code: formData.sic_code || null,
          company_notes: formData.company_notes || null,
          assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create customer");
      }

      const data = await response.json();
      
      // Show success toast and redirect
      setSuccess("Customer created successfully!");
      setTimeout(() => {
        router.push("/customers");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Add New Customer
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()} variant="outlined">
          Back
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader title="Customer Details" sx={{ bgcolor: "#f8fafc" }} />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Row 1: Customer Name & Email */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Customer Name *"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  disabled={submitting}
                />
                <TextField
                  label="Email *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  disabled={submitting}
                />
              </Box>

              {/* Row 2: Company & Contact Name */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  select
                  label="Company *"
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  disabled={submitting}
                >
                  <MenuItem value="">
                    <em>Select a company</em>
                  </MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.company_id} value={company.company_id}>
                      {company.company_name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Contact Name"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={submitting}
                />
              </Box>

              {/* Row 3: Phone & Address */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={submitting}
                />
                <TextField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={submitting}
                />
              </Box>

              {/* Row 4: City, Town, Postcode */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                <TextField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={submitting}
                />
                <TextField
                  label="Town"
                  name="town"
                  value={formData.town}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={submitting}
                />
                <TextField
                  label="Postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={submitting}
                />
              </Box>

              {/* Row 5: Country & SIC Code */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={submitting}
                />
                <TextField
                  label="SIC Code"
                  name="sic_code"
                  value={formData.sic_code}
                  onChange={handleInputChange}
                  fullWidth
                  disabled={submitting}
                />
              </Box>

              {/* Row 6: Opening Times */}
              <TextField
                label="Opening Times"
                name="opening_times"
                value={formData.opening_times}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={submitting}
              />

              {/* Row 7: Company Notes */}
              <TextField
                label="Company Notes"
                name="company_notes"
                value={formData.company_notes}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={submitting}
              />

              {/* Row 8: Assigned To */}
              <TextField
                select
                label="Assigned To"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleInputChange}
                fullWidth
                disabled={submitting}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.user_id} value={user.user_id}>
                    {user.first_name} {user.last_name}
                  </MenuItem>
                ))}
              </TextField>

              <Divider />

              {/* Action Buttons */}
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Customer"}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Success Toast */}
      <Snackbar
        open={!!success}
        autoHideDuration={2000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
