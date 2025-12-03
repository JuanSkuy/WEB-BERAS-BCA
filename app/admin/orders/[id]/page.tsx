"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Activity,
  XCircle,
  Loader2,
  AlertCircle,
  Truck,
  ShoppingCart,
  Mail,
  Hash,
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
  shipping_cost_cents?: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  created_at: string;
  updated_at: string;
  user_email: string | null;
  user_name: string | null;
  items: OrderItem[];
}

const fetchOrder = async (orderId: string): Promise<Order | null> => {
  const res = await fetch("/api/admin/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  const order = data.orders?.find((o: Order) => o.id === orderId);
  return order || null;
};

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: any; dotColor: string }
> = {
  pending: {
    label: "Menunggu Konfirmasi",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: Clock,
    dotColor: "bg-yellow-500",
  },
  processing: {
    label: "Diproses",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: Activity,
    dotColor: "bg-blue-500",
  },
  shipped: {
    label: "Dikirim",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    icon: Truck,
    dotColor: "bg-purple-500",
  },
  delivered: {
    label: "Selesai",
    color: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle2,
    dotColor: "bg-green-500",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "text-red-700",
    bgColor: "bg-red-50",
    icon: XCircle,
    dotColor: "bg-red-500",
  },
};

const statusTimeline = [
  { key: "pending", label: "Pesanan Dibuat" },
  { key: "processing", label: "Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "delivered", label: "Selesai" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const queryClient = useQueryClient();

  const {
    data: order,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => fetchOrder(orderId),
    refetchInterval: 30000,
    enabled: !!orderId,
  });

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
      toast.loading("Memperbarui status...", { id: "update-status" });
    },
    onSuccess: () => {
      toast.success("Status berhasil diperbarui", { id: "update-status" });
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui status", { id: "update-status" });
    },
  });

  useEffect(() => {
    if (loading) {
      toast.loading("Memuat detail pesanan...", { id: "fetch-order" });
    } else if (error) {
      toast.error("Gagal memuat detail pesanan", { id: "fetch-order" });
    } else if (order) {
      toast.dismiss("fetch-order");
    }
  }, [loading, error, order]);

  const handleStatusChange = (newStatus: string) => {
    if (!order) return;
    updateStatusMutation.mutate({ orderId: order.id, status: newStatus });
  };

  const formatCurrency = (cents: number) => {
    return `Rp ${(cents / 100).toLocaleString("id-ID")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-gray-600">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <Card className="border-red-200">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  {error ? "Gagal memuat detail pesanan" : "Pesanan tidak ditemukan"}
                </p>
                <p className="text-sm text-gray-500">
                  {error instanceof Error ? error.message : "Pesanan dengan ID ini tidak ditemukan"}
                </p>
              </div>
              <Link href="/admin/orders">
                <Button>Kembali ke Daftar Pesanan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatusIndex = statusTimeline.findIndex((s) => s.key === order.status);
  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price_cents * item.quantity,
    0
  );
  const shippingCost = order.shipping_cost_cents || 0;
  const total = order.total_cents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Pesanan</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`${config.bgColor} ${config.color} border-0 px-3 py-1.5 text-sm font-medium flex items-center gap-2`}
          >
            <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
            {config.label}
          </Badge>
          <Select
            value={order.status}
            onValueChange={handleStatusChange}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Menunggu Konfirmasi</SelectItem>
              <SelectItem value="processing">Diproses</SelectItem>
              <SelectItem value="shipped">Dikirim</SelectItem>
              <SelectItem value="delivered">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Pelanggan</p>
                    <p className="font-semibold text-gray-900 truncate">
                      {order.user_name || "Guest"}
                    </p>
                    {order.user_email && (
                      <div className="flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500 truncate">{order.user_email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Tanggal Pesanan</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Status Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusTimeline.map((item, index) => {
                  const isActive = currentStatusIndex >= index;
                  const isCurrent = currentStatusIndex === index;
                  const itemConfig = statusConfig[item.key] || statusConfig.pending;
                  const Icon = itemConfig.icon;

                  return (
                    <div key={item.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-0.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? `${itemConfig.dotColor} text-white shadow-sm`
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        {index < statusTimeline.length - 1 && (
                          <div
                            className={`w-0.5 h-8 mt-2 transition-all ${
                              isActive ? itemConfig.dotColor : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p
                          className={`font-medium text-sm ${
                            isActive ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {item.label}
                        </p>
                        {isCurrent && order.updated_at && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDistanceToNow(new Date(order.updated_at), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {order.status === "cancelled" && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Pesanan telah dibatalkan</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Produk ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => {
                    const itemTotal = item.price_cents * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.product_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              Qty: <span className="font-medium text-gray-700">{item.quantity}</span>
                            </span>
                            <span className="text-xs text-gray-500">
                              @ {formatCurrency(item.price_cents)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(itemTotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Tidak ada item</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Summary */}
          <Card className="border-0 shadow-sm sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ringkasan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ongkos Kirim</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(shippingCost)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Detail Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Hash className="w-3 h-3" />
                  Order ID
                </div>
                <p className="font-mono text-xs font-medium text-gray-900 break-all">
                  {order.id}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Hash className="w-3 h-3" />
                  User ID
                </div>
                <p className="font-mono text-xs font-medium text-gray-900 break-all">
                  {order.user_id}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Clock className="w-3 h-3" />
                  Terakhir Diupdate
                </div>
                <p className="text-xs font-medium text-gray-900">
                  {formatDistanceToNow(new Date(order.updated_at), {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
