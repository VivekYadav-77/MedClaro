import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Manrope } from "next/font/google";

import { Providers } from "@/app/providers";
import { mockUser } from "@/lib/mock-data";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces"
});

export const metadata: Metadata = {
  title: "HealthStack",
  description: "Personal health intelligence for reports, trends, and calm doctor prep."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang={mockUser.preferredLanguage}>
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <Providers locale={mockUser.preferredLanguage}>{children}</Providers>
      </body>
    </html>
  );
}
