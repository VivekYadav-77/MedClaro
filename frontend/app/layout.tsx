import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/app/providers";
import { mockUser } from "@/lib/mock-data";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedClaro – Personal Health Intelligence",
  description: "Upload blood reports, prescriptions, and labs to get calm multilingual explanations, trend views, and doctor prep summaries.",
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang={mockUser.preferredLanguage} className="scroll-smooth">
      <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
        <Providers locale={mockUser.preferredLanguage}>{children}</Providers>
      </body>
    </html>
  );
}
