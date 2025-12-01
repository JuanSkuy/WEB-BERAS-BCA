"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

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
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
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
      <div className="container mx-auto py-8">
        <div className="text-center">Memuat riwayat pesanan...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Riwayat Pesanan</h1>
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
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Anda belum memiliki pesanan</p>
              <Link href="/">
                <Button>Mulai Berbelanja</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Pesanan #{order.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(order.created_at), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                  <Badge className={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Items */}
                  <div>
                    <h3 className="font-semibold mb-2">Produk:</h3>
                    <div className="space-y-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm bg-gray-50 p-2 rounded"
                          >
                            <span>
                              {item.product_name} × {item.quantity}
                            </span>
                            <span className="font-medium">
                              Rp{(item.price_cents / 100).toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Tidak ada item</p>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold">
                        Rp{(order.total_cents / 100).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/orders/${order.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Lihat Detail
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
