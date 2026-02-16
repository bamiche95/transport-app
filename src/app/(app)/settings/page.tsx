'use client'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid'; // Using MUI V5/V6 Grid2 for better spacing
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Link from 'next/link';
import { 
  Settings, 
  Palette, 
  Mail, 
  Building2, 
  Users, 
  ClipboardList 
} from 'lucide-react'; // Modern icons

const SETTINGS_LINKS = [
  { title: "Report Settings", href: "/reports", icon: <Settings size={28} />, desc: "Configure report delivery & schedules" },
  { title: "Color Schemes", href: "/color-schemes", icon: <Palette size={28} />, desc: "Manage job status colors" },
  { title: "Email Config", href: "/email-config", icon: <Mail size={28} />, desc: "SMTP and notification settings" },
  { title: "Companies", href: "/companies", icon: <Building2 size={28} />, desc: "Manage client & partner companies" },
  { title: "User Management", href: "/users", icon: <Users size={28} />, desc: "Control access and permissions" },
  { title: "WTN", href: "/email-recipients", icon: <ClipboardList size={28} />, desc: "Manage WTN recipients and settings" },
];

export default function SettingsPage() {
  return (
    <Box sx={{ flexGrow: 1, padding: 4, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1e293b' }}>
        System Settings
      </Typography>
   <Typography sx={{ mb: 4, fontWeight: 'normal', color: '#a3a3a3ff' }}>
      Please before making any changes, always ask the Admin
      </Typography>
      <Grid container spacing={3}>
        {SETTINGS_LINKS.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.href}>
            <Link href={item.href} style={{ textDecoration: 'none' }}>
              <Card 
                elevation={0} 
                sx={{ 
                  border: '1px solid #e2e8f0',
                  borderRadius: 3,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    borderColor: '#3b82f6'
                  }
                }}
              >
                <CardActionArea sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: '#eff6ff', 
                    color: '#2563eb',
                    display: 'flex'
                  }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}