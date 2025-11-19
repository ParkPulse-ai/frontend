import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
// Use Hedera instead of Flow
// import FlowProvider from "@/components/FlowProvider";
import HederaProvider from "@/components/HederaProvider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ParkPulse.ai - Urban Green Space Intelligence on Hedera",
  description: "AI-powered urban parks and green space analysis platform powered by Hedera Hashgraph",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${inter.variable} antialiased font-sans`}
      >
        <HederaProvider>
          {children}
        </HederaProvider>
      </body>
    </html>
  );
}
