import type React from "react";
import SiteHeader from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { CartProvider } from "@/contexts/cart-context";
import TopLoadingBar from "@/components/loading-bar";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <CartProvider>
      <TopLoadingBar />
      <SiteHeader
        initialUser={
          session ? { id: session.userId, email: session.email } : null
        }
      />
      {children}
    </CartProvider>
  );
}

