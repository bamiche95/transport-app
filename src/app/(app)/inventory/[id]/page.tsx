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
  Tabs,
  Tab,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReusableDataTable from "@/app/components/ReusableDataTable";
import { createColumnHelper } from "@tanstack/react-table";

type BinTypeDetail = {
  bin_type_id: number;
  bin_name: string;
  created_by: number | null;
  modified_by: number | null;
  created_at: string;
  modified_at: string;
};

type BinData = {
  bin_id: number;
  bin_number: string;
  bin_description: string;
  bin_type: string;
  customer_name: string | null;
  company_name: string;
  printed: number;
  modified_at: string;
  condition: string;
  bin_status: string;
};

const binColumnHelper = createColumnHelper<BinData>();

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [binType, setBinType] = useState<BinTypeDetail | null>(null);
  const [bins, setBins] = useState<BinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [binsLoading, setBinsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editBinName, setEditBinName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchBinType = async () => {
      try {
        const response = await fetch(`/api/bintype/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch bin type");
        }
        const data = await response.json();
        setBinType(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBinType();
    }
  }, [id]);

  // Fetch bins when Bins tab is clicked
  useEffect(() => {
    if (tabValue === 2 && bins.length === 0) {
      const fetchBins = async () => {
        setBinsLoading(true);
        try {
          const response = await fetch(`/api/bintype/${id}/bins`);
          if (!response.ok) {
            throw new Error("Failed to fetch bins");
          }
          const data = await response.json();
          setBins(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
          setBinsLoading(false);
        }
      };

      fetchBins();
    }
  }, [tabValue, id, bins.length]);

  // Define columns for bins table
  const binsColumns = React.useMemo(
    () => [
      binColumnHelper.accessor("bin_number", {
        header: "Bin Number",
        cell: (info) => info.getValue() || "—",
      }),
      binColumnHelper.accessor("bin_description", {
        header: "Description",
        cell: (info) => info.getValue() || "—",
      }),
      binColumnHelper.accessor("bin_type", {
        header: "Bin Type",
        cell: (info) => info.getValue() || "—",
      }),
      binColumnHelper.accessor("customer_name", {
        header: "Customer",
        cell: (info) => info.getValue() || "—",
      }),
      binColumnHelper.accessor("company_name", {
        header: "Company",
        cell: (info) => info.getValue() || "—",
      }),
      binColumnHelper.accessor("printed", {
        header: "Label Printed",
        cell: (info) => (Number(info.getValue()) === 1 ? "✅ Yes" : "❌ No"),
      }),
      binColumnHelper.accessor("condition", {
        header: "Condition",
        cell: (info) => info.getValue() || "—",
      }),
      binColumnHelper.accessor("modified_at", {
        header: "Modified At",
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      binColumnHelper.accessor("bin_status", {
        header: "Status",
        cell: (info) => info.getValue() || "—",
      }),
    ],
    []
  );

  const handleEdit = () => {
    setEditBinName(binType?.bin_name || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editBinName.trim()) {
      setError("Bin Name cannot be empty");
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`/api/bintype/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bin_name: editBinName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bin type");
      }

      // Update local state
      if (binType) {
        setBinType({ ...binType, bin_name: editBinName });
      }
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditBinName("");
  };

  const handleDeleteConfirm = async () => {
    if (!confirm("Are you sure you want to delete this bin type?")) return;

    try {
      const response = await fetch(`/api/bintype/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bin type");
      }

      router.push("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit_old = () => {
    router.push(`/inventory/${id}/edit`);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !binType) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!binType) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Bin type not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
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
          Inventory Detail
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Back
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Card with Tabs */}
      <Card>
        <CardHeader
          title={binType.bin_name}
          subheader={`ID: ${binType.bin_type_id}`}
          sx={{ bgcolor: "#f8fafc" }}
        />

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Details" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Updates" id="tab-1" aria-controls="tabpanel-1" />
            <Tab label={`Bins (${bins.length})`} id="tab-2" aria-controls="tabpanel-2" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Details Tab */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Bin Name
                  </Typography>
                  {isEditing ? (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mt: 1 }}>
                      <TextField
                        size="small"
                        value={editBinName}
                        onChange={(e) => setEditBinName(e.target.value)}
                        fullWidth
                        disabled={editLoading}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={handleSaveEdit}
                        disabled={editLoading}
                        sx={{ mt: 0.5, minWidth: 40 }}
                      >
                        {editLoading ? <CircularProgress size={20} /> : "✓"}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={handleCancelEdit}
                        disabled={editLoading}
                        sx={{ mt: 0.5, minWidth: 40 }}
                      >
                        ✕
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {binType.bin_name}
                      </Typography>
                      <Button
                        size="small"
                        onClick={handleEdit}
                        sx={{ mt: 1, color: "#1976d2" }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Bin Type ID
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                    {binType.bin_type_id}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Created At
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {new Date(binType.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    By User ID: {binType.created_by !== null ? binType.created_by : "System"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    Modified At
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {new Date(binType.modified_at).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    By User ID: {binType.modified_by !== null ? binType.modified_by : "System"}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </TabPanel>

          {/* Updates Tab */}
          <TabPanel value={tabValue} index={1}>
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Modification History
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Created:</strong> {new Date(binType.created_at).toLocaleString()}
                  {binType.created_by && ` by User ${binType.created_by}`}
                </Typography>
                <Typography variant="body2">
                  <strong>Last Modified:</strong> {new Date(binType.modified_at).toLocaleString()}
                  {binType.modified_by && ` by User ${binType.modified_by}`}
                </Typography>
              </Box>
            </Stack>
          </TabPanel>

          {/* Bins Tab */}
          <TabPanel value={tabValue} index={2}>
            {binsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : bins.length === 0 ? (
              <Alert severity="info">No bins found for this inventory type</Alert>
            ) : (
              <ReusableDataTable
                data={bins}
                allAvailableColumns={binsColumns}
                pageName="bins"
                detailPagePath="/bins/[id]"
                idField="bin_id"
              />
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteConfirm}
        >
          Delete
        </Button>
      </Stack>
    </Box>
  );
}
