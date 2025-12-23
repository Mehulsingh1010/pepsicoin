import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PepsiCoin",
  description: "Not your average ERC-20 token.",

  icons: {
    icon: "https://i.ibb.co/KcHR1smL/7389e3060eb4371a1a25bcb8ae4ad110-removebg-preview-1.png",
    shortcut: "https://i.ibb.co/KcHR1smL/7389e3060eb4371a1a25bcb8ae4ad110-removebg-preview-1.png",
    apple: "https://i.ibb.co/KcHR1smL/7389e3060eb4371a1a25bcb8ae4ad110-removebg-preview-1.png",
  },

  openGraph: {
    title: "PepsiCoin",
    description: "Not your average ERC-20 token.",
    images: [
      {
        url: "https://i.ibb.co/sJ3n9Qs0/Screenshot-2025-12-24-031136.png",
        width: 1200,
        height: 630,
        alt: "PepsiCoin ",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "PepsiCoin",
    description: "Not your average ERC-20 token.",
    images: ["https://i.ibb.co/sJ3n9Qs0/Screenshot-2025-12-24-031136.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
