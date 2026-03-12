import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WealthWise — Portfolio Tracker",
  description: "Track your mutual fund investments in one place. Free for Indian investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}