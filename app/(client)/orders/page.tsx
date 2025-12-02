"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import { Package, Calendar, DollarSign, ArrowRight } from "lucide-react";

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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (!data.user) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/orders");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat riwayat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Riwayat Pesanan</h1>
        <p className="text-gray-600">Lihat status dan detail semua pesanan Anda</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-4">
              <Package className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum Ada Pesanan
                </h3>
                <p className="text-gray-500 mb-6">
                  Anda belum memiliki pesanan. Mulai berbelanja untuk melihat pesanan di sini.
                </p>
                <Link href="/">
                  <Button>Mulai Berbelanja</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">
                        Pesanan #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(order.created_at), {
                            addSuffix: true,
                            locale: idLocale,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4" />
                        <span>{order.items?.length || 0} produk</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Pesanan</p>
                      <p className="text-xl font-bold text-gray-900">
                        Rp{(order.total_cents / 100).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">
                      Produk yang Dipesan
                    </h4>
                    <div className="space-y-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {item.product_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Jumlah: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                Rp{(item.price_cents / 100).toLocaleString("id-ID")}
                              </p>
                              <p className="text-xs text-gray-500">
                                @ Rp{((item.price_cents / item.quantity) / 100).toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Tidak ada item</p>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal Produk</span>
                      <span className="text-gray-900">
                        Rp{((order.total_cents - (order.shipping_cost_cents || 0)) / 100).toLocaleString("id-ID")}
                      </span>
                    </div>
                    {order.shipping_cost_cents && order.shipping_cost_cents > 0 && (
                      <div className="flex justify-between items-center text-sm mt-2">
                        <span className="text-gray-600">Ongkos Kirim</span>
                        <span className="text-gray-900">
                          Rp{(order.shipping_cost_cents / 100).toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">
                        Rp{(order.total_cents / 100).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="border-t pt-4">
                    <Link href={`/orders/${order.id}`} className="block">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Lihat Detail Pesanan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

