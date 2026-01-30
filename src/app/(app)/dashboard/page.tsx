"use client";

import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
    Card, CardContent, Typography, Grid, Box, CircularProgress,
    Paper, Divider
} from '@mui/material';
import {
    Briefcase, Trash2, TrendingUp, Activity, CheckCircle, AlertCircle
} from 'lucide-react';

// --- Types ---
interface JobStatusMetric {
    job_status_name: string;
    count: number;
}

interface JobPriorityMetric {
    priority: string | number;
    count: number;
}

interface BinMetrics {
    total: number;
    moved: number;
    idle: number;
}

interface DashboardMetrics {
    jobsByStatus: JobStatusMetric[];
    jobsByPriority: JobPriorityMetric[];
    binMetrics: BinMetrics;
}

// --- Colors ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const PRIORITY_COLORS: Record<string, string> = {
    'High': '#ef4444',
    'Medium': '#f59e0b',
    'Low': '#10b981',
    'Normal': '#3b82f6'
};

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/dashboard/metrics');
                if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
                const data = await res.json();
                setMetrics(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Typography color="error">Error loading dashboard: {error}</Typography>
            </Box>
        );
    }

    if (!metrics) return null;

    // Process Data for Charts
    const jobStatusData = metrics.jobsByStatus.map(item => ({
        name: item.job_status_name,
        value: item.count
    }));

    const binActivityData = [
        { name: 'Moved (30d)', value: metrics.binMetrics.moved, fill: '#10b981' },
        { name: 'Idle', value: metrics.binMetrics.idle, fill: '#ef4444' }
    ];

    const jobPriorityData = metrics.jobsByPriority.map(item => ({
        name: `Priority ${item.priority}`,
        priority_key: String(item.priority),
        value: item.count
    }));

    // Calculate Totals for Summary Cards
    const totalJobs = metrics.jobsByStatus.reduce((acc, curr) => acc + curr.count, 0);
    const completedJobs = metrics.jobsByStatus.find(j => j.job_status_name === 'Completed')?.count || 0;



    return (
        <Box p={3} sx={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" gutterBottom color="textPrimary">
                    Dashboard
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    Overview of operations and assets
                </Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Total Jobs"
                        value={totalJobs}
                        icon={<Briefcase size={24} color="white" />}
                        color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Completed Jobs"
                        value={completedJobs}
                        icon={<CheckCircle size={24} color="white" />}
                        color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Total Bins"
                        value={metrics.binMetrics.total}
                        icon={<Trash2 size={24} color="white" />}
                        color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <SummaryCard
                        title="Active Bins (30d)"
                        value={metrics.binMetrics.moved}
                        icon={<Activity size={24} color="white" />}
                        color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                    />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                {/* Job Status Chart */}
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" fontWeight="600" mb={2}>
                            Job Status Distribution
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={jobStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {jobStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Bin Activity Chart */}
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" fontWeight="600" mb={2}>
                            Bin Utilization
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={binActivityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {binActivityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Job Priority Chart */}
                <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" fontWeight="600" mb={2}>
                            Jobs by Priority
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={jobPriorityData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={80} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {jobPriorityData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={PRIORITY_COLORS[entry.priority_key] || '#3b82f6'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

// Sub-component for summary cards
function SummaryCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                background: color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
        >
            <Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                    {value}
                </Typography>
            </Box>
            <Box sx={{
                p: 1.5,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)'
            }}>
                {icon}
            </Box>
        </Paper>
    )
}