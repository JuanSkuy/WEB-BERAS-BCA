"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TopLoadingBar from "@/components/loading-bar";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  FolderTree,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [userEmail, setUserEmail] = useState<string>("");

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarOpen", String(sidebarOpen));
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (res.ok) {
          setIsAdmin(true);
          
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            setUserEmail(sessionData.user?.email || "");
          }
        } else {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    if (pathname !== "/admin/login") {
      checkAdmin();
    } else {
      setLoading(false);
    }
  }, [router, pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Memuat...</div>
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Produk", icon: Package },
    { href: "/admin/categories", label: "Kategori", icon: FolderTree },
    { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart },
    { href: "/admin/customers", label: "Pelanggan", icon: Users },
    { href: "/admin/users", label: "User & Admin", icon: Users },
    { href: "/admin/settings", label: "Pengaturan", icon: Settings },
  ];

  const userInitials = userEmail
    ? userEmail
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <QueryProvider>
      <Toaster position="top-right" />
    <div className="min-h-screen bg-gray-50">
        <TopLoadingBar />
        <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? "w-64" : "w-20"
            } bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl relative`}
            style={{ overflow: 'visible' }}
          >
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -right-3 top-20 z-50 bg-white rounded-full p-1.5 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors hidden lg:flex items-center justify-center"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-700" />
              )}
            </button>

            {/* Logo/Brand */}
            <div className={`p-6 border-b border-gray-700 ${!sidebarOpen ? "px-3" : ""}`}>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6 text-white" />
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold">Cap Akor</h1>
                    <p className="text-xs text-gray-400">Admin Panel</p>
                  </div>
                )}
              </div>
          </div>

            {/* Navigation */}
            <nav className={`flex-1 py-6 space-y-2 overflow-y-auto overflow-x-visible ${sidebarOpen ? "px-4" : "px-2"}`}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                    className={`flex items-center gap-3 rounded-lg transition-all duration-200 group ${
                      sidebarOpen ? "px-4 py-3" : "px-3 py-3 justify-center"
                    } ${
                    isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/50"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="font-medium whitespace-nowrap">{item.label}</span>
                    )}
                </Link>
              );
            })}
          </nav>

            {/* User Section */}
            <div className={`border-t border-gray-700 ${sidebarOpen ? "p-4" : "p-2"}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {sidebarOpen ? (
                    <button
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700 text-white transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {userEmail || "Admin"}
                        </p>
                        <p className="text-xs text-gray-400">Administrator</p>
                      </div>
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </button>
                  ) : (
                    <button
                      className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-700 text-white transition-colors"
                      title={userEmail || "Admin"}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  side="right"
                  alignOffset={-5}
                  sideOffset={12}
                  className="w-56 z-[10000] bg-white shadow-xl border border-gray-200"
                  avoidCollisions={true}
                  collisionPadding={16}
                >
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{userEmail || "Admin"}</p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
              Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden"
                  >
                    {sidebarOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="hidden lg:flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {menuItems.find((item) => item.href === pathname)?.label ||
                        "Dashboard"}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-64">
                    <Search className="w-4 h-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Cari..."
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0"
                    />
                  </div>

                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </Button>

                  {/* User Menu (Mobile/Header) */}
                  <div className="lg:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        sideOffset={8}
                        className="w-56 z-[10000] bg-white shadow-xl border border-gray-200"
                        avoidCollisions={true}
                        collisionPadding={16}
                      >
                        <DropdownMenuLabel>
                          <div>
                            <p className="font-medium">{userEmail || "Admin"}</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Keluar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-6 max-w-7xl mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}

