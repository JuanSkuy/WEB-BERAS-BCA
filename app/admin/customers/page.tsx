"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Users,
  UserCheck,
  UserPlus,
  DollarSign,
  Mail,
  Calendar,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Customer {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
}

const fetchCustomers = async (): Promise<Customer[]> => {
  const res = await fetch("/api/admin/customers");
  if (!res.ok) throw new Error("Failed to fetch customers");
  const data = await res.json();
  return data.customers || [];
};

export default function AdminCustomersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
  });

  const queryClient = useQueryClient();

  const {
    data: customers = [],
    isLoading: customersLoading,
    error: customersError,
    isFetching,
  } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: fetchCustomers,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (customersLoading) {
      toast.loading("Memuat data pelanggan...", { id: "fetch-customers" });
    } else if (customersError) {
      toast.error("Gagal memuat data pelanggan", {
        id: "fetch-customers",
        description: "Silakan refresh halaman atau coba lagi",
      });
    } else if (customers.length > 0 && !isFetching) {
      toast.success("Data pelanggan berhasil ditampilkan", {
        id: "fetch-customers",
        description: `${customers.length} pelanggan ditemukan`,
      });
    }
  }, [customersLoading, customersError, customers.length, isFetching]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const res = await fetch("/api/admin/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui pelanggan");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Memperbarui pelanggan...", { id: "update-customer" });
    },
    onSuccess: () => {
      toast.success("Pelanggan berhasil diperbarui", {
        id: "update-customer",
        description: "Perubahan telah disimpan",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui pelanggan", {
        id: "update-customer",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/customers?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus pelanggan");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Menghapus pelanggan...", { id: "delete-customer" });
    },
    onSuccess: () => {
      toast.success("Pelanggan berhasil dihapus", {
        id: "delete-customer",
        description: "Pelanggan telah dihapus",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus pelanggan", {
        id: "delete-customer",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      email: customer.email,
      name: customer.name || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string, email: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pelanggan ${email}?`)) return;
    deleteMutation.mutate(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const payload = {
      email: formData.email.trim(),
      name: formData.name.trim() || null,
    };

    updateMutation.mutate({ id: editingCustomer.id, ...payload });
  };

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
    });
    setEditingCustomer(null);
  };

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Nama Pelanggan</SortableHeader>
        ),
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">
                  {customer.name || "Tidak ada nama"}
                </div>
                {customer.name && (
                  <div className="text-xs text-gray-500">{customer.email}</div>
                )}
              </div>
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const customer = row.original;
          const searchValue = value.toLowerCase();
          const name = (customer.name || "").toLowerCase();
          const email = customer.email.toLowerCase();
          return name.includes(searchValue) || email.includes(searchValue);
        },
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column}>Email</SortableHeader>
        ),
        cell: ({ row }) => {
          const email = row.getValue("email") as string;
          return (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{email}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "total_orders",
        header: ({ column }) => (
          <SortableHeader column={column}>Total Pesanan</SortableHeader>
        ),
        cell: ({ row }) => {
          const totalOrders = row.getValue("total_orders") as number;
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant={totalOrders === 0 ? "secondary" : "default"}
                className="font-medium"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                {totalOrders}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "total_spent",
        header: ({ column }) => (
          <SortableHeader column={column}>Total Belanja</SortableHeader>
        ),
        cell: ({ row }) => {
          const totalSpent = row.getValue("total_spent") as number;
          return (
            <div className="font-semibold text-gray-900">
              Rp {(totalSpent / 100).toLocaleString("id-ID")}
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <SortableHeader column={column}>Bergabung</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("created_at"));
          return (
            <div>
              <div className="text-sm">
                {date.toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(date, {
                  addSuffix: true,
                  locale: idLocale,
                })}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const customer = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(customer)}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(customer.id, customer.email)}
                className="hover:bg-red-600"
                disabled={customer.total_orders > 0}
                title={
                  customer.total_orders > 0
                    ? "Tidak dapat menghapus pelanggan yang memiliki pesanan"
                    : "Hapus pelanggan"
                }
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

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (c: Customer) => c.total_orders > 0
  ).length;
  const newCustomers = customers.filter((c: Customer) => {
    const createdDate = new Date(c.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  }).length;
  const totalRevenue = customers.reduce(
    (sum: number, c: Customer) => sum + c.total_spent,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            Manajemen Pelanggan
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola dan lihat informasi semua pelanggan
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Pelanggan
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {totalCustomers}
            </div>
            <p className="text-xs text-gray-600">Semua pelanggan</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Pelanggan Aktif
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {activeCustomers}
            </div>
            <p className="text-xs text-gray-600">Sudah berbelanja</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Pelanggan Baru
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <UserPlus className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {newCustomers}
            </div>
            <p className="text-xs text-gray-600">30 hari terakhir</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Pendapatan
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              Rp {(totalRevenue / 100).toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-gray-600">Dari semua pelanggan</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold">Daftar Pelanggan</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={customers}
            searchKey="name"
            searchPlaceholder="Cari pelanggan berdasarkan nama atau email..."
            isLoading={customersLoading}
            emptyMessage={
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Tidak ada pelanggan</p>
                <p className="text-sm text-gray-500 mt-1">
                  Belum ada pelanggan yang terdaftar
                </p>
              </div>
            }
            enablePagination={true}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Pelanggan</DialogTitle>
            <DialogDescription>
              Ubah informasi pelanggan yang ada
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Nama
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nama pelanggan (opsional)"
                className="h-11"
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
                disabled={updateMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="min-w-[120px]"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  "Perbarui"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
