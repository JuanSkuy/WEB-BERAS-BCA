"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Clock,
  Package,
  CheckCircle2,
  DollarSign,
  Eye,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_cents: number;
}

interface Order {
  id: string;
  user_id: string;
  total_cents: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  updated_at: string;
  user_email: string | null;
  user_name: string | null;
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-purple-100 text-purple-800 border-purple-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu Konfirmasi",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

const fetchOrders = async (): Promise<Order[]> => {
  const res = await fetch("/api/admin/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  return data.orders || [];
};

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
    isFetching,
  } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      const url =
        statusFilter === "all"
          ? "/api/admin/orders"
          : `/api/admin/orders?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      return data.orders || [];
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (ordersLoading) {
      toast.loading("Memuat data pesanan...", { id: "fetch-orders" });
    } else if (ordersError) {
      toast.error("Gagal memuat data pesanan", {
        id: "fetch-orders",
        description: "Silakan refresh halaman atau coba lagi",
      });
    } else if (orders.length > 0 && !isFetching) {
      toast.success("Data pesanan berhasil ditampilkan", {
        id: "fetch-orders",
        description: `${orders.length} pesanan ditemukan`,
      });
    }
  }, [ordersLoading, ordersError, orders.length, isFetching]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui status pesanan");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Memperbarui status pesanan...", { id: "update-order-status" });
    },
    onSuccess: () => {
      toast.success("Status pesanan berhasil diperbarui", {
        id: "update-order-status",
        description: "Perubahan telah disimpan",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui status pesanan", {
        id: "update-order-status",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <SortableHeader column={column}>ID Pesanan</SortableHeader>
        ),
        cell: ({ row }) => {
          const orderId = row.getValue("id") as string;
          return (
            <div className="font-mono text-sm">
              #{orderId.slice(0, 8)}
            </div>
          );
        },
      },
      {
        accessorKey: "user_email",
        header: "Pelanggan",
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div>
              <div className="font-medium">
                {order.user_name || order.user_email || "Guest"}
              </div>
              {order.user_email && (
                <div className="text-xs text-gray-500">{order.user_email}</div>
              )}
            </div>
          );
        },
      },
      {
        id: "items",
        header: "Item",
        cell: ({ row }) => {
          const items = row.original.items || [];
          const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <div>
              <div className="font-medium">{totalItems} item</div>
              <div className="text-xs text-gray-500">
                {items.length} produk berbeda
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "total_cents",
        header: ({ column }) => (
          <SortableHeader column={column}>Total</SortableHeader>
        ),
        cell: ({ row }) => {
          const total = row.getValue("total_cents") as number;
          return (
            <div className="font-semibold text-gray-900">
              Rp {(total / 100).toLocaleString("id-ID")}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <SortableHeader column={column}>Status</SortableHeader>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={statusColors[status]}
              >
                {statusLabels[status]}
              </Badge>
              <Select
                value={status}
                onValueChange={(newStatus) =>
                  handleStatusChange(row.original.id, newStatus)
                }
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    {statusLabels.pending}
                  </SelectItem>
                  <SelectItem value="processing">
                    {statusLabels.processing}
                  </SelectItem>
                  <SelectItem value="shipped">
                    {statusLabels.shipped}
                  </SelectItem>
                  <SelectItem value="delivered">
                    {statusLabels.delivered}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {statusLabels.cancelled}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <SortableHeader column={column}>Tanggal</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("created_at"));
          return (
            <div>
              <div className="text-sm">
                {date.toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(date, {
                  addSuffix: true,
                  locale: idLocale,
                })}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Link href={`/admin/orders/${order.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Detail
                </Button>
              </Link>
            </div>
          );
        },
      },
    ],
    [updateStatusMutation.isPending]
  );

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o: Order) => o.status === "pending").length;
  const processingOrders = orders.filter((o: Order) => o.status === "processing").length;
  const deliveredOrders = orders.filter((o: Order) => o.status === "delivered").length;
  const totalRevenue = orders
    .filter((o: Order) => o.status !== "cancelled")
    .reduce((sum: number, o: Order) => sum + o.total_cents, 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            Manajemen Pesanan
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola semua pesanan pelanggan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu Konfirmasi</SelectItem>
              <SelectItem value="processing">Diproses</SelectItem>
              <SelectItem value="shipped">Dikirim</SelectItem>
              <SelectItem value="delivered">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="text-3xl font-bold text-gray-900 mb-2">{totalOrders}</div>
            <p className="text-xs text-gray-600">Semua pesanan</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Menunggu
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{pendingOrders}</div>
            <p className="text-xs text-gray-600">Perlu konfirmasi</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-cyan-50 to-cyan-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Diproses
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Package className="h-5 w-5 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {processingOrders}
            </div>
            <p className="text-xs text-gray-600">Sedang diproses</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Selesai
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {deliveredOrders}
            </div>
            <p className="text-xs text-gray-600">Pesanan selesai</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Pendapatan
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              Rp {(totalRevenue / 100).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-gray-600">Dari pesanan aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold">Daftar Pesanan</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={orders}
            searchKey="id"
            searchPlaceholder="Cari pesanan berdasarkan ID..."
            isLoading={ordersLoading}
            emptyMessage={
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Tidak ada pesanan</p>
                <p className="text-sm text-gray-500 mt-1">
                  Belum ada pesanan yang masuk
                </p>
              </div>
            }
            enablePagination={true}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
