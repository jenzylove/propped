import type { Metadata } from "next";
import { Big_Shoulders, Big_Shoulders_Stencil, Courier_Prime, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "./chrome";

const shoulders = Big_Shoulders({ subsets: ["latin"], variable: "--font-shoulders", weight: ["700", "800", "900"] });
const stencil = Big_Shoulders_Stencil({ subsets: ["latin"], variable: "--font-stencil", weight: ["800", "900"] });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", weight: ["400", "500", "600", "700"] });
const courier = Courier_Prime({ subsets: ["latin"], variable: "--font-courier", weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Propped",
  description: "See the TV shows your customers actually watch, then get your product on those sets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={`${shoulders.variable} ${stencil.variable} ${schibsted.variable} ${courier.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
