"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Box,
  Avatar,
  Chip,
  InputAdornment,
  IconButton,
  Stack,
  alpha
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface Job {
  job_id: number;
  company_name: string;
  job_status_name: string;
  priority: number;
  driver_id: number | null;
  driver_name: string | null;
  customer_name: string | null;
}

interface DriverJobs {
  driverId: number | null;
  driverName: string;
  jobs: Job[];
}

interface DriverJobsTableProps {
  data: DriverJobs[];
}

// Map status names to MUI Chip colors/styles
const getStatusStyles = (status: string) => {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  switch (normalized) {
    case 'completed': return { color: 'success' as const, label: status };
    case 'in_progress': return { color: 'primary' as const, label: status };
    case 'cancelled': return { color: 'default' as const, label: status };
    default: return { color: 'warning' as const, label: status };
  }
};

const getPriorityColor = (priority: number): string => {
  if (priority >= 8) return "#d32f2f"; // error.main
  if (priority >= 5) return "#ed6c02"; // warning.main
  return "#fbc02d"; // custom yellow
};

export default function DriverJobsTable({ data }: DriverJobsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((driver) =>
    driver.driverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxJobs = Math.max(...filteredData.map((d) => d.jobs.length), 0);

  if (!filteredData.length) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
        <Typography variant="h1" sx={{ mb: 2 }}>📭</Typography>
        <Typography variant="h5" color="textSecondary" gutterBottom>
          {searchQuery ? `No drivers found matching "${searchQuery}"` : "No jobs found"}
        </Typography>
        {searchQuery && (
          <Chip 
            label="Clear search" 
            onClick={() => setSearchQuery("")} 
            sx={{ mt: 2, cursor: 'pointer' }} 
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="300" color="textPrimary">
            Driver Jobs
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {filteredData.length} of {data.length} drivers • {filteredData.reduce((acc, d) => acc + d.jobs.length, 0)} jobs total
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search drivers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 320, bgcolor: 'white' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="disabled" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Stack>

      {/* Table Container */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1e293b' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Driver</TableCell>
              {Array.from({ length: maxJobs }).map((_, i) => (
                <TableCell key={i} sx={{ color: alpha('#fff', 0.8), fontWeight: 'bold' }}>
                  JOB {i + 1}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((driver, index) => (
              <TableRow 
                key={driver.driverId} 
                sx={{ 
                  bgcolor: index % 2 === 0 ? 'white' : '#f8fafc',
                  '&:hover': { bgcolor: '#f1f5f9' }
                }}
              >
                {/* Driver Cell - Sticky */}
                <TableCell 
                  sx={{ 
                    position: 'sticky', 
                    left: 0, 
                    bgcolor: 'inherit', 
                    zIndex: 1,
                    borderRight: '1px solid #e2e8f0'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                      {driver.driverName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" noWrap sx={{ width: 120 }}>
                        {driver.driverName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {driver.jobs.length} jobs
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                {/* Job Cells */}
                {Array.from({ length: maxJobs }).map((_, jobIdx) => {
                  const job = driver.jobs[jobIdx];
                  const statusInfo = job ? getStatusStyles(job.job_status_name) : null;

                  return (
                    <TableCell key={jobIdx} sx={{ verticalAlign: 'top', minWidth: 200 }}>
                      {job ? (
                        <Stack spacing={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>
                              {job.customer_name || "—"}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {job.company_name}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            <Chip 
                              label={statusInfo?.label} 
                              color={statusInfo?.color} 
                              size="small" 
                              variant="filled" 
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: getPriorityColor(job.priority), 
                                fontWeight: 'bold',
                                alignSelf: 'center',
                                ml: 1
                              }}
                            >
                              P: {job.priority}
                            </Typography>
                          </Stack>
                          
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                            #{job.job_id}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, px: 1 }}>
        <Typography variant="caption" color="textSecondary">
          Showing {filteredData.length} drivers with up to {maxJobs} jobs each
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Stack>
    </Box>
  );
}