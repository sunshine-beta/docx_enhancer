import "./globals.css";
import type React from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dashboard - Document Processing",
  description:
    "Interactive dashboard for document processing and batch management",
  authors: [
    { name: "ExploitEngineer" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <h1 className="sm:text-lg font-semibold">
                  Document Processing Dashboard
                </h1>
              </div>
            </header>
            <div className="flex flex-col gap-4 p-4 pt-0">
              <main className="flex-1">{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
