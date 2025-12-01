"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState, useEffect } from "react"
import { useCart } from "@/contexts/cart-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle, Package, CreditCard, Home, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
  const router = useRouter()
  const { state, clearCart } = useCart()

  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Add a small delay to ensure cart context has loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  // Check if cart items exist in localStorage but not in state
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart && state.items.length === 0) {
      try {
        const cartItems = JSON.parse(savedCart)
        if (Array.isArray(cartItems) && cartItems.length > 0) {
          console.log("Checkout page - Cart items exist in localStorage but not in state, waiting for cart context to load...")
        }
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error)
      }
    }
  }, [state.items.length])

  // Show loading while cart is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Memuat keranjang...</p>
        </div>
      </div>
    )
  }

  // Show loading while cart is being loaded from localStorage
  if (typeof window !== 'undefined' && state.items.length === 0) {
    // Check if cart is actually empty or just not loaded yet
    const savedCart = localStorage.getItem("cart")
    console.log("Checkout page - savedCart:", savedCart)
    console.log("Checkout page - state.items:", state.items)
    if (savedCart && JSON.parse(savedCart).length > 0) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Memuat keranjang...</p>
          </div>
        </div>
      )
    }
  }

  // Show empty cart message if cart is actually empty
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Keranjang Kosong</h1>
          <p className="text-muted-foreground">Tidak ada item di keranjang Anda</p>
          <Button onClick={() => router.push("/")}>
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    // Get form data
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const address = formData.get("address") as string
    const city = formData.get("city") as string
    const postal = formData.get("postal") as string

    // Validate form data
    if (!name || !phone || !address || !city || !postal) {
      setSubmitError("Semua field harus diisi")
      setIsSubmitting(false)
      return
    }

    // Get user session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(async (session) => {
        const userId = session.user?.id

        // Prepare order items
        const orderItems = state.items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        }))

        // Submit order to API
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId || null,
            items: orderItems,
            payment_method: paymentMethod,
            customer_info: {
              name,
              phone,
              email,
              address,
              city,
              postal,
            },
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          setSubmitError(error.error || "Gagal membuat pesanan")
          setIsSubmitting(false)
          return
        }

        const data = await response.json()
        console.log("Order created:", data)
        setIsConfirmOpen(true)
        setIsSubmitting(false)
      })
      .catch((error) => {
        console.error("Error:", error)
        setSubmitError("Terjadi kesalahan saat memproses pesanan")
        setIsSubmitting(false)
      })
  }

  const handleOrderSuccess = () => {
    clearCart()
    setIsConfirmOpen(false)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8 md:pt-12 pb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8 text-foreground">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Informasi Pembeli</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" name="name" required placeholder="Masukkan nama lengkap" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input id="phone" name="phone" type="tel" required placeholder="08xxxxxxxxxx" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="email@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Lengkap</Label>
                    <Textarea id="address" name="address" required placeholder="Jalan, nomor rumah, RT/RW" rows={3} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Kota</Label>
                      <Input id="city" name="city" required placeholder="Nama kota" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal">Kode Pos</Label>
                      <Input id="postal" name="postal" required placeholder="12345" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Metode Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        Bayar di Tempat (COD)
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Memproses..." : "Pesan Sekarang"}
              </Button>

              {submitError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {submitError}
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="font-serif">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image || "/fotoberas.jpg"}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Item</span>
                    <span className="text-foreground">{state.totalItems} item</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(state.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ongkos Kirim</span>
                    <span className="text-foreground">Dihitung saat konfirmasi</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">{formatPrice(state.totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            {/* Header */}
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                Pesanan Berhasil!
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-muted-foreground">
                Terima kasih! Pesanan Anda telah diterima dan akan segera diproses.
              </AlertDialogDescription>
            </div>

            {/* Order Details Card */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>Detail Pesanan</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Item</span>
                  <span className="font-medium text-foreground">{state.totalItems} item</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pembayaran</span>
                  <span className="font-medium text-foreground capitalize flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Bayar di Tempat (COD)
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-lg text-primary">{formatPrice(state.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Langkah Selanjutnya</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Kami akan mengirimkan konfirmasi via WhatsApp</li>
                <li>• Pesanan akan dikirim dalam 1-2 hari kerja</li>
                <li>• Anda akan menerima nomor resi pengiriman</li>
              </ul>
            </div>
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <AlertDialogCancel className="w-full sm:flex-1 order-2 sm:order-1">
              Lihat Pesanan Lain
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleOrderSuccess} 
              className="w-full sm:flex-1 order-1 sm:order-2 bg-primary hover:bg-primary/90"
            >
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
              <ArrowRight className="w-4 h-4 ml-2" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
