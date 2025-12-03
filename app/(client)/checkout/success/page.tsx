"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Home, Package } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/contexts/cart-context"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()
  const orderId = searchParams.get("order_id")
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Clear cart when success page loads (as backup)
    clearCart()
    
    if (orderId) {
      // Fetch order details
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          setOrder(data.order)
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [orderId, clearCart])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Memuat informasi pesanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center shadow-sm">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>

              {/* Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Pembayaran Berhasil!</h1>
                <p className="text-muted-foreground">
                  Terima kasih! Pesanan Anda telah diterima dan akan segera diproses.
                </p>
              </div>

              {/* Order Info */}
              {order && (
                <div className="bg-muted/50 rounded-xl p-6 space-y-4 border border-border/50 text-left">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                    <Package className="w-4 h-4 text-primary" />
                    <span>Detail Pesanan</span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Nomor Pesanan</span>
                      <span className="font-medium text-foreground">{order.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-foreground capitalize">{order.status}</span>
                    </div>
                    {order.payment_invoice_number && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Invoice Number</span>
                        <span className="font-medium text-foreground">{order.payment_invoice_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 text-left">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Langkah Selanjutnya</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Kami akan mengirimkan konfirmasi via email/WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Pesanan akan dikirim dalam 1-2 hari kerja</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Anda akan menerima nomor resi pengiriman</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/")}
                >
                  Kembali ke Beranda
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => router.push("/orders")}
                >
                  Lihat Pesanan Saya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

