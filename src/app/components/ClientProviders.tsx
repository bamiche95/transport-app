"use client";

import { ReactNode } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ThemeWrapper from "./ThemeWrapper";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeWrapper >
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {children}
         <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />
      </LocalizationProvider>
    </ThemeWrapper>
  );
}
