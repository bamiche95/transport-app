"use client";
import { useEffect, useState } from "react";
import { useFilterStore } from "@/store/useFilterStore";
import { List, ListItem, ListItemButton, ListItemText, Typography, Divider, Box, Chip, Stack } from "@mui/material";
import { usePathname } from "next/navigation";

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
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 'bold', px: 2 }}>
        SAVED VIEWS
      </Typography>
      
      <List dense>
        {savedFilters && savedFilters.length > 0 ? (
          savedFilters.map((f, index) => (
            <ListItem key={f.filter_id ?? `filter-${index}`} disablePadding>
              <ListItemButton 
                onClick={() => applyFilter(f.config_json)}
                sx={{ 
                  borderRadius: 1, 
                  mb: 0.5,
                  bgcolor: f.is_default ? 'rgba(25, 118, 210, 0.04)' : 'transparent' 
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                  <ListItemText 
                    primary={f.filter_name} 
                    slotProps={{ 
                      primary: { 
                        fontSize: '0.85rem',
                        fontWeight: f.is_default ? 700 : 500,
                        color: 'black' 
                      } 
                    }} 
                  />
                  {f.is_default === 1 && (
                    <Chip 
                      label="Default" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ height: 16, fontSize: '0.6rem', fontWeight: 'bold' }} 
                    />
                  )}
                </Stack>
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <Typography variant="body2" sx={{ px: 2, color: 'text.disabled', fontStyle: 'italic' }}>
            No saved filters for this page
          </Typography>
        )}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ px: 2 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          Current Page:
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {pathname}
        </Typography>
      </Box>
    </Box>
  );
}