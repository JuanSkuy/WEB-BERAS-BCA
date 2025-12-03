"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Activity,
  XCircle,
  Loader2,
  AlertCircle,
  Truck,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ShoppingBag,
  Home,
  FileText,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
  payment_method?: string;
  payment_invoice_number?: string;
  payment_status?: string;
  payment_channel?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: any;
    dotColor: string;
    borderColor: string;
  }
> = {
  pending: {
    label: "Menunggu Konfirmasi",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: Clock,
    dotColor: "bg-yellow-500",
    borderColor: "border-yellow-200",
  },
  processing: {
    label: "Diproses",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: Activity,
    dotColor: "bg-blue-500",
    borderColor: "border-blue-200",
  },
  shipped: {
    label: "Dikirim",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    icon: Truck,
    dotColor: "bg-purple-500",
    borderColor: "border-purple-200",
  },
  delivered: {
    label: "Selesai",
    color: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle2,
    dotColor: "bg-green-500",
    borderColor: "border-green-200",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "text-red-700",
    bgColor: "bg-red-50",
    icon: XCircle,
    dotColor: "bg-red-500",
    borderColor: "border-red-200",
  },
};

const statusTimeline = [
  { key: "pending", label: "Pesanan Dibuat", icon: Clock },
  { key: "processing", label: "Diproses", icon: Activity },
  { key: "shipped", label: "Dikirim", icon: Truck },
  { key: "delivered", label: "Selesai", icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (!data.user) {
        router.push("/login");
        return;
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch order");
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  const formatCurrency = (cents: number) => {
    return `Rp ${(cents / 100).toLocaleString("id-ID")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Pesanan
            </Button>
          </Link>
          <Card className="border-destructive/50">
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    {error ? "Gagal memuat detail pesanan" : "Pesanan tidak ditemukan"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : "Pesanan dengan ID ini tidak ditemukan"}
                  </p>
                </div>
                <Link href="/orders">
                  <Button>Kembali ke Daftar Pesanan</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Pesanan
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Detail Pesanan
              </h1>
              <p className="text-muted-foreground">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <Badge
              className={`${config.bgColor} ${config.color} ${config.borderColor} border-2 px-4 py-2 text-sm font-semibold flex items-center gap-2 w-fit`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
              {config.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Status Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusTimeline.map((status, index) => {
                    const isActive = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const StatusIcon = status.icon;

                    return (
                      <div key={status.key} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          {index < statusTimeline.length - 1 && (
                            <div
                              className={`w-0.5 h-12 mt-2 ${
                                isActive ? "bg-primary" : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-2">
                          <p
                            className={`font-semibold ${
                              isActive ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {status.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Status saat ini
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Produk yang Dipesan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                          <Image
                            src="/fotoberas.jpg"
                            alt={item.product_name}
                            width={80}
                            height={80}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1">
                            {item.product_name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Jumlah: {item.quantity}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Harga satuan: {formatCurrency(item.price_cents)}
                            </p>
                            <p className="font-bold text-primary text-lg">
                              {formatCurrency(item.price_cents * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Tidak ada item
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {order.payment_method && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Informasi Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Metode Pembayaran</span>
                    <span className="font-semibold text-foreground capitalize">
                      {order.payment_method === "xendit"
                        ? "Pembayaran Online (Xendit)"
                        : order.payment_method === "cod"
                        ? "Bayar di Tempat (COD)"
                        : order.payment_method}
                    </span>
                  </div>
                  {order.payment_invoice_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Nomor Invoice</span>
                      <span className="font-semibold text-foreground">
                        {order.payment_invoice_number}
                      </span>
                    </div>
                  )}
                  {order.payment_status && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status Pembayaran</span>
                      <Badge
                        variant={
                          order.payment_status === "paid"
                            ? "default"
                            : order.payment_status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {order.payment_status === "paid"
                          ? "Lunas"
                          : order.payment_status === "pending"
                          ? "Menunggu"
                          : "Gagal"}
                      </Badge>
                    </div>
                  )}
                  {order.payment_channel && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Channel Pembayaran</span>
                      <span className="font-semibold text-foreground">
                        {order.payment_channel}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <Card className="sticky top-6 border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal Produk</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Ongkos Kirim</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(shippingCost)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Informasi Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Tanggal Pesanan</p>
                      <p className="font-semibold text-foreground">
                        {new Date(order.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(order.created_at), {
                          addSuffix: true,
                          locale: idLocale,
                        })}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Total Item</p>
                      <p className="font-semibold text-foreground">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} produk
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Link href="/" className="block">
                    <Button variant="outline" className="w-full gap-2">
                      <Home className="w-4 h-4" />
                      Kembali ke Beranda
                    </Button>
                  </Link>
                  <Link href="/orders" className="block">
                    <Button variant="outline" className="w-full gap-2">
                      <Package className="w-4 h-4" />
                      Lihat Semua Pesanan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

