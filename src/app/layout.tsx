import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "AeGis",
  description: "Alert Enabled GST Investigation Supervision",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
