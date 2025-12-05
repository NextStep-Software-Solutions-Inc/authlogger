import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { ToastContainer } from "./components/ui/Toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuthLogger - Authentication Event Monitoring",
  description: "Monitor and analyze authentication events across multiple applications with real-time dashboards, analytics, and Excel export capabilities.",
  keywords: ["authentication", "monitoring", "events", "analytics", "clerk", "webhooks"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        >
          <ThemeProvider>
            {children}
            <ToastContainer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
