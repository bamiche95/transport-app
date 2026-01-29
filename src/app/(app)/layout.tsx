// src\app\(app)\layout.tsx
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { getUserFromJWT } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarContent from "@/app/components/SidebarContent";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromJWT();

  if (!user) {
    redirect("/");
  }

  if (user.role === "Driver") {
    redirect("/driver-not-supported");
  }

  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning> {/* Ensure full height container */}
      <Header user={user} />

      {/* 1. Removed max-w-screeen (typo). 
          2. added w-full to ensure it doesn't exceed the viewport.
      */}
      <main className="flex flex-1 w-full overflow-hidden"> 
        
        {/* Sidebar: Use fixed width so it doesn't squish */}
        <aside className="w-60 flex-shrink-0 bg-gray-100 border-r border-gray-200 h-screen">
          <SidebarContent />
        </aside>

        {/* Page content: 
            CRITICAL: 'min-w-0' is required for the child (the table) 
            to be able to scroll horizontally instead of pushing the parent.
        */}
        <section className="flex-1 min-w-0 p-6 bg-white overflow-y-auto">
          {children}
        </section>
      </main>

      <Footer />
    </div>
  );
}