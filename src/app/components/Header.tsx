"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Stack,
} from "@mui/material";

import {
  Bell,
  UsersRound,
  LogOut,
  User,
  Settings,
} from "lucide-react";

import MenuSidebar from "./MenuSidebar";

export default function Header({ user }: { user: any }) {
  const router = useRouter();
  const pathname = usePathname();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const navLinks = [
    { name: "Jobs", href: "/jobs" },
    { name: "Customers", href: "/customers" },
    { name: "Bins", href: "/bins" },
    { name: "Inventory", href: "/inventory" },
    { name: "Driver Jobs", href: "/driver-jobs" },
  ];

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        setAnchorEl(null);
        router.push("/");
      }
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
  
    <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}  >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        
        {/* LEFT SIDE */}
        <Stack direction="row"  alignItems="center" spacing={{ xs: 2, sm: 3, md: 12 }}>
          
          <IconButton edge="start">
            <MenuSidebar />
          </IconButton>

          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "success.main" }}
            >
              RML Transport
            </Typography>
          </Link>

          {/* Navigation */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);

              return (
                <Button
                  key={link.name}
                  component={Link}
                  href={link.href}
                  variant={isActive ? "contained" : "text"}
                  color={isActive ? "success" : "inherit"}
                  sx={{ textTransform: "none" }}
                >
                  {link.name}
                </Button>
              );
            })}
          </Stack>
        </Stack>

        {/* RIGHT SIDE */}
        <Stack direction="row" spacing={2} alignItems="center">

          {/* Notifications */}
          <IconButton>
            <Badge color="error" variant="dot">
              <Bell size={20} />
            </Badge>
          </IconButton>

          <Divider orientation="vertical" flexItem />

          {/* User Menu */}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ bgcolor: "success.light", color: "success.dark" }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">
                {user?.name || "User"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>

            <Divider />

            <MenuItem component={Link} href="/profile">
              <User size={16} style={{ marginRight: 8 }} />
              Profile
            </MenuItem>

            <MenuItem component={Link} href="/settings">
              <Settings size={16} style={{ marginRight: 8 }} />
              Settings
            </MenuItem>

            <MenuItem component={Link} href="/users">
              <UsersRound size={16} style={{ marginRight: 8 }} />
              Manage Users
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <LogOut size={16} style={{ marginRight: 8 }} />
              Sign out
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
