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
import { Separator } from "@/components/ui/separator"
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
import { CheckCircle, Package, CreditCard, Home, ArrowRight, User, Phone, Mail, MapPin, ArrowLeft, Loader2, Plus, Trash2, Check } from "lucide-react"
import Link from "next/link"
import { calculateShippingCost } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SavedAddress {
  id: string
  user_id?: string
  label?: string | null
  recipient_name: string
  phone: string
  address: string
  city: string
  postal_code: string
  is_default?: boolean
  created_at?: string
  updated_at?: string
  
  email?: string
  postal?: string
  name?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { state, clearCart } = useCart()

  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [addressFormData, setAddressFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postal: "",
    label: "",
  })

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((sessionData) => {
        if (!sessionData.user) {
          router.push("/login?redirect=/checkout")
        } else {
          setSession(sessionData)
          setIsCheckingAuth(false)
        }
      })
      .catch(() => {
        router.push("/login?redirect=/checkout")
      })
  }, [router])

  
  useEffect(() => {
    // Check if user is authenticated
    if (session?.user && !isCheckingAuth) {
      console.log("Fetching addresses for user:", session.user)
      setIsLoadingAddresses(true)
      fetch("/api/addresses")
        .then((res) => {
          console.log("Addresses API response status:", res.status)
          if (!res.ok) {
            // Try to get error message from response
            return res.json().then((errorData) => {
              console.error("Addresses API error:", errorData)
              throw new Error(errorData.error || `Failed to fetch addresses: ${res.status} ${res.statusText}`)
            })
          }
          return res.json()
        })
        .then((data) => {
          console.log("Addresses API data:", data)
          console.log("Addresses API data type:", typeof data)
          console.log("Addresses API data.addresses:", data.addresses)
          console.log("Addresses API data.addresses type:", typeof data.addresses)
          console.log("Addresses API data.addresses isArray:", Array.isArray(data.addresses))
          
          if (data.error) {
            throw new Error(data.error)
          }
          
          // Ensure addresses is always an array
          const addresses = Array.isArray(data.addresses) ? data.addresses : (data.addresses ? [data.addresses] : [])
          console.log("Setting saved addresses:", addresses)
          console.log("Addresses count:", addresses.length)
          setSavedAddresses(addresses)
          
          // Auto-select default address if available
          if (addresses.length > 0) {
            const defaultAddress = addresses.find((addr: SavedAddress) => addr.is_default)
            if (defaultAddress) {
              console.log("Auto-selecting default address:", defaultAddress.id)
              setSelectedAddressId(defaultAddress.id)
            }
          }
        })
        .catch((error) => {
          console.error("Error loading saved addresses:", error)
          // Only show error if it's not an auth error (401)
          if (error.message && !error.message.includes("Unauthorized")) {
            setSubmitError(`Gagal memuat alamat tersimpan: ${error.message}`)
          }
          // Set empty array on error so UI doesn't break
          setSavedAddresses([])
        })
        .finally(() => {
          setIsLoadingAddresses(false)
        })
    } else {
      console.log("Not fetching addresses - session:", session, "isCheckingAuth:", isCheckingAuth)
    }
  }, [session, isCheckingAuth])

  
  useEffect(() => {
    if (selectedAddressId && savedAddresses.length > 0) {
      const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId)
      if (selectedAddress) {
        
        setTimeout(() => {
          const form = document.querySelector('form') as HTMLFormElement
          if (form) {
            const nameInput = form.querySelector('[name="name"]') as HTMLInputElement
            const phoneInput = form.querySelector('[name="phone"]') as HTMLInputElement
            const emailInput = form.querySelector('[name="email"]') as HTMLInputElement
            const addressInput = form.querySelector('[name="address"]') as HTMLTextAreaElement
            const cityInput = form.querySelector('[name="city"]') as HTMLInputElement
            const postalInput = form.querySelector('[name="postal"]') as HTMLInputElement

            if (nameInput) {
              nameInput.value = selectedAddress.recipient_name || selectedAddress.name || ""
              nameInput.dispatchEvent(new Event('input', { bubbles: true }))
            }
            if (phoneInput) {
              phoneInput.value = selectedAddress.phone || ""
              phoneInput.dispatchEvent(new Event('input', { bubbles: true }))
            }
            if (emailInput) {
              emailInput.value = selectedAddress.email || ""
              emailInput.dispatchEvent(new Event('input', { bubbles: true }))
            }
            if (addressInput) {
              addressInput.value = selectedAddress.address || ""
              addressInput.dispatchEvent(new Event('input', { bubbles: true }))
            }
            if (cityInput) {
              cityInput.value = selectedAddress.city || ""
              cityInput.dispatchEvent(new Event('input', { bubbles: true }))
            }
            if (postalInput) {
              postalInput.value = selectedAddress.postal_code || selectedAddress.postal || ""
              postalInput.dispatchEvent(new Event('input', { bubbles: true }))
            }
          }
        }, 100)
      }
    } else if (!selectedAddressId && savedAddresses.length > 0) {
      
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.reset()
      }
    }
  }, [selectedAddressId, savedAddresses])

  const handleSaveAddress = async () => {
    if (!addressFormData.name || !addressFormData.phone || !addressFormData.address || !addressFormData.city || !addressFormData.postal) {
      setSubmitError("Semua field wajib harus diisi")
      return
    }

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: addressFormData.label || null,
          recipient_name: addressFormData.name,
          phone: addressFormData.phone,
          address: addressFormData.address,
          city: addressFormData.city,
          postal_code: addressFormData.postal,
          is_default: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setSubmitError(error.error || "Gagal menyimpan alamat")
        return
      }

      const data = await response.json()
      const newAddress = data.address

      
      setSavedAddresses([...savedAddresses, newAddress])
      
      
      setAddressFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        postal: "",
        label: "",
      })
      setIsAddAddressOpen(false)
      setSelectedAddressId(newAddress.id)
      setSubmitError(null)
    } catch (error) {
      console.error("Error saving address:", error)
      setSubmitError("Terjadi kesalahan saat menyimpan alamat")
    }
  }

  const handleSaveCurrentAddress = async () => {
    const form = document.querySelector('form') as HTMLFormElement
    if (!form) return

    const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value || ""
    const phone = (form.querySelector('[name="phone"]') as HTMLInputElement)?.value || ""
    const email = (form.querySelector('[name="email"]') as HTMLInputElement)?.value || ""
    const address = (form.querySelector('[name="address"]') as HTMLTextAreaElement)?.value || ""
    const city = (form.querySelector('[name="city"]') as HTMLInputElement)?.value || ""
    const postal = (form.querySelector('[name="postal"]') as HTMLInputElement)?.value || ""

    if (!name || !phone || !address || !city || !postal) {
      setSubmitError("Lengkapi semua field wajib terlebih dahulu")
      return
    }

    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: null,
          recipient_name: name,
          phone: phone,
          address: address,
          city: city,
          postal_code: postal,
          is_default: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setSubmitError(error.error || "Gagal menyimpan alamat")
        return
      }

      const data = await response.json()
      const newAddress = data.address

      
      setSavedAddresses([...savedAddresses, newAddress])
      setSelectedAddressId(newAddress.id)
      setSubmitError(null)
    } catch (error) {
      console.error("Error saving address:", error)
      setSubmitError("Terjadi kesalahan saat menyimpan alamat")
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    
    const wasSelected = selectedAddressId === addressId
    const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId)
    setSavedAddresses(updatedAddresses)
    
    if (wasSelected) {
      setSelectedAddressId(null)
      
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.reset()
      }
    }

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        
        const error = await response.json()
        setSubmitError(error.error || "Gagal menghapus alamat")
        
        const addressesResponse = await fetch("/api/addresses")
        if (addressesResponse.ok) {
          const data = await addressesResponse.json()
          setSavedAddresses(data.addresses || [])
          if (wasSelected && data.addresses?.length > 0) {
            const defaultAddr = data.addresses.find((addr: SavedAddress) => addr.is_default) || data.addresses[0]
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id)
            }
          }
        }
        return
      }

      
      const addressesResponse = await fetch("/api/addresses")
      if (addressesResponse.ok) {
        const data = await addressesResponse.json()
        setSavedAddresses(data.addresses || [])
        
        
        if (wasSelected) {
          if (data.addresses?.length > 0) {
            const defaultAddr = data.addresses.find((addr: SavedAddress) => addr.is_default) || data.addresses[0]
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id)
            } else {
              setSelectedAddressId(null)
            }
          } else {
            setSelectedAddressId(null)
          }
        } else {
          
          const stillExists = data.addresses?.some((addr: SavedAddress) => addr.id === selectedAddressId)
          if (!stillExists && data.addresses?.length > 0) {
            const defaultAddr = data.addresses.find((addr: SavedAddress) => addr.is_default) || data.addresses[0]
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id)
            } else {
              setSelectedAddressId(null)
            }
          }
        }
      }
      
      setSubmitError(null)
    } catch (error) {
      console.error("Error deleting address:", error)
      setSubmitError("Terjadi kesalahan saat menghapus alamat")
      
      const addressesResponse = await fetch("/api/addresses")
      if (addressesResponse.ok) {
        const data = await addressesResponse.json()
        setSavedAddresses(data.addresses || [])
        if (wasSelected && data.addresses?.length > 0) {
          const defaultAddr = data.addresses.find((addr: SavedAddress) => addr.is_default) || data.addresses[0]
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
          }
        }
      }
    }
  }

  
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Mengecek otentikasi...</p>
        </div>
      </div>
    )
  }

  
  if (typeof window !== "undefined" && state.items.length === 0) {
    
    const savedCart = localStorage.getItem("cart")
    if (savedCart && JSON.parse(savedCart).length > 0) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Memuat keranjang...</p>
          </div>
        </div>
      )
    }
  }

  
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="w-24 h-24 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Package className="w-12 h-12 text-muted-foreground/60" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Keranjang Kosong</h1>
          <p className="text-muted-foreground">
            Tidak ada item di keranjang Anda
          </p>
          </div>
          <Button onClick={() => router.push("/")} size="lg">Kembali ke Beranda</Button>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`
  }

  
  const totalQuantity = state.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  )
  const shippingCost = calculateShippingCost(totalQuantity)
  const totalWithShipping = state.totalPrice + shippingCost

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const address = formData.get("address") as string
    const city = formData.get("city") as string
    const postal = formData.get("postal") as string

    
    if (!name || !phone || !address || !city || !postal) {
      setSubmitError("Semua field harus diisi")
      setIsSubmitting(false)
      return
    }

    
    

    
    const orderItems = state.items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }))

    
    const shippingCostCents = shippingCost * 100

    
    try {
      
      const requestBody: any = {
        items: orderItems,
        payment_method: paymentMethod,
        shipping_cost_cents: shippingCostCents,
      };

      
      if (selectedAddressId) {
        requestBody.address_id = selectedAddressId;
      } else {
        
        requestBody.customer_info = {
          name,
          phone,
          email,
          address,
          city,
          postal,
        };
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        setSubmitError(error.error || "Gagal membuat pesanan")
        setIsSubmitting(false)
        return
      }

      const data = await response.json()
      console.log("Order created:", data)
      
      // Clear cart immediately after successful order creation
      clearCart()
      
      // If payment method is Xendit, create payment and redirect
      if (paymentMethod === "xendit" && data.order?.id) {
        try {
          // Get customer info from saved address or form
          let customerInfoForPayment: any;
          if (selectedAddressId) {
            // Use saved address data
            const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
            if (selectedAddress) {
              customerInfoForPayment = {
                name: selectedAddress.recipient_name || selectedAddress.name,
                phone: selectedAddress.phone,
                email: selectedAddress.email || email,
                address: selectedAddress.address,
                city: selectedAddress.city,
                postal: selectedAddress.postal_code || selectedAddress.postal,
              };
            } else {
              // Fallback to form data if saved address not found
              customerInfoForPayment = { name, phone, email, address, city, postal };
            }
          } else {
            // Use form data
            customerInfoForPayment = { name, phone, email, address, city, postal };
          }

          const paymentResponse = await fetch("/api/payment/xendit/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_id: data.order.id,
              customer_info: customerInfoForPayment,
              items: state.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
            }),
          })

          if (!paymentResponse.ok) {
            const error = await paymentResponse.json()
            setSubmitError(error.error || "Gagal membuat payment gateway")
            setIsSubmitting(false)
            return
          }

          const paymentData = await paymentResponse.json()
          
          
          if (paymentData.payment_url) {
            window.location.href = paymentData.payment_url
            return
          }
        } catch (error) {
          console.error("Error creating Xendit payment:", error)
          setSubmitError("Terjadi kesalahan saat membuat payment gateway")
          setIsSubmitting(false)
          return
        }
      }
      
      
      setIsConfirmOpen(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error("Error:", error)
      setSubmitError("Terjadi kesalahan saat memproses pesanan")
      setIsSubmitting(false)
    }
  }

  const handleOrderSuccess = () => {
    setIsConfirmOpen(false)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali ke Keranjang</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          <p className="text-muted-foreground mt-2">Lengkapi informasi pengiriman untuk melanjutkan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Saved Addresses Section */}
              {(() => {
                console.log("Render - isCheckingAuth:", isCheckingAuth, "isLoadingAddresses:", isLoadingAddresses, "savedAddresses:", savedAddresses, "savedAddresses.length:", savedAddresses?.length);
                return null;
              })()}
              {!isCheckingAuth && (
                <>
                  {isLoadingAddresses ? (
                    <Card className="border-border/50 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <p className="text-muted-foreground">Memuat alamat tersimpan...</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : savedAddresses && savedAddresses.length > 0 ? (
                    <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Pilih Alamat Tersimpan
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({savedAddresses.length} {savedAddresses.length === 1 ? 'alamat' : 'alamat'})
                        </span>
                      </CardTitle>
                      <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Tambah Alamat Baru
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Tambah Alamat Baru</DialogTitle>
                            <DialogDescription>
                              Simpan alamat untuk mempermudah checkout di masa depan
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-label">Label Alamat (Opsional)</Label>
                              <Input
                                id="new-label"
                                placeholder="Contoh: Rumah, Kantor, dll"
                                value={addressFormData.label}
                                onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-name">Nama Lengkap *</Label>
                              <Input
                                id="new-name"
                                required
                                placeholder="Masukkan nama lengkap"
                                value={addressFormData.name}
                                onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })}
                                className="h-11"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-phone">Nomor Telepon *</Label>
                                <Input
                                  id="new-phone"
                                  type="tel"
                                  required
                                  placeholder="08xxxxxxxxxx"
                                  value={addressFormData.phone}
                                  onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-email">Email</Label>
                                <Input
                                  id="new-email"
                                  type="email"
                                  placeholder="email@example.com"
                                  value={addressFormData.email}
                                  onChange={(e) => setAddressFormData({ ...addressFormData, email: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-address">Alamat Lengkap *</Label>
                              <Textarea
                                id="new-address"
                                required
                                placeholder="Jalan, nomor rumah, RT/RW, kelurahan"
                                rows={3}
                                value={addressFormData.address}
                                onChange={(e) => setAddressFormData({ ...addressFormData, address: e.target.value })}
                                className="resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-city">Kota *</Label>
                                <Input
                                  id="new-city"
                                  required
                                  placeholder="Nama kota"
                                  value={addressFormData.city}
                                  onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-postal">Kode Pos *</Label>
                                <Input
                                  id="new-postal"
                                  required
                                  placeholder="12345"
                                  value={addressFormData.postal}
                                  onChange={(e) => setAddressFormData({ ...addressFormData, postal: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddAddressOpen(false)}>
                              Batal
                            </Button>
                            <Button type="button" onClick={handleSaveAddress}>
                              Simpan Alamat
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      value={selectedAddressId || ""} 
                      onValueChange={(value) => setSelectedAddressId(value || null)}
                      className="space-y-3"
                    >
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                              : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedAddressId(addr.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex items-start pt-1">
                              <RadioGroupItem 
                                value={addr.id} 
                                id={`address-${addr.id}`}
                                className="border-primary"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <label 
                              htmlFor={`address-${addr.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {selectedAddressId === addr.id && (
                                      <Check className="w-4 h-4 text-primary" />
                                    )}
                                    {addr.label && (
                                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                        {addr.label}
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-semibold text-foreground text-base mb-1">
                                    {addr.recipient_name || addr.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {addr.phone}
                                  </p>
                                  {addr.email && (
                                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                                      <Mail className="w-3.5 h-3.5" />
                                      {addr.email}
                                    </p>
                                  )}
                                  <p className="text-sm text-foreground mt-2 mb-1 flex items-start gap-1">
                                    <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                                    <span>{addr.address}</span>
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {addr.city}, {addr.postal_code || addr.postal}
                                  </p>
                                  {addr.is_default && (
                                    <span className="inline-block mt-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                      Alamat Default
                                    </span>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    if (confirm("Apakah Anda yakin ingin menghapus alamat ini?")) {
                                      await handleDeleteAddress(addr.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    {/* Option to use new address */}
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          !selectedAddressId
                            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                            : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                        }`}
                        onClick={() => setSelectedAddressId(null)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex items-start pt-1">
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                              !selectedAddressId 
                                ? "border-primary bg-primary" 
                                : "border-border"
                            }`}>
                              {!selectedAddressId && (
                                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Plus className="w-4 h-4 text-primary" />
                              <span className="font-medium text-foreground">Gunakan Alamat Baru</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 ml-6">
                              Isi form di bawah untuk menggunakan alamat baru
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  ) : null}
                </>
              )}

              {/* Informasi Pembeli */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      {selectedAddressId ? "Informasi Pembeli (Dari Alamat Tersimpan)" : "Informasi Pembeli"}
                    </CardTitle>
                    {savedAddresses.length === 0 && (
                      <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Simpan Alamat
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Tambah Alamat Baru</DialogTitle>
                            <DialogDescription>
                              Simpan alamat untuk mempermudah checkout di masa depan
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-label">Label Alamat (Opsional)</Label>
                              <Input
                                id="new-label"
                                placeholder="Contoh: Rumah, Kantor, dll"
                                value={addressFormData.label}
                                onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-name">Nama Lengkap *</Label>
                              <Input
                                id="new-name"
                                required
                                placeholder="Masukkan nama lengkap"
                                value={addressFormData.name}
                                onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })}
                                className="h-11"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-phone">Nomor Telepon *</Label>
                                <Input
                                  id="new-phone"
                                  type="tel"
                                  required
                                  placeholder="08xxxxxxxxxx"
                                  value={addressFormData.phone}
                                  onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-email">Email</Label>
                                <Input
                                  id="new-email"
                                  type="email"
                                  placeholder="email@example.com"
                                  value={addressFormData.email}
                                  onChange={(e) => setAddressFormData({ ...addressFormData, email: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-address">Alamat Lengkap *</Label>
                              <Textarea
                                id="new-address"
                                required
                                placeholder="Jalan, nomor rumah, RT/RW, kelurahan"
                                rows={3}
                                value={addressFormData.address}
                                onChange={(e) => setAddressFormData({ ...addressFormData, address: e.target.value })}
                                className="resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-city">Kota *</Label>
                                <Input
                                  id="new-city"
                                  required
                                  placeholder="Nama kota"
                                  value={addressFormData.city}
                                  onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="new-postal">Kode Pos *</Label>
                                <Input
                                  id="new-postal"
                                  required
                                  placeholder="12345"
                                  value={addressFormData.postal}
                                  onChange={(e) => setAddressFormData({ ...addressFormData, postal: e.target.value })}
                                  className="h-11"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddAddressOpen(false)}>
                              Batal
                            </Button>
                            <Button type="button" onClick={handleSaveAddress}>
                              Simpan Alamat
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Nama Lengkap</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      placeholder="Masukkan nama lengkap"
                      className="h-11 border-border/50 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        Nomor Telepon
                      </Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        type="tel" 
                        required 
                        placeholder="08xxxxxxxxxx"
                        className="h-11 border-border/50 focus-visible:ring-primary"
                      />
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email (Opsional)
                      </Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="email@example.com"
                        className="h-11 border-border/50 focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Alamat Lengkap
                    </Label>
                    <Textarea 
                      id="address" 
                      name="address" 
                      required 
                      placeholder="Jalan, nomor rumah, RT/RW, kelurahan"
                      rows={3}
                      className="border-border/50 focus-visible:ring-primary resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">Kota</Label>
                      <Input 
                        id="city" 
                        name="city" 
                        required 
                        placeholder="Nama kota"
                        className="h-11 border-border/50 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postal" className="text-sm font-medium">Kode Pos</Label>
                      <Input 
                        id="postal" 
                        name="postal" 
                        required 
                        placeholder="12345"
                        className="h-11 border-border/50 focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Save Current Address Button */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveCurrentAddress}
                      className="w-full sm:w-auto gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Simpan Alamat Ini
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Metode Pembayaran */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-colors cursor-pointer bg-muted/30">
                        <RadioGroupItem value="xendit" id="xendit" className="border-primary" />
                        <Label htmlFor="xendit" className="flex-1 cursor-pointer font-medium">
                          <div className="flex items-center gap-2">
                            <span>Pembayaran Online (Xendit)</span>
                            <span className="text-xs text-muted-foreground">Virtual Account, E-Wallet, QRIS, dll</span>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-colors cursor-pointer bg-muted/30">
                        <RadioGroupItem value="cod" id="cod" className="border-primary" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer font-medium">
                          Bayar di Tempat (COD)
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses Pesanan...
                  </>
                ) : (
                  <>
                    Pesan Sekarang
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Error Message */}
              {submitError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
                  {submitError}
                </div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b border-border/30 last:border-0">
                      <div className="w-16 h-16 bg-muted/30 rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                        <Image
                          src={item.image || "/fotoberas.jpg"}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-contain p-1.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-1">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mb-1">Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({state.totalItems} {state.totalItems === 1 ? 'item' : 'items'})</span>
                    <span className="text-foreground font-medium">{formatPrice(state.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ongkos Kirim</span>
                    <span className="text-foreground font-medium">{formatPrice(shippingCost)}</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatPrice(totalWithShipping)}</span>
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
            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center shadow-sm">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
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
            <div className="bg-muted/50 rounded-xl p-5 space-y-4 border border-border/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Package className="w-4 h-4 text-primary" />
                <span>Detail Pesanan</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Item</span>
                  <span className="font-medium text-foreground">{state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pembayaran</span>
                  <span className="font-medium text-foreground capitalize flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    {paymentMethod === "xendit" ? "Pembayaran Online (Xendit)" : "Bayar di Tempat (COD)"}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-xl text-primary">{formatPrice(totalWithShipping)}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-left">Langkah Selanjutnya</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Kami akan mengirimkan konfirmasi via WhatsApp</span>
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
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <AlertDialogCancel className="w-full sm:flex-1 order-2 sm:order-1 border-border/50">
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
