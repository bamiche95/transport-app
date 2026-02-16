"use client";

import React, { useState, useEffect } from "react";
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel, Grid, Chip, CircularProgress, Alert
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Email as EmailIcon } from "@mui/icons-material";

interface EmailConfig {
  config_id?: number;
  config_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password?: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  smtp_secure: 'none' | 'ssl' | 'tls';
}

const INITIAL_FORM: EmailConfig = {
  config_name: "",
  smtp_host: "",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  from_email: "",
  from_name: "",
  is_active: true,
  is_default: false,
  smtp_secure: 'tls'
};

export default function EmailConfigPage() {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<EmailConfig>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
const [testing, setTesting] = useState(false);

const handleTestConnection = async () => {
  setTesting(true);
  try {
    const res = await fetch("/api/email-config/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Connection failed");
    
    alert("✅ Success: " + data.message);
  } catch (err: any) {
    alert("❌ Error: " + err.message);
  } finally {
    setTesting(false);
  }
};
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/email-config");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setConfigs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (config?: EmailConfig) => {
    if (config) {
      // For editing, we use the masked password if none is provided
      setFormData({ ...config, smtp_password: '********' });
    } else {
      setFormData(INITIAL_FORM);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    const isEdit = !!formData.config_id;
    const url = isEdit ? `/api/email-config/${formData.config_id}` : "/api/email-config";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      setOpen(false);
      fetchConfigs();
      handleTestConnection();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
    try {
      const res = await fetch(`/api/email-config/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      fetchConfigs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EmailIcon color="primary" /> Email Configurations
        </Typography>
        <Typography variant="body2" sx={{ color: '#ff0808ff' }}>
         ***Please contact the admin before making any changes as this could disrupt the system
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Config
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell><b>Config Name</b></TableCell>
              <TableCell><b>Host</b></TableCell>
              <TableCell><b>From Address</b></TableCell>
              <TableCell><b>Status</b></TableCell>
              <TableCell align="right"><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.map((row) => (
              <TableRow key={row.config_id}>
                <TableCell>
                  {row.config_name}
                  {row.is_default && <Chip label="Default" size="small" color="primary" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>{row.smtp_host}:{row.smtp_port}</TableCell>
                <TableCell>{row.from_email}</TableCell>
                <TableCell>
                  <Chip 
                    label={row.is_active ? "Active" : "Inactive"} 
                    color={row.is_active ? "success" : "default"} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(row)} color="info"><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(row.config_id!)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ADD/EDIT DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{formData.config_id ? "Edit Configuration" : "New Configuration"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth label="Configuration Name" 
                value={formData.config_name} 
                onChange={(e) => setFormData({...formData, config_name: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth label="SMTP Host" 
                value={formData.smtp_host} 
                onChange={(e) => setFormData({...formData, smtp_host: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth label="Port" type="number"
                value={formData.smtp_port} 
                onChange={(e) => setFormData({...formData, smtp_port: parseInt(e.target.value)})}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth label="SMTP Username" 
                value={formData.smtp_username} 
                onChange={(e) => setFormData({...formData, smtp_username: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth label="SMTP Password" type="password"
                placeholder="Enter new password or leave as ********"
                value={formData.smtp_password} 
                onChange={(e) => setFormData({...formData, smtp_password: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth label="From Email" 
                value={formData.from_email} 
                onChange={(e) => setFormData({...formData, from_email: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField 
                fullWidth label="From Name" 
                value={formData.from_name} 
                onChange={(e) => setFormData({...formData, from_name: e.target.value})}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
               <FormControlLabel
                control={<Switch checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} />}
                label="Is Active"
              />
              <FormControlLabel
                control={<Switch checked={formData.is_default} onChange={(e) => setFormData({...formData, is_default: e.target.checked})} />}
                label="Set as Default"
              />
            </Grid>
          </Grid>
        </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
  <Button 
    color="secondary" 
    onClick={handleTestConnection} 
    disabled={testing || submitting}
  >
    {testing ? "Testing..." : "Test Connection"}
  </Button>
  <Box>
    <Button onClick={() => setOpen(false)} sx={{ mr: 1 }}>Cancel</Button>
    <Button onClick={handleSave} variant="contained" disabled={submitting || testing}>
      {submitting ? "Saving..." : "Save Configuration"}
    </Button>
  </Box>
</DialogActions>
      </Dialog>
    </Box>
  );
}