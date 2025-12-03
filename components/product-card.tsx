"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { useCart } from "@/contexts/cart-context"
import { ShoppingCart, Check, Package, Weight, Info, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: string
  imageUrl: string
  stock?: number
  weight_kg?: number | null
  price_cents?: number
}

export default function ProductCard({ 
  id, 
  name, 
  description, 
  price, 
  imageUrl, 
  stock,
  weight_kg,
  price_cents
}: ProductCardProps) {
  const { addItem } = useCart()
  const [addedToCart, setAddedToCart] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

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
  
  // Parse price to number (remove "Rp" and "." then convert to number)
  const priceNumber = Number.parseInt(price.replace(/[^0-9]/g, ""))
  const isOutOfStock = stock !== undefined && stock <= 0

  const handleCardClick = useCallback(() => {
    setIsModalOpen(true)
  }, [])



  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCheckingAuth) return

    if (session?.user) {
      addItem({
        id,
        name,
        price: priceNumber,
        image: imageUrl,
      })
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } else {
      router.push("/login?redirect=/")
    }
  }, [addItem, id, name, priceNumber, imageUrl, isCheckingAuth, session, router])

  return (
    <>
      <div onClick={handleCardClick} className="cursor-pointer">
        <Card className="w-full max-w-xs bg-card text-card-foreground border-border rounded-lg overflow-hidden shadow-lg flex flex-col hover:shadow-xl transition-shadow">
        <CardHeader className="p-0">
          <div className="w-full h-56 bg-muted flex items-center justify-center">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={name}
              width={400}
              height={300}
              className="w-full h-full object-contain p-4"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 flex flex-col gap-3 flex-1">
          <CardTitle className="text-xl font-semibold font-serif text-balance">
            {name}
          </CardTitle>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}

          {stock !== undefined && (
            <div className="mt-3 text-sm">
              <span
                className={`font-medium ${
                  isOutOfStock ? "text-red-600" : "text-green-600"
                }`}
              >
                {isOutOfStock ? "Stok Habis" : `Stok: ${stock}`}
              </span>
            </div>
          )}

          {/* Harga di bawah stok */}
          <span className="text-2xl font-bold text-primary mt-2">
            {price}
          </span>
        </CardContent>
        {/* Tombol di bagian bawah card */}
        <CardFooter className="mt-auto p-6 pt-0">
          <Button 
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full rounded-full px-6 py-2 transition-all duration-200 ${
              addedToCart 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : isOutOfStock
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {addedToCart ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Ditambahkan!
              </>
            ) : isOutOfStock ? (
              <>
                Stok Habis
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Tambah ke Keranjang
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>

    {/* Product Detail Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-4xl w-[92vw] max-h-[90vh] overflow-hidden p-0 gap-0 bg-white rounded-xl shadow-2xl">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Compact Header with Image and Title */}
          <div className="flex items-start gap-4 p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50/50 to-white">
            {/* Product Image - Compact */}
            <div className="relative w-32 h-32 lg:w-40 lg:h-40 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={name}
                fill
                className="object-contain p-2"
                priority
                sizes="160px"
              />
            </div>
            
            {/* Title and Price - Compact */}
            <div className="flex-1 min-w-0 space-y-2">
              <DialogTitle className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight line-clamp-2">
                {name}
              </DialogTitle>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl font-black text-primary">
                  {price}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  per unit
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Description - Compact */}
              {description && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-base text-gray-900">Deskripsi</h3>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed pl-6">
                    {description}
                  </p>
                </div>
              )}

              {/* Product Info - Compact Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Stock */}
                <div className={`p-4 rounded-lg border transition-colors ${
                  stock !== undefined && stock > 0
                    ? "bg-green-50/50 border-green-300"
                    : "bg-red-50/50 border-red-300"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-md ${
                      stock !== undefined && stock > 0
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}>
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Stok</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    stock !== undefined && stock > 0 
                      ? "text-green-700" 
                      : "text-red-700"
                  }`}>
                    {stock !== undefined && stock > 0 ? stock : "Habis"}
                  </p>
                  {stock !== undefined && stock > 0 && stock < 10 && (
                    <p className="text-xs text-orange-700 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Terbatas
                    </p>
                  )}
                </div>

                {/* Weight */}
                {weight_kg != null && weight_kg > 0 && (
                  <div className="p-4 rounded-lg border bg-blue-50/50 border-blue-300">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-md bg-blue-600">
                        <Weight className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Berat</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {typeof weight_kg === 'number' ? weight_kg.toFixed(2) : weight_kg} kg
                    </p>
                  </div>
                )}
              </div>

              {/* Add to Cart Button - Compact */}
              <Button 
                onClick={handleAddToCart}
                disabled={isOutOfStock || isCheckingAuth}
                size="lg"
                className={`w-full h-11 text-base font-semibold rounded-lg transition-all ${
                  addedToCart 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Ditambahkan
                  </>
                ) : isOutOfStock ? (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Stok Habis
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Tambah ke Keranjang
                  </>
                )}
              </Button>

              {/* Trust Badges - Compact */}
              <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">Asli</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="font-medium">Terjamin</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="font-medium">Cepat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
