"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Slide,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

import type { User } from "../types/user";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface Props {
  user?: User | null;
  onUserSaved?: () => void;
}

export default function UserFormDialog({ user, onUserSaved }: Props) {
  const isEditMode = Boolean(user);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [roles, setRoles] = React.useState<string[]>([]);

  const [form, setForm] = React.useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    role: "Driver", // must match ENUM
  });



  // 🔄 Prefill form when editing
  React.useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        password: "", // never prefill password
        role: user.role,
      });
    }
  }, [user]);

  React.useEffect(() => {
    async function fetchRoles() {
      const res = await fetch("/api/roles");
      if (!res.ok) return;

      const data = await res.json();
      setRoles(data.roles || []);
    }

    fetchRoles();
  }, []);




  const handleOpen = () => setOpen(true);
  const handleClose = () => !loading && setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = isEditMode
      ? `/api/users/${user!.user_id}`
      : "/api/users";

    const method = isEditMode ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed");
        return;
      }

      alert(isEditMode ? "User updated" : "User created");
      handleClose();
      onUserSaved?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={isEditMode ? "text" : "contained"}
        onClick={handleOpen}
      >
        {isEditMode ? "Edit" : "Add User"}
      </Button>

      <Dialog open={open} slots={{
        transition: Transition,
      }}
      >
        <DialogTitle>
          {isEditMode ? "Edit User" : "Add New User"}
        </DialogTitle>

        <DialogContent>
          <form id="user-form" onSubmit={handleSubmit}>
            <TextField
              name="first_name"
              label="First name"
              value={form.first_name}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
            />

            <TextField
              name="last_name"
              label="Last name"
              value={form.last_name}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
            />

            <TextField
              name="username"
              label="Username"
              value={form.username}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              disabled={isEditMode} // usually immutable
            />

            <TextField
              name="email"
              label="Email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
            />

            <TextField
              name="password"
              label={isEditMode ? "Change Password" : "Password"}
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required={!isEditMode}
              helperText={isEditMode ? "Leave blank to keep current password" : ""}
            />

            <TextField
              select
              name="role"
              label="Role"
              value={form.role}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
            >
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

          </form>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            form="user-form"
            variant="contained"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
