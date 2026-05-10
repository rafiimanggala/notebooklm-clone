import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NotebookLM Clone",
  description: "AI-powered notebook with source-grounded chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}
