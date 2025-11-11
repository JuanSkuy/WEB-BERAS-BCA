"use client";

import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export function CartIcon() {
  const { state } = useCart();

  return (
    <Link href="/cart">
      <Button
        variant="outline"
        size="icon"
        className="
          relative 
          group 
          overflow-hidden 
          border-2 border-transparent 
          bg-gradient-to-r from-primary/10 to-accent/10 
          hover:from-primary/20 hover:to-accent/20 
          hover:border-gradient-to-r hover:border-primary hover:shadow-[0_0_15px_var(--accent)]
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
              absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center 
              p-0 text-xs font-bold 
              bg-gradient-to-br from-red-500 to-pink-500 text-white
              animate-bounce
              shadow-[0_0_6px_rgba(255,0,0,0.4)]
            "
          >
            {state.totalItems > 99 ? "99+" : state.totalItems}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
