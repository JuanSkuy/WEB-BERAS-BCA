"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  Activity,
  BarChart3,
  Calendar,
  Loader2,
  Settings,
  FolderTree,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Stats {
  revenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

const fetchStats = async (): Promise<Stats> => {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: any }
> = {
  pending: {
    label: "Menunggu",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
  processing: {
    label: "Diproses",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: Activity,
  },
  shipped: {
    label: "Dikirim",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
    icon: Package,
  },
  delivered: {
    label: "Selesai",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Dibatalkan",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    icon: XCircle,
  },
};

export default function AdminDashboard() {
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const {
    data: stats,
    isLoading: loading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
    refetchInterval: autoRefreshEnabled ? 30000 : false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (stats) {
      setLastRefresh(new Date());
    }
  }, [stats]);

  useEffect(() => {
  if (loading) {
      toast.loading("Memuat dashboard...", { id: "fetch-dashboard" });
    } else if (error) {
      toast.error("Gagal memuat dashboard", {
        id: "fetch-dashboard",
        description: "Silakan refresh halaman",
      });
    } else if (stats) {
      toast.success("Dashboard berhasil dimuat", {
        id: "fetch-dashboard",
        description: "Data terbaru telah ditampilkan",
      });
    }
  }, [loading, error, stats]);

  const handleRefresh = () => {
    refetch();
  };

  const formatCurrency = (cents: number) => {
    return `Rp ${(cents / 100).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
  };

  // Calculate revenue growth
  const revenueGrowth =
    stats && stats.monthlyRevenue && stats.monthlyRevenue.length >= 2
      ? ((stats.monthlyRevenue[stats.monthlyRevenue.length - 1].revenue -
          stats.monthlyRevenue[stats.monthlyRevenue.length - 2].revenue) /
          (stats.monthlyRevenue[stats.monthlyRevenue.length - 2].revenue || 1)) *
        100
      : 0;

  // Calculate max revenue for chart scaling
  const maxRevenue =
    stats && stats.monthlyRevenue && stats.monthlyRevenue.length > 0
      ? Math.max(...stats.monthlyRevenue.map((m) => m.revenue))
      : 0;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Gagal memuat dashboard</p>
        <Button onClick={handleRefresh}>Coba Lagi</Button>
      </div>
    );
  }

  if (!stats) return null;

  const totalOrdersByStatus = stats.ordersByStatus.reduce(
    (sum, o) => sum + o.count,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Ringkasan statistik dan performa toko Anda
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            <span className="text-xs">
              {lastRefresh &&
                formatDistanceToNow(lastRefresh, {
                  addSuffix: true,
                  locale: idLocale,
                })}
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Auto Refresh</span>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Pendapatan
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(stats.revenue)}
            </div>
            <div className="flex items-center gap-1.5">
              {revenueGrowth >= 0 ? (
                <>
                  <div className="p-1 bg-green-100 rounded">
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-700">
                    +{Math.abs(revenueGrowth).toFixed(1)}% vs bulan lalu
                  </span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-red-100 rounded">
                    <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <span className="text-xs font-semibold text-red-700">
                    {Math.abs(revenueGrowth).toFixed(1)}% vs bulan lalu
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Pesanan
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats.totalOrders}
            </div>
            <Badge variant="outline" className="text-xs bg-white/80">
              <Clock className="w-3 h-3 mr-1" />
              {stats.recentOrders} baru (7 hari)
            </Badge>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Pelanggan
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats.totalCustomers}
            </div>
            <p className="text-xs text-gray-600">Pengguna terdaftar</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Produk
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats.totalProducts}
            </div>
            <p className="text-xs text-gray-600">Produk aktif</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Orders by Status */}
        <Card className="lg:col-span-2 shadow-md border-0">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Pesanan berdasarkan Status
                </CardTitle>
                <CardDescription className="mt-1">
                  Distribusi pesanan berdasarkan status
                </CardDescription>
              </div>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  Lihat Semua
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.ordersByStatus.map((item) => {
                const config = statusConfig[item.status] || {
                  label: item.status,
                  color: "text-gray-700",
                  bgColor: "bg-gray-50 border-gray-200",
                  icon: AlertCircle,
                };
                const Icon = config.icon;
                const percentage =
                  totalOrdersByStatus > 0
                    ? (item.count / totalOrdersByStatus) * 100
                    : 0;

                return (
                  <div
                    key={item.status}
                    className={`p-5 rounded-xl border-2 ${config.bgColor} hover:shadow-lg transition-all duration-200 cursor-pointer group`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-lg bg-white shadow-sm group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <span className={`text-sm font-semibold ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-3">
                      {item.count}
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${config.color.replace("text-", "bg-").replace("-700", "-500")}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        {percentage.toFixed(1)}% dari total
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

        {/* Quick Actions */}
        <Card className="shadow-md border-0">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100/50">
            <CardTitle className="text-lg font-bold text-gray-900">
              Aksi Cepat
            </CardTitle>
            <CardDescription className="mt-1">
              Akses cepat ke fitur utama
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <Link href="/admin/products" className="block">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Kelola Produk</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Tambah atau edit produk
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </Button>
            </Link>
            <Link href="/admin/orders" className="block">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 hover:bg-green-50 hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Kelola Pesanan</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Lihat dan update pesanan
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
              </Button>
            </Link>
            <Link href="/admin/customers" className="block">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 hover:bg-purple-50 hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Kelola Pelanggan</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Lihat data pelanggan
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </Button>
            </Link>
            <Link href="/admin/categories" className="block">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <FolderTree className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Kelola Kategori</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Kelola kategori produk
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </Button>
            </Link>
            <Link href="/admin/settings" className="block">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4 hover:bg-orange-50 hover:border-orange-300 hover:shadow-md transition-all group"
              >
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-gray-900">Pengaturan</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Konfigurasi toko
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      {stats.monthlyRevenue.length > 0 && (
        <Card className="shadow-md border-0">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Pendapatan Bulanan
            </CardTitle>
                <CardDescription className="mt-1">
                  6 bulan terakhir
                </CardDescription>
              </div>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  Detail
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {stats.monthlyRevenue.map((item, index) => {
                const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                const monthDate = new Date(item.month + "-01");
                const monthName = monthDate.toLocaleDateString("id-ID", {
                  month: "long",
                      year: "numeric",
                });
                const shortMonth = monthDate.toLocaleDateString("id-ID", {
                  month: "short",
                });

                return (
                  <div key={item.month} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900 block">
                            {monthName}
                  </span>
                          <span className="text-xs text-gray-500">{shortMonth}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900 block">
                    {formatCurrency(item.revenue)}
                  </span>
                        <span className="text-xs text-gray-500">
                          {percentage.toFixed(0)}% dari maksimum
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
                      <div
                        className="h-4 rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 transition-all duration-700 ease-out shadow-sm"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
