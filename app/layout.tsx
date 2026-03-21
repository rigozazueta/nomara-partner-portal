import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nomara Partner Portal",
  description: "Retreat operator partner portal for Nomara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
