"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  IconButton,
  Button,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Container,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

type Recipient = {
  recipient_id: number;
  name: string;
  email: string;
};

export default function WTNRecipientsTable() {
  const [items, setItems] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error' | 'info'>('info');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/wtn-recipients");
      const data = await res.json();
      setItems(data || []);
    } catch (e) {
      console.error(e);
      setSnackMsg("Failed to load recipients");
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function showMessage(msg: string, severity: 'success' | 'error' | 'info' = 'success') {
    setSnackMsg(msg);
    setSnackSeverity(severity);
    setSnackOpen(true);
  }

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newName || !newEmail) {
      showMessage('Name and email are required', 'error');
      return;
    }
    try {
      const res = await fetch("/api/wtn-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail }),
      });
      if (res.ok) {
        setNewName("");
        setNewEmail("");
        await load();
        showMessage('Recipient added', 'success');
      } else {
        const err = await res.json();
        showMessage(err?.error || "Failed to add", 'error');
      }
    } catch (err) {
      console.error(err);
      showMessage('Failed to add recipient', 'error');
    }
  }

  function startEdit(r: Recipient) {
    setEditingId(r.recipient_id);
    setEditName(r.name);
    setEditEmail(r.email);
  }

  async function saveEdit(id: number) {
    if (!editName || !editEmail) {
      showMessage('Name and email are required', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/wtn-recipients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      if (res.ok) {
        setEditingId(null);
        await load();
        showMessage('Recipient updated', 'success');
      } else {
        const err = await res.json();
        showMessage(err?.error || "Failed to update", 'error');
      }
    } catch (err) {
      console.error(err);
      showMessage('Failed to update recipient', 'error');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this recipient?")) return;
    try {
      const res = await fetch(`/api/wtn-recipients/${id}`, { method: "DELETE" });
      if (res.ok) {
        await load();
        showMessage('Recipient deleted', 'success');
      } else {
        const err = await res.json();
        showMessage(err?.error || "Failed to delete", 'error');
      }
    } catch (err) {
      console.error(err);
      showMessage('Failed to delete recipient', 'error');
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ p: 3 }} elevation={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">WTN Email Recipients</Typography>
        </Stack>
                    <Typography variant="body2" color="textSecondary">These recipients will receive Waste Transfer Note PDF by email</Typography>


        <Box component="form" onSubmit={handleAdd} sx={{ mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Name"
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              size="small"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
            />
            <Button type="submit" variant="contained" color="primary">Add</Button>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.recipient_id}>
                  <TableCell sx={{ minWidth: 200 }}>
                    {editingId === r.recipient_id ? (
                      <TextField size="small" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
                    ) : (
                      r.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === r.recipient_id ? (
                      <TextField size="small" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} fullWidth />
                    ) : (
                      r.email
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === r.recipient_id ? (
                      <>
                        <IconButton size="small" color="primary" onClick={() => saveEdit(r.recipient_id)} title="Save">
                          <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setEditingId(null)} title="Cancel">
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton size="small" onClick={() => startEdit(r)} title="Edit">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(r.recipient_id)} color="error" title="Delete">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 4, textAlign: 'center' }}>
                    No recipients yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}>
          <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
            {snackMsg}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}
