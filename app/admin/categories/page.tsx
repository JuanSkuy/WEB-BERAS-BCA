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
  FolderTree,
  FolderOpen,
  FolderX,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  category_id: string | null;
}

const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch("/api/admin/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return data.categories || [];
};

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/admin/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  const data = await res.json();
  return data.products || [];
};

export default function AdminCategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
    isFetching,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    refetchOnWindowFocus: false,
  });

  const {
    data: products = [],
    isLoading: productsLoading,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  useEffect(() => {
    if (categoriesLoading) {
      toast.loading("Memuat data kategori...", { id: "fetch-categories" });
    } else if (categoriesError) {
      toast.error("Gagal memuat data kategori", {
        id: "fetch-categories",
        description: "Silakan refresh halaman atau coba lagi",
      });
    } else if (categories.length > 0 && !isFetching) {
      toast.success("Data kategori berhasil ditampilkan", {
        id: "fetch-categories",
        description: `${categories.length} kategori ditemukan`,
      });
    }
  }, [categoriesLoading, categoriesError, categories.length, isFetching]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan kategori");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Menyimpan kategori...", { id: "save-category" });
    },
    onSuccess: () => {
      toast.success("Kategori berhasil ditambahkan", {
        id: "save-category",
        description: "Kategori baru telah ditambahkan",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyimpan kategori", {
        id: "save-category",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui kategori");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Memperbarui kategori...", { id: "update-category" });
    },
    onSuccess: () => {
      toast.success("Kategori berhasil diperbarui", {
        id: "update-category",
        description: "Perubahan telah disimpan",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui kategori", {
        id: "update-category",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus kategori");
      return res.json();
    },
    onMutate: () => {
      toast.loading("Menghapus kategori...", { id: "delete-category" });
    },
    onSuccess: () => {
      toast.success("Kategori berhasil dihapus", {
        id: "delete-category",
        description: "Kategori telah dihapus",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => {
      toast.error("Gagal menghapus kategori", {
        id: "delete-category",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      description: formData.description || null,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;
    deleteMutation.mutate(id);
  };

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Nama Kategori</SortableHeader>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderTree className="w-4 h-4 text-primary" />
            </div>
            <div className="font-medium">{row.getValue("name")}</div>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Deskripsi",
        cell: ({ row }) => {
          const description = row.getValue("description") as string | null;
          return description ? (
            <p className="text-gray-600 max-w-md truncate">{description}</p>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        id: "product_count",
        header: "Jumlah Produk",
        cell: ({ row }) => {
          const categoryId = row.original.id;
          const productCount = products.filter(
            (p) => p.category_id === categoryId
          ).length;
          return (
            <Badge
              variant={productCount === 0 ? "secondary" : "default"}
              className="font-medium"
            >
              <Package className="w-3 h-3 mr-1" />
              {productCount}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(category.id)}
                className="hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [products]
  );

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setEditingCategory(null);
  };

  const totalCategories = categories.length;
  const categoriesWithProducts = categories.filter((cat) =>
    products.some((p) => p.category_id === cat.id)
  ).length;
  const emptyCategories = categories.filter(
    (cat) => !products.some((p) => p.category_id === cat.id)
  ).length;
  const totalProductsInCategories = products.filter(
    (p) => p.category_id !== null
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FolderTree className="w-6 h-6 text-primary" />
            </div>
            Manajemen Kategori
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola kategori produk dengan mudah
          </p>
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
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Ubah informasi kategori yang ada"
                  : "Tambahkan kategori baru untuk mengorganisir produk"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Nama Kategori <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Beras Premium"
                  required
                  className="h-11"
                />
              </div>
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
                  placeholder="Deskripsi kategori (opsional)..."
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
                      {editingCategory ? "Memperbarui..." : "Menyimpan..."}
                    </>
                  ) : (
                    <>
                      {editingCategory ? "Perbarui" : "Tambah"}
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
              Total Kategori
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <FolderTree className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {totalCategories}
            </div>
            <p className="text-xs text-gray-600">Kategori aktif</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Kategori Terpakai
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <FolderOpen className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {categoriesWithProducts}
            </div>
            <p className="text-xs text-gray-600">Memiliki produk</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Kategori Kosong
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <FolderX className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {emptyCategories}
            </div>
            <p className="text-xs text-gray-600">Belum ada produk</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Produk Terkategorikan
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {totalProductsInCategories}
            </div>
            <p className="text-xs text-gray-600">Produk dengan kategori</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold">Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={categories}
            searchKey="name"
            searchPlaceholder="Cari kategori berdasarkan nama..."
            isLoading={categoriesLoading || productsLoading}
            emptyMessage={
              <div className="text-center py-12">
                <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Tidak ada kategori</p>
                <p className="text-sm text-gray-500 mt-1">
                  Mulai dengan menambahkan kategori pertama Anda
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
