import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eyes On The Ball Academy | Football",
  description: "A welcoming place for young players to learn, play, and belong.",
  icons: {
    icon: "/academy/logo.jpg",
    shortcut: "/academy/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}


