"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

const statusTimeline = [
  { key: "pending", label: "Pesanan Dibuat" },
  { key: "processing", label: "Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "delivered", label: "Selesai" },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
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
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/orders");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        const foundOrder = data.orders?.find((o: Order) => o.id === orderId);
        if (!foundOrder) {
          setError("Pesanan tidak ditemukan");
          return;
        }
        setOrder(foundOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [router, orderId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Memuat detail pesanan...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-800 mb-4">{error || "Pesanan tidak ditemukan"}</p>
              <Link href="/orders">
                <Button>Kembali ke Riwayat Pesanan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatusIndex = statusTimeline.findIndex(
    (s) => s.key === order.status
  );

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Link href="/orders" className="mb-4 inline-block">
        <Button variant="outline">← Kembali</Button>
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pesanan #{order.id.slice(0, 8)}</CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Dibuat{" "}
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
      </Card>

      {/* Status Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusTimeline.map((item, index) => (
              <div key={item.key} className="flex items-center">
                <div className="flex flex-col items-center mr-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      currentStatusIndex >= index
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  >
                    {currentStatusIndex >= index ? "✓" : index + 1}
                  </div>
                  {index < statusTimeline.length - 1 && (
                    <div
                      className={`w-1 h-8 ${
                        currentStatusIndex >= index + 1
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      currentStatusIndex >= index
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {item.label}
                  </p>
                  {currentStatusIndex === index && order.updated_at && (
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(order.updated_at), {
                        addSuffix: true,
                        locale: idLocale,
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {order.status === "cancelled" && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                Pesanan ini telah dibatalkan
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Produk dalam Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Jumlah: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Rp{(item.price_cents / 100).toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-gray-600">
                      per item
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Tidak ada item</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp{(order.total_cents / 100).toLocaleString("id-ID")}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-bold">Total:</span>
              <span className="text-2xl font-bold">
                Rp{(order.total_cents / 100).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
