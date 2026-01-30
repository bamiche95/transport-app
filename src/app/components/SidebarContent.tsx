"use client";
import { useEffect, useState } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import { List, ListItem, ListItemButton, ListItemText, Typography, Divider, Box, Chip, Stack } from "@mui/material";
import { usePathname } from "next/navigation";
import { Filter } from "lucide-react";

export default function SidebarContent() {
  const { activeTable, savedFilters } = useFilterStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const applyFilter = (configJson: any) => {
    if (!activeTable) return;
    try {
      const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;

      // 1. Apply Filters
      activeTable.setColumnFilters(config.filters || []);

      // 2. Apply Visibility
      activeTable.setColumnVisibility(config.visibility || {});

      // 3. Apply Column Order (NEW)
      if (config.columnOrder && Array.isArray(config.columnOrder) && config.columnOrder.length > 0) {
        activeTable.setColumnOrder(config.columnOrder);
      } else {
        // Fallback: If no order is saved, reset to the original metadata order
        activeTable.resetColumnOrder();
      }
    } catch (e) {
      console.error("Failed to parse filter config", e);
    }
  };

  if (!mounted) return null;

  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography
          variant="subtitle2"
          color="textSecondary"
          sx={{
            fontWeight: 600,
            letterSpacing: '0.05em',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Filter size={14} /> Saved Views
        </Typography>
      </Box>

      <List disablePadding>
        {savedFilters && savedFilters.length > 0 ? (
          savedFilters.map((f, index) => (
            <ListItem key={f.filter_id ?? `filter-${index}`} disablePadding>
              <ListItemButton
                onClick={() => applyFilter(f.config_json)}
                sx={{
                  py: 1,
                  px: 3,
                  borderLeft: '3px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.02)',
                    borderLeftColor: '#e5e7eb'
                  }
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                  <ListItemText
                    primary={f.filter_name}
                    slotProps={{
                      primary: {
                        fontSize: '0.875rem',
                        fontWeight: f.is_default ? 600 : 400,
                        color: f.is_default ? 'text.primary' : 'text.secondary'
                      }
                    }}
                  />
                  {f.is_default === 1 && (
                    <Chip
                      label="Default"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <Typography variant="body2" sx={{ px: 3, pt: 1, color: 'text.disabled', fontStyle: 'italic', fontSize: '0.85rem' }}>
            No saved filters for this page
          </Typography>
        )}
      </List>

      <Divider sx={{ my: 2, mx: 2, opacity: 0.6 }} />

      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>
          Current Route
        </Typography>
        <Typography variant="caption" sx={{
          fontFamily: 'monospace',
          bgcolor: 'rgba(0,0,0,0.03)',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          display: 'block',
          wordBreak: 'break-all'
        }}>
          {pathname}
        </Typography>
      </Box>
    </Box>
  );
}