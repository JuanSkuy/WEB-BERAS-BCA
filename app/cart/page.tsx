"use client"

import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { state, updateQuantity, removeItem, clearCart } = useCart()
  const router = useRouter()

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`
  }

  const handleCheckout = () => {
    if (state.items.length === 0) return
    router.push("/checkout")
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 pt-8 md:pt-12 pb-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Keranjang</h1>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Keranjang Kosong</h2>
              <p className="text-muted-foreground">Belum ada produk di keranjang Anda</p>
            </div>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90">
                Mulai Belanja
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 pt-8 md:pt-12 pb-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Keranjang</h1>
          <Badge variant="secondary" className="ml-auto">
            {state.totalItems} item
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                      <p className="text-lg font-bold text-primary mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8"
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
                          className="w-16 text-center h-8"
                        />
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="font-serif">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
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
                    <span className="text-foreground">Dihitung saat checkout</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{formatPrice(state.totalPrice)}</span>
                </div>

                <div className="space-y-2 pt-4">
                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={state.items.length === 0}
                  >
                    Lanjut ke Checkout
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearCart}
                    className="w-full"
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
