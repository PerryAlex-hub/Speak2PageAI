import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "../components/home/Header";
import { cn } from "@/lib/utils";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";

const fontSans = localFont({
  src: [
    {
      path: "./fonts/IBMPlexSans-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/IBMPlexSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/IBMPlexSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/IBMPlexSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Speak2Page",
  description:
    "Speak2Page is an AI-powered application that transforms your voice into written content. Simply speak, and our advanced speech recognition technology converts your words into beautifully formatted pages. Perfect for content creators, students, and professionals who want to boost productivity and streamline their writing workflow.",
  icons: {
    icon: "/icon.ico",
  },
  openGraph: {
    title: "Speak2Page - Transform Your Voice and Video into Written Content",
    description:
      "Speak2Page is an AI-powered application that transforms your voice into written content. Simply speak, and our advanced speech recognition technology converts your words into beautifully formatted pages. Perfect for content creators, students, and professionals who want to boost productivity and streamline their writing workflow.",
  },
  metadataBase: new URL("https://www.speak2page.app"),
  alternates: {
    canonical: "https://www.speak2page.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable,
          )}
        >
          <Header />
          <main> {children} </main>
          <Toaster />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
