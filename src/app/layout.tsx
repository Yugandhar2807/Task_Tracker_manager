import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// This is a CRUD/auth app — every page needs the request (cookies, session,
// DB queries). Forcing dynamic at the root layout skips static prerender
// and avoids next-themes/sonner React-context nulls during `next build`.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team Task Manager — Modern Project & Task Collaboration",
  description:
    "Production-ready team collaboration platform with role-based projects, tasks, and live activity feed.",
  applicationName: "Team Task Manager",
  authors: [{ name: "Team Task Manager" }],
  keywords: ["task manager", "project management", "team collaboration", "kanban"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-background antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
