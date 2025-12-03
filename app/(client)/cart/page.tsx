"use client"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function CartPage() {
  const { state, updateQuantity, removeItem, clearCart } = useCart()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((sessionData) => {
        setSession(sessionData)
        setIsCheckingAuth(false)
      })
      .catch(() => {
        setIsCheckingAuth(false)
      })
  }, [])

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`
  }

  const handleCheckout = () => {
    if (state.items.length === 0) return
    if (isCheckingAuth) return

    if (session?.user) {
      router.push("/checkout")
    } else {
      router.push("/login?redirect=/cart")
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali</span>
          </Link>

          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-32 h-32 bg-muted/50 rounded-2xl flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/60" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-foreground">Keranjang Kosong</h2>
              <p className="text-muted-foreground max-w-md">Belum ada produk di keranjang Anda. Mulai belanja untuk menambahkan produk.</p>
            </div>
            <Link href="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Mulai Belanja
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali</span>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Keranjang Saya</h1>
            <span className="text-sm text-muted-foreground">{state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {state.items.map((item) => (
              <Card key={item.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-4 sm:gap-6">
                    {/* Product Image */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-muted/30 rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                      <Image
                        src={item.image || "/fotoberas.jpg"}
                        alt={item.name}
                        width={112}
                        height={112}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2 line-clamp-2">{item.name}</h3>
                      <p className="text-lg sm:text-xl font-bold text-primary mb-4">
                        {formatPrice(item.price)}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 border border-border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-9 w-9 rounded-r-none hover:bg-muted"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = Math.max(1, parseInt(e.target.value) || 1)
                              updateQuantity(item.id, newQuantity)
                            }}
                            className="w-16 text-center h-9 border-0 border-x border-border rounded-none focus-visible:ring-0"
                          />
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-9 w-9 rounded-l-none hover:bg-muted"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="hidden sm:flex flex-col items-end justify-between">
                      <p className="text-lg font-semibold text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-border/50 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Ringkasan Pesanan</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({state.totalItems} {state.totalItems === 1 ? 'item' : 'items'})</span>
                    <span className="text-foreground font-medium">{formatPrice(state.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ongkos Kirim</span>
                    <span className="text-foreground text-xs">Dihitung saat checkout</span>
                  </div>
                </div>

                <Separator className="mb-6" />

                <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(state.totalPrice)}</span>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-primary hover:bg-primary/90 h-11 text-base font-medium"
                    disabled={state.items.length === 0 || isCheckingAuth}
                  >
                    {isCheckingAuth ? 'Memuat...' : 'Lanjut ke Checkout'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearCart}
                    className="w-full h-10 border-border/50 hover:bg-muted"
                    disabled={state.items.length === 0}
                  >
                    Kosongkan Keranjang
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
