import type { Metadata } from "next";
import { ClientProviders } from "../context/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorPilot — Bounded Operating System for Digital Creators",
  description: "Manage your complete creator workflow from idea to publication inside one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
