import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Audit Workbench",
  description: "Evidence-first comparison of machine-learning experiment runs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

