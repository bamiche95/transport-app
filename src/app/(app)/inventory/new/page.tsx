"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import { useRouter } from "next/navigation";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

type NewBinType = {
  bin_name: string;
};

export default function NewInventoryFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<NewBinType>({
    bin_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.bin_name.trim()) {
      setError("Bin Name is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/bintype", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bin type");
      }

      const result = await response.json();
      setSuccess(true);
      
      // Reset form
      setFormData({ bin_name: "" });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/inventory");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4 }}>
        Add New Inventory (Bin Type)
      </Typography>

      <Card sx={{ maxWidth: 600, mx: "auto" }}>
        <CardHeader
          title="New Bin Type Form"
          subheader="Enter details for the new inventory type"
          sx={{ bgcolor: "#f8fafc" }}
        />
        <CardContent>
          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Bin Type created successfully! Redirecting...
            </Alert>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Stack component="form" onSubmit={handleSubmit} spacing={3}>
                <TextField
                  fullWidth
                  label="Bin Name"
                  name="bin_name"
                  value={formData.bin_name}
                  onChange={handleChange}
                  placeholder="e.g., Standard 240L Bin"
                  variant="outlined"
                  required
                  disabled={loading}
                  autoFocus
                  helperText="Enter the name/description of the bin type"
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </Stack>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
