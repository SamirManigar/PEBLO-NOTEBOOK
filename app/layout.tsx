import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Peblo - Collaborative AI Notes Workspace",
  description: "Your AI-powered learning universe and notes workspace.",
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
