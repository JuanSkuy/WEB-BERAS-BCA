"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  Calendar,
  CreditCard,
  Package,
  Activity,
  Sparkles,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface AnalyticsData {
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  revenueByStatus: Array<{ status: string; revenue: number; count: number }>;
  topProducts: Array<{
    id: number;
    name: string;
    image: string;
    revenue: number;
    quantity_sold: number;
    order_count: number;
  }>;
  revenueByPaymentMethod: Array<{
    payment_method: string;
    revenue: number;
    count: number;
  }>;
  ordersByDayOfWeek: Array<{
    day_name: string;
    day_of_week: number;
    revenue: number;
    orders: number;
  }>;
  avgOrderValue: Array<{
    month: string;
    avg_order_value: number;
    total_revenue: number;
    order_count: number;
  }>;
  customerAcquisition: Array<{ date: string; new_customers: number }>;
  totalStats: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    avg_order_value: number;
    revenue_last_7_days: number;
    revenue_last_30_days: number;
  };
}

const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const res = await fetch("/api/admin/analytics");
  if (!res.ok) throw new Error("Gagal memuat data analytics");
  return res.json();
};

const formatCurrency = (cents: number) => {
  return `Rp ${(cents / 100).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("id-ID").format(num);
};

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

const paymentMethodLabels: Record<string, string> = {
  xendit: "Xendit",
  bank_transfer: "Transfer Bank",
  e_wallet: "E-Wallet",
  unknown: "Tidak Diketahui",
};

const dayLabels: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

export default function AnalyticsPage() {
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAnalytics,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Memuat analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600">Gagal memuat data analytics</p>
        <Button onClick={() => refetch()}>Coba Lagi</Button>
      </div>
    );
  }

  if (!analytics) return null;

  const {
    dailyRevenue,
    monthlyRevenue,
    revenueByStatus,
    topProducts,
    revenueByPaymentMethod,
    ordersByDayOfWeek,
    avgOrderValue,
    customerAcquisition,
    totalStats,
  } = analytics;

  // Prepare data for charts
  const dailyRevenueChart = dailyRevenue.map((item) => ({
    date: format(new Date(item.date), "dd MMM", { locale: idLocale }),
    revenue: Number(item.revenue) / 100,
    orders: item.orders,
  }));

  const monthlyRevenueChart = monthlyRevenue.map((item) => ({
    month: format(new Date(item.month + "-01"), "MMM yyyy", { locale: idLocale }),
    revenue: Number(item.revenue) / 100,
    orders: item.orders,
  }));

  const revenueByStatusChart = revenueByStatus.map((item) => ({
    status: statusLabels[item.status] || item.status,
    revenue: Number(item.revenue) / 100,
    count: item.count,
  }));

  const paymentMethodChart = revenueByPaymentMethod.map((item) => ({
    name: paymentMethodLabels[item.payment_method] || item.payment_method,
    value: Number(item.revenue) / 100,
    count: item.count,
  }));

  const ordersByDayChart = ordersByDayOfWeek
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map((item) => ({
      day: dayLabels[item.day_of_week] || item.day_name.trim(),
      revenue: Number(item.revenue) / 100,
      orders: item.orders,
    }));

  const avgOrderValueChart = avgOrderValue.map((item) => ({
    month: format(new Date(item.month + "-01"), "MMM yyyy", { locale: idLocale }),
    avgValue: Number(item.avg_order_value) / 100,
    totalRevenue: Number(item.total_revenue) / 100,
    orderCount: item.order_count,
  }));

  const customerAcquisitionChart = customerAcquisition.map((item) => ({
    date: format(new Date(item.date), "dd MMM", { locale: idLocale }),
    customers: item.new_customers,
  }));

  const topProductsChart = topProducts.slice(0, 5).map((item) => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name,
    revenue: Number(item.revenue) / 100,
    quantity: item.quantity_sold,
  }));

  // Calculate growth percentages
  const revenue7DaysAgo = dailyRevenue
    .slice(-14, -7)
    .reduce((sum, item) => sum + Number(item.revenue), 0);
  const revenue7DaysCurrent = dailyRevenue
    .slice(-7)
    .reduce((sum, item) => sum + Number(item.revenue), 0);
  const revenueGrowth7Days =
    revenue7DaysAgo > 0
      ? ((revenue7DaysCurrent - revenue7DaysAgo) / revenue7DaysAgo) * 100
      : 0;

  const revenue30DaysAgo = monthlyRevenue.length >= 2
    ? Number(monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0)
    : 0;
  const revenue30DaysCurrent = monthlyRevenue.length >= 1
    ? Number(monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0)
    : 0;
  const revenueGrowth30Days =
    revenue30DaysAgo > 0
      ? ((revenue30DaysCurrent - revenue30DaysAgo) / revenue30DaysAgo) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Analisis lengkap performa bisnis dan penjualan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            <span className="text-xs">Data terbaru</span>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-full -mr-16 -mt-16 blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Pendapatan
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(totalStats.total_revenue)}
            </div>
            <p className="text-xs text-gray-600 font-medium">
              {formatNumber(totalStats.total_orders)} pesanan
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full -mr-16 -mt-16 blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Pendapatan 7 Hari
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(totalStats.revenue_last_7_days)}
            </div>
            <div className="flex items-center gap-1.5">
              {revenueGrowth7Days >= 0 ? (
                <>
                  <div className="p-1 bg-green-100 rounded">
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-700">
                    +{Math.abs(revenueGrowth7Days).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-red-100 rounded">
                    <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <span className="text-xs font-semibold text-red-700">
                    {Math.abs(revenueGrowth7Days).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500">vs periode sebelumnya</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full -mr-16 -mt-16 blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Pendapatan 30 Hari
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(totalStats.revenue_last_30_days)}
            </div>
            <div className="flex items-center gap-1.5">
              {revenueGrowth30Days >= 0 ? (
                <>
                  <div className="p-1 bg-green-100 rounded">
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-700">
                    +{Math.abs(revenueGrowth30Days).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-red-100 rounded">
                    <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <span className="text-xs font-semibold text-red-700">
                    {Math.abs(revenueGrowth30Days).toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-xs text-gray-500">vs bulan sebelumnya</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full -mr-16 -mt-16 blur-xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Rata-rata Order
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <ShoppingCart className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(totalStats.avg_order_value)}
            </div>
            <p className="text-xs text-gray-600 font-medium">
              {formatNumber(totalStats.total_customers)} pelanggan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Revenue Chart */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              Pendapatan Harian
            </CardTitle>
            <CardDescription className="mt-1">
              30 hari terakhir - Trend pendapatan dan jumlah pesanan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                revenue: {
                  label: "Pendapatan",
                  color: "#3b82f6",
                },
                orders: {
                  label: "Pesanan",
                  color: "#10b981",
                },
              }}
              className="h-[300px]"
            >
              <LineChart data={dailyRevenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (name === "revenue") {
                          return [formatCurrency(Number(value) * 100), "Pendapatan"];
                        }
                        return [value, "Pesanan"];
                      }}
                    />
                  }
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Revenue Chart */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50/50 to-pink-50/50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              Pendapatan Bulanan
            </CardTitle>
            <CardDescription className="mt-1">
              12 bulan terakhir - Total pendapatan per bulan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                revenue: {
                  label: "Pendapatan",
                  color: "#8b5cf6",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={monthlyRevenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatCurrency(Number(value) * 100),
                        "Pendapatan",
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Status */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50/30">
          <CardHeader className="border-b bg-gradient-to-r from-green-50/50 to-emerald-50/50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <PieChart className="w-4 h-4 text-green-600" />
              </div>
              Pendapatan Berdasarkan Status
            </CardTitle>
            <CardDescription className="mt-1">
              Distribusi pendapatan per status pesanan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={revenueByStatusChart.reduce((acc, item) => {
                acc[item.status] = {
                  label: item.status,
                  color: COLORS[revenueByStatusChart.indexOf(item) % COLORS.length],
                };
                return acc;
              }, {} as Record<string, { label: string; color: string }>)}
              className="h-[300px]"
            >
              <RechartsPieChart>
                <Pie
                  data={revenueByStatusChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {revenueByStatusChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatCurrency(Number(value) * 100),
                        "Pendapatan",
                      ]}
                    />
                  }
                />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Payment Method */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-amber-50/30">
          <CardHeader className="border-b bg-gradient-to-r from-amber-50/50 to-orange-50/50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              Pendapatan Berdasarkan Metode Pembayaran
            </CardTitle>
            <CardDescription className="mt-1">
              Distribusi pendapatan per metode pembayaran
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={paymentMethodChart.reduce((acc, item) => {
                acc[item.name] = {
                  label: item.name,
                  color: COLORS[paymentMethodChart.indexOf(item) % COLORS.length],
                };
                return acc;
              }, {} as Record<string, { label: string; color: string }>)}
              className="h-[300px]"
            >
              <RechartsPieChart>
                <Pie
                  data={paymentMethodChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatCurrency(Number(value) * 100),
                        "Pendapatan",
                      ]}
                    />
                  }
                />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Orders by Day of Week */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-cyan-50/30">
          <CardHeader className="border-b bg-gradient-to-r from-cyan-50/50 to-blue-50/50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-cyan-100 rounded-lg">
                <Calendar className="w-4 h-4 text-cyan-600" />
              </div>
              Pesanan Berdasarkan Hari
            </CardTitle>
            <CardDescription className="mt-1">
              Pola pesanan dalam seminggu (90 hari terakhir)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                revenue: {
                  label: "Pendapatan",
                  color: "#3b82f6",
                },
                orders: {
                  label: "Pesanan",
                  color: "#10b981",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={ordersByDayChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis yAxisId="left" stroke="#6b7280" />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (name === "revenue") {
                          return [formatCurrency(Number(value) * 100), "Pendapatan"];
                        }
                        return [value, "Pesanan"];
                      }}
                    />
                  }
                />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="url(#revenueGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="orders"
                  fill="url(#ordersGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-rose-50/30">
          <CardHeader className="border-b bg-gradient-to-r from-rose-50/50 to-pink-50/50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-rose-600" />
              </div>
              Rata-rata Nilai Order
            </CardTitle>
            <CardDescription className="mt-1">
              Trend nilai rata-rata order per bulan
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                avgValue: {
                  label: "Rata-rata Order",
                  color: "#ec4899",
                },
              }}
              className="h-[300px]"
            >
              <AreaChart data={avgOrderValueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatCurrency(Number(value) * 100),
                        "Rata-rata Order",
                      ]}
                    />
                  }
                />
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f472b6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="avgValue"
                  stroke="#ec4899"
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Customer Acquisition */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-teal-50/30">
          <CardHeader className="border-b bg-gradient-to-r from-teal-50/50 to-cyan-50/50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              Akusisi Pelanggan Baru
            </CardTitle>
            <CardDescription className="mt-1">
              Jumlah pelanggan baru per hari (30 hari terakhir)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                customers: {
                  label: "Pelanggan Baru",
                  color: "#14b8a6",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={customerAcquisitionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [value, "Pelanggan Baru"]}
                    />
                  }
                />
                <Bar
                  dataKey="customers"
                  fill="url(#customerGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#5eead4" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50/30">
          <CardHeader className="border-b bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              Produk Terlaris (Top 5)
            </CardTitle>
            <CardDescription className="mt-1">
              Produk dengan pendapatan tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                revenue: {
                  label: "Pendapatan",
                  color: "#6366f1",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={topProductsChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" width={120} stroke="#6b7280" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        formatCurrency(Number(value) * 100),
                        "Pendapatan",
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#productGradient)"
                  radius={[0, 8, 8, 0]}
                />
                <defs>
                  <linearGradient id="productGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50/50 to-gray-50/50">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <Sparkles className="w-4 h-4 text-slate-600" />
            </div>
            Detail Produk Terlaris
          </CardTitle>
          <CardDescription className="mt-1">
            Daftar lengkap produk dengan performa terbaik
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-4 font-bold text-gray-700">Produk</th>
                  <th className="text-right p-4 font-bold text-gray-700">Pendapatan</th>
                  <th className="text-right p-4 font-bold text-gray-700">Terjual</th>
                  <th className="text-right p-4 font-bold text-gray-700">Jumlah Order</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded-lg shadow-sm border border-gray-200"
                          />
                        )}
                        <div>
                          <span className="font-semibold text-gray-900">
                            {product.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full font-medium">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right p-4">
                      <span className="font-bold text-gray-900">
                        {formatCurrency(product.revenue)}
                      </span>
                    </td>
                    <td className="text-right p-4">
                      <span className="text-gray-700 font-medium">
                        {formatNumber(product.quantity_sold)}
                      </span>
                    </td>
                    <td className="text-right p-4">
                      <span className="text-gray-700 font-medium">
                        {formatNumber(product.order_count)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
