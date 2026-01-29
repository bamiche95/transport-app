import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { alpha } from '@mui/material/styles';

type Anchor = 'top' | 'left' | 'bottom' | 'right';

interface DetailQuickViewProps {
    data: any;
}

export default function DetailQuickView({ data }: DetailQuickViewProps) {
    const [state, setState] = React.useState({
        top: false,
        left: false,
        bottom: false,
        right: false,
    });

    const toggleDrawer =
        (anchor: Anchor, open: boolean) =>
            (event: React.KeyboardEvent | React.MouseEvent) => {
                if (
                    event.type === 'keydown' &&
                    ((event as React.KeyboardEvent).key === 'Tab' ||
                        (event as React.KeyboardEvent).key === 'Shift')
                ) {
                    return;
                }
                setState({ ...state, [anchor]: open });
            };

    const formatLabel = (key: string) => {
        return key
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Map ID fields to their corresponding label/name fields
    const idToLabelMap: Record<string, string> = {
        job_status_id: 'status',
        bin_type_id: 'bin_name',
        job_type_id: 'job_type_name',
        waste_type_id: 'waste_type_name',
        assigned_to: 'assigned_to_label',
        customer_id: 'customer_name',
        company_id: 'company_name',
        bin_id: 'bin_name',
        bin_status_id: 'bin_status_label',
    };

    // Fields to completely hide
    const fieldsToHide = new Set([
        'created_by',
        'modified_by',
        'created_at',
        'modified_at',
        'job_id',
        'customer_id',
        'bin_type_id',
        'company_id',
        'job_type_id',
        'waste_type_id',
        'job_status_id',
        'assigned_to',
        'bin_status_id',
        'booking_portal_id',
    ]);

    // Define the order you want fields to appear
    const fieldOrder: Record<string, number> = {
        customer_name: 1,
        bin_name: 2,
        waste_type_name: 3,
        contact_name: 16,
        phone_number:8,
        address: 5,
        postcode: 6,
        city: 7,
        town: 8,
        status: 9,
       
        company_name: 10,
        job_type_name: 4,
        priority: 11,
        qty: 12,
        company_notes: 13,
        office_notes: 14,
        jobs_notes: 2,
        comment: 17,
        bin_condition: 18,
        assigned_to_label: 19,
        adr: 20,
        lug_lock: 21,
        sic_code: 22,
        opening_times: 23,
       
        // Fields not listed will appear at the end in alphabetical order
    };

    const formatValue = (value: any): string => {
        if (value === null || value === undefined || value === '') {
            return '—';
        }

        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        if (value instanceof Date) {
            return value.toLocaleString();
        }

        // Handle ISO date strings
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            return new Date(value).toLocaleString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        return String(value);
    };

    const getDisplayValue = (key: string, value: any): string => {
        // Check if this ID field has a corresponding label field
        if (idToLabelMap[key] && data[idToLabelMap[key]]) {
            return formatValue(data[idToLabelMap[key]]);
        }
        return formatValue(value);
    };

    const filteredData = Object.entries(data)
        .filter(([key]) => !fieldsToHide.has(key))
        .filter(([, value]) => !(typeof value === 'object' && value !== null))
        .map(([key, value]) => ({
            key,
            label: formatLabel(key),
            value: getDisplayValue(key, value),
        }))
        .sort((a, b) => {
            const orderA = fieldOrder[a.key] ?? 999;
            const orderB = fieldOrder[b.key] ?? 999;
            return orderA - orderB;
        });

    const list = (anchor: Anchor) => (
        <Box
            sx={{
                width: anchor === 'top' || anchor === 'bottom' ? 'auto' : 800,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            }}
            role="presentation"
            onClick={toggleDrawer(anchor, false)}
            onKeyDown={toggleDrawer(anchor, false)}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 3,
                    background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.85)} 100%)`,
                    color: 'white',
                    borderBottom: (theme) => `1px solid ${alpha(theme.palette.primary.dark, 0.3)}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <VisibilityIcon sx={{ fontSize: 24, opacity: 0.9 }} />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            fontSize: '1.1rem',
                        }}
                    >
                        Quick View
                    </Typography>
                </Box>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List sx={{ py: 0 }}>
                    {filteredData.length > 0 ? (
                        filteredData.map(({ key, label, value }, index) => (
                            <React.Fragment key={key}>
                                <ListItem
                                    disablePadding
                                    sx={{
                                        '&:hover': {
                                            background: (theme) => alpha(theme.palette.primary.main, 0.06),
                                            transition: 'background-color 0.2s ease-in-out',
                                        },
                                        transition: 'background-color 0.2s ease-in-out',
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: (theme) => theme.palette.text.primary,
                                                    fontSize: '0.85rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.3px',
                                                    opacity: 0.75,
                                                }}
                                            >
                                                {label}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontWeight: 500,
                                                    color: (theme) => theme.palette.text.primary,
                                                    fontSize: '0.95rem',
                                                    mt: 0.5,
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {value}
                                            </Typography>
                                        }
                                        sx={{
                                            px: 3,
                                            py: 2,
                                        }}
                                    />
                                </ListItem>
                                {index < filteredData.length - 1 && <Divider sx={{ my: 0, opacity: 0.5 }} />}
                            </React.Fragment>
                        ))
                    ) : (
                        <ListItem>
                            <ListItemText
                                primary={
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: (theme) => alpha(theme.palette.text.primary, 0.5),
                                            textAlign: 'center',
                                            py: 2,
                                        }}
                                    >
                                        No data to display
                                    </Typography>
                                }
                            />
                        </ListItem>
                    )}
                </List>
            </Box>

            {/* Footer */}
            <Divider />
            <Box
                sx={{
                    p: 2,
                    textAlign: 'center',
                    background: (theme) => alpha(theme.palette.primary.main, 0.02),
                    borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: (theme) => alpha(theme.palette.text.primary, 0.6),
                        fontSize: '0.75rem',
                        letterSpacing: '0.3px',
                    }}
                >
                    {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <div onClick={(e) => e.stopPropagation()}>
            {(['right'] as const).map((anchor) => (
                <React.Fragment key={anchor}>
                    <IconButton
                        size="medium"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleDrawer(anchor, true)(e);
                        }}
                        sx={{
                            color: (theme) => theme.palette.primary.main,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                background: (theme) => alpha(theme.palette.primary.main, 0.1),
                                transform: 'scale(1.12) rotate(8deg)',
                            },
                            '&:active': {
                                transform: 'scale(0.95)',
                            },
                        }}
                    >
                        <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <Drawer
                        anchor={anchor}
                        open={state[anchor]}
                        onClose={(e: React.KeyboardEvent | React.MouseEvent) => toggleDrawer(anchor, false)(e)}
                        sx={{
                            '& .MuiDrawer-paper': {
                                background: (theme) => theme.palette.background.paper,
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                                animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '@keyframes slideInRight': {
                                    from: {
                                        transform: 'translateX(100%)',
                                        opacity: 0,
                                    },
                                    to: {
                                        transform: 'translateX(0)',
                                        opacity: 1,
                                    },
                                },
                            },
                       
                        }}
                    >
                        {list(anchor)}
                    </Drawer>
                </React.Fragment>
            ))}
        </div>
    );
}