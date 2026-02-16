// src/app/(app)/layout.tsx

import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SidebarContent from "@/app/components/SidebarContent";
import { getUserFromJWT } from "@/lib/auth";
import { redirect } from "next/navigation";

import { Box, Drawer, Toolbar } from "@mui/material";

const drawerWidth = 240;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromJWT();

  if (!user) redirect("/");

  if (user.role === "Driver") {
    redirect("/driver-not-supported");
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
      suppressHydrationWarning
    >
      {/* HEADER */}
      <Header user={user} />

      {/* MAIN AREA */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* SIDEBAR */}
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          <Toolbar />
          <SidebarContent />
        </Drawer>

        {/* PAGE CONTENT */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0, // critical for table scrolling
            p: 3,
            overflowY: "auto",
          }}
        >
          <Toolbar /> {/* pushes content below AppBar */}
          {children}
        </Box>
      </Box>

      {/* FOOTER */}
      <Footer />
    </Box>
  );
}
