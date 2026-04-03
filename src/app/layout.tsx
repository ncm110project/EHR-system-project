import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { EHRProvider } from "@/lib/ehr-context";
import { AuthProviderWrapper } from "@/components/providers/AuthProviderWrapper";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MedConnect EHR - Electronic Health Records",
  description: "Hospital Electronic Health Record System connecting OPD, ER, Pharmacy, Lab, and Nursing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${ibmPlexSans.variable}`}>
        <EHRProvider>
          <AuthProviderWrapper>{children}</AuthProviderWrapper>
        </EHRProvider>
      </body>
    </html>
  );
}