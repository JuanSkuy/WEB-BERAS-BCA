"use client";

import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CartIcon() {
  const { state } = useCart();
  const [session, setSession] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((sessionData) => {
        setSession(sessionData);
        setIsCheckingAuth(false);
      })
      .catch(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  const getLinkHref = () => {
    if (isCheckingAuth) {
      return "#"; // Or a loading indicator can be shown
    }
    return session?.user ? "/cart" : "/login?redirect=/cart";
  };

  return (
    <Link href={getLinkHref()}>
      <Button
        variant="outline"
        size="icon"
        className="
          relative 
          group 
          overflow-visible
          border border-border
          bg-gradient-to-r from-primary/10 to-accent/10 
          hover:from-primary/20 hover:to-accent/20 
          hover:border-primary hover:shadow-[0_0_15px_var(--accent)]
          transition-all duration-300 ease-in-out
          rounded-full
        "
      >
        <div
          className="
            absolute inset-0 opacity-0 group-hover:opacity-100
            bg-gradient-to-r from-primary to-accent blur-lg
            transition-opacity duration-300
          "
        ></div>

        <ShoppingCart
          className="
            w-5 h-5 relative z-10 
            text-primary 
            group-hover:scale-110 
            group-hover:rotate-12 
            transition-transform duration-300 ease-in-out
          "
        />

        {state.totalItems > 0 && (
          <Badge
            variant="destructive"
            className="
              absolute -top-3 -right-3 h-6 w-6 flex items-center justify-center 
              p-0 text-xs font-bold 
              bg-gradient-to-br from-red-500 to-pink-500 text-white
              animate-bounce
              shadow-[0_0_10px_rgba(255,0,0,0.6),_0_0_20px_rgba(236,72,153,0.4)]
              rounded-full
              z-50
              pointer-events-none
              border-2 border-white
            "
          >
            {state.totalItems > 99 ? "99+" : state.totalItems}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
