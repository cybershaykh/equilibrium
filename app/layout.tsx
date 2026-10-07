import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Equilibrium — goal setting with an accountability partner",
  description:
    "Post your goal, find your partner, show up together. Daily check-ins, shared streaks, and a messenger built for accountability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}