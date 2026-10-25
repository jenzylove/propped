import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Propped",
  description: "See the TV shows your customers actually watch, then get your product on those sets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
