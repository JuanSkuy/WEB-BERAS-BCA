import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { CartProvider } from "@/contexts/cart-context";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cap Akor - Premium Rice",
  description: "High-quality rice for your everyday needs.",
  generator: "v0.app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${playfairDisplay.variable} antialiased`}
    >
      <body>
        <CartProvider>
          <SiteHeader
            initialUser={
              session ? { id: session.userId, email: session.email } : null
            }
          />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
