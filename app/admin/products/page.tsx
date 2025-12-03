"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price_cents: number;
  stock: number;
  image: string | null;
  description: string | null;
  category_id: string | null;
  category_name: string | null;
  weight_kg: number | null;
}


const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/admin/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.products || [];
};

const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch("/api/admin/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return data.categories || [];
};

export default function AdminProductsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price_cents: "",
    stock: "",
    image: "",
    description: "",
    category_id: "",
    weight_kg: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const queryClient = useQueryClient();

  
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
    isFetching,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    refetchOnWindowFocus: false,
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });


  useEffect(() => {
    if (productsLoading) {
      toast.loading("Memuat data produk...", { id: "fetch-products" });
    } else if (productsError) {
      toast.error("Gagal memuat data produk", {
        id: "fetch-products",
        description: "Silakan refresh halaman atau coba lagi",
      });
    } else if (products.length > 0 && !isFetching) {
      toast.success("Data produk berhasil ditampilkan", {
        id: "fetch-products",
        description: `${products.length} produk ditemukan`,
      });
    }
  }, [productsLoading, productsError, products.length, isFetching]);

  
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan produk");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Menyimpan produk...", { id: "save-product" });
    },
    onSuccess: () => {
      toast.success("Produk berhasil ditambahkan", {
        id: "save-product",
        description: "Produk baru telah ditambahkan ke toko",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyimpan produk", {
        id: "save-product",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui produk");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Memperbarui produk...", { id: "update-product" });
    },
    onSuccess: () => {
      toast.success("Produk berhasil diperbarui", {
        id: "update-product",
        description: "Perubahan telah disimpan",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui produk", {
        id: "update-product",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus produk");
      return res.json();
    },
    onMutate: () => {
      toast.loading("Menghapus produk...", { id: "delete-product" });
    },
    onSuccess: () => {
      toast.success("Produk berhasil dihapus", {
        id: "delete-product",
        description: "Produk telah dihapus dari toko",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => {
      toast.error("Gagal menghapus produk", {
        id: "delete-product",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If editing and no new image uploaded, keep the existing image
    const imageUrl = imagePreview && formData.image ? formData.image : formData.image || null;

    const payload = {
      ...formData,
      image: imageUrl,
      price_cents: Number(formData.price_cents) * 100,
      stock: Number(formData.stock) || 0,
      category_id: formData.category_id || null,
      weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price_cents: String(product.price_cents / 100),
      stock: String(product.stock),
      image: product.image || "",
      description: product.description || "",
      category_id: product.category_id || "",
      weight_kg: product.weight_kg ? String(product.weight_kg) : "",
    });
    setImagePreview(product.image || null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung", {
        description: "Hanya file JPEG, PNG, WEBP, dan GIF yang diizinkan",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar", {
        description: "Maksimal ukuran file adalah 5MB",
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengupload gambar");
      }

      const data = await res.json();
      setFormData({ ...formData, image: data.url });
      toast.success("Gambar berhasil diupload", {
        description: "Gambar telah disimpan",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengupload gambar");
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setFormData({ ...formData, image: "" });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    deleteMutation.mutate(id);
  };

  
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Nama Produk</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.image ? (
              <img
                src={row.original.image}
                alt={row.getValue("name") as string}
                className="w-10 h-10 rounded-md object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="font-medium">{row.getValue("name")}</div>
          </div>
        ),
      },
      {
        accessorKey: "category_name",
        header: "Kategori",
        cell: ({ row }) => {
          const category = row.getValue("category_name") as string;
          return category ? (
            <Badge variant="outline">{category}</Badge>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        accessorKey: "price_cents",
        header: ({ column }) => (
          <SortableHeader column={column}>Harga</SortableHeader>
        ),
        cell: ({ row }) => {
          const price = row.getValue("price_cents") as number;
          return (
            <div className="font-semibold text-gray-900">
              Rp {(price / 100).toLocaleString("id-ID")}
            </div>
          );
        },
      },
      {
        accessorKey: "stock",
        header: ({ column }) => (
          <SortableHeader column={column}>Stok</SortableHeader>
        ),
        cell: ({ row }) => {
          const stock = row.getValue("stock") as number;
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={stock === 0 ? "destructive" : stock < 10 ? "secondary" : "default"}
                className="font-medium"
              >
                {stock}
              </Badge>
              {stock === 0 && (
                <span className="text-xs text-red-600">Habis</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "weight_kg",
        header: ({ column }) => (
          <SortableHeader column={column}>Berat (kg)</SortableHeader>
        ),
        cell: ({ row }) => {
          const weight = row.getValue("weight_kg");
          if (weight === null || weight === undefined || weight === "") {
            return <span className="text-gray-400">-</span>;
          }
          const weightNum = typeof weight === "string" ? parseFloat(weight) : Number(weight);
          if (isNaN(weightNum)) {
            return <span className="text-gray-400">-</span>;
          }
          return (
            <div className="text-gray-900">
              {weightNum.toFixed(2)} kg
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(product)}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(product.id)}
                className="hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const resetForm = () => {
    setFormData({
      name: "",
      price_cents: "",
      stock: "",
      image: "",
      description: "",
      category_id: "",
      weight_kg: "",
    });
    setImagePreview(null);
    setImageFile(null);
    setEditingProduct(null);
  };

  
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock < 10 && p.stock > 0).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price_cents * p.stock), 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            Manajemen Produk
          </h1>
          <p className="text-gray-600 mt-2">Kelola produk toko Anda dengan mudah</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
              <Plus className="w-5 h-5 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Ubah informasi produk yang ada"
                  : "Tambahkan produk baru ke katalog toko Anda"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Nama Produk <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Beras Ciherang 50kg"
                  required
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_cents" className="text-sm font-semibold">
                    Harga (Rp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price_cents"
                    type="number"
                    min="0"
                    value={formData.price_cents}
                    onChange={(e) =>
                      setFormData({ ...formData, price_cents: e.target.value })
                    }
                    placeholder="0"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-sm font-semibold">
                    Stok <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder="0"
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight_kg" className="text-sm font-semibold">
                    Berat (kg)
                  </Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight_kg}
                    onChange={(e) =>
                      setFormData({ ...formData, weight_kg: e.target.value })
                    }
                    placeholder="0.00"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id" className="text-sm font-semibold">
                    Kategori
                  </Label>
                  <select
                    id="category_id"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition-colors h-11"
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    disabled={categoriesLoading}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-semibold">
                  Gambar Produk
                </Label>
                {imagePreview ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-48 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengupload gambar...</span>
                      </div>
                    )}
                    {formData.image && !uploadingImage && (
                      <p className="text-xs text-gray-500">
                        Gambar: {formData.image}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="image"
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadingImage
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                          : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-10 h-10 mb-3 text-gray-400 animate-spin" />
                            <p className="text-sm text-gray-500">Mengupload...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, WEBP atau GIF (MAX. 5MB)
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}
                {!imagePreview && (
                  <div className="text-xs text-gray-500">
                    Atau gunakan URL gambar jika sudah ada di internet
                  </div>
                )}
              </div>
              {!imagePreview && (
                <div className="space-y-2">
                  <Label htmlFor="image-url" className="text-sm font-semibold">
                    Atau Masukkan URL Gambar
                  </Label>
                <Input
                    id="image-url"
                  type="url"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                    className="h-11"
                />
              </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Deskripsi
                </Label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px] focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi produk..."
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="min-w-[120px]"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingProduct ? "Memperbarui..." : "Menyimpan..."}
                    </>
                  ) : (
                    <>
                  {editingProduct ? "Perbarui" : "Tambah"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Produk
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{totalProducts}</div>
            <p className="text-xs text-gray-600">Produk aktif</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Stok Rendah
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{lowStockProducts}</div>
            <p className="text-xs text-gray-600">Perlu restock</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Stok Habis
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{outOfStockProducts}</div>
            <p className="text-xs text-gray-600">Tidak tersedia</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Nilai Inventori
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              Rp {(totalValue / 100).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-gray-600">Total nilai stok</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold">Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={products}
            searchKey="name"
            searchPlaceholder="Cari produk berdasarkan nama..."
            isLoading={productsLoading}
            emptyMessage={
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Tidak ada produk</p>
                <p className="text-sm text-gray-500 mt-1">
                  Mulai dengan menambahkan produk pertama Anda
                </p>
                      </div>
            }
            enablePagination={true}
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  );
}
