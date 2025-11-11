"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { CartIcon } from "@/components/cart-icon";

type User = { id: string; email: string };

export default function SiteHeader({
  initialUser,
}: {
  initialUser: User | null;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);

  // Check authentication state on mount and when route changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          // Only set user if there's actually a user in the response
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const onLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const avatarLetter = user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-serif font-bold text-foreground"
        >
          <img
            src="/logo-capakor.png"
            alt="Logo Cap Akor"
            className="w-20 h-20 object-contain"
          />
          Cap Akor
        </Link>

        {/* Menu Navigasi */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
          >
            Beranda
          </button>

          <a
            href="/#tentang-kami"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            Tentang Kami
          </a>
          <a
            href="/#produk"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            Produk
          </a>
          <a
            href="/#kontak"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            Kontak
          </a>
        </nav>

        {/* Bagian Kanan (Login/Register/Cart) */}
        <div className="flex items-center gap-2">
          {user ? (
            <Menu as="div" className="relative inline-block text-left">
              <MenuButton className="inline-flex items-center gap-x-2 rounded-md px-2 sm:px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/40">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt={user.email} />
                  <AvatarFallback>{avatarLetter}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline max-w-[160px] truncate">
                  {user.email}
                </span>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="hidden sm:block -mr-1 size-4 text-foreground/70"
                />
              </MenuButton>
              <MenuItems
                transition
                className="absolute right-0 z-[9999] mt-2 w-56 origin-top-right rounded-md bg-card border outline-1 -outline-offset-1 outline-border/30 shadow-md transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                <div className="py-1">
                  <div className="px-3 py-1.5">
                    <div className="text-sm font-medium">Akun</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  <div className="h-px bg-border my-1" />
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={onLogout}
                        disabled={isLoading}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          focus
                            ? "bg-accent/50 text-foreground"
                            : "text-foreground"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isLoading ? "Keluar..." : "Keluar"}
                      </button>
                    )}
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="default">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Register</Button>
              </Link>
            </>
          )}
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
