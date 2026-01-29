import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import { ToastContainer } from "react-toastify";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "RML Transport Solutions LTD",
  description: "RML Transport Solutions LTD is a leading provider of transportation and logistics services.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="antialiased text-slate-900 bg-white">
        <ClientProviders>
          {children}
          
        </ClientProviders>
      </body>
    </html>
  );
}
