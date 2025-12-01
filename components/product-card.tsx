"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { useCart } from "@/contexts/cart-context"
import { ShoppingCart, Check } from "lucide-react"
import { useState } from "react"

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: string
  imageUrl: string
  stock?: number
}

export default function ProductCard({ id, name, description, price, imageUrl, stock }: ProductCardProps) {
  const { addItem } = useCart()
  const [addedToCart, setAddedToCart] = useState(false)
  
  // Parse price to number (remove "Rp" and "." then convert to number)
  const priceNumber = Number.parseInt(price.replace(/[^0-9]/g, ""))
  const isOutOfStock = stock !== undefined && stock <= 0

  const handleClick = useCallback(() => {
    const el = document.getElementById("products")
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    addItem({
      id,
      name,
      price: priceNumber,
      image: imageUrl,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }, [addItem, id, name, priceNumber, imageUrl])

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <Card className="w-full max-w-sm bg-card text-card-foreground border-border rounded-lg overflow-hidden shadow-lg">
        <CardHeader className="p-0">
          <div className="w-full h-72 bg-muted flex items-center justify-center">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={name}
              width={400}
              height={300}
              className="w-full h-full object-contain p-4"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <CardTitle className="text-2xl font-semibold mb-2 font-serif text-balance">{name}</CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          {stock !== undefined && (
            <div className="mt-3 text-sm">
              <span className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                {isOutOfStock ? 'Stok Habis' : `Stok: ${stock}`}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center p-6 pt-0">
          <span className="text-2xl font-bold text-primary">{price}</span>
          <Button 
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`rounded-full px-6 py-2 transition-all duration-200 ${
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
  )
}
