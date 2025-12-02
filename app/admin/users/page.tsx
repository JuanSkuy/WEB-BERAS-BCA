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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  UserCog,
  Shield,
  UserPlus,
  Mail,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}

const fetchUsers = async (): Promise<User[]> => {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  return data.users || [];
};

export default function AdminUsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "user",
  });
  const [editFormData, setEditFormData] = useState({
    email: "",
    name: "",
    role: "user",
  });

  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
    isFetching,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (usersLoading) {
      toast.loading("Memuat data user...", { id: "fetch-users" });
    } else if (usersError) {
      toast.error("Gagal memuat data user", {
        id: "fetch-users",
        description: "Silakan refresh halaman atau coba lagi",
      });
    } else if (users.length > 0 && !isFetching) {
      toast.success("Data user berhasil ditampilkan", {
        id: "fetch-users",
        description: `${users.length} user ditemukan`,
      });
    }
  }, [usersLoading, usersError, users.length, isFetching]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat user");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Membuat user...", { id: "create-user" });
    },
    onSuccess: () => {
      toast.success("User berhasil dibuat", {
        id: "create-user",
        description: "User baru telah ditambahkan",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membuat user", {
        id: "create-user",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memperbarui user");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Memperbarui user...", { id: "update-user" });
    },
    onSuccess: () => {
      toast.success("User berhasil diperbarui", {
        id: "update-user",
        description: "Perubahan telah disimpan",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsEditDialogOpen(false);
      resetEditForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui user", {
        id: "update-user",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus user");
      }
      return res.json();
    },
    onMutate: () => {
      toast.loading("Menghapus user...", { id: "delete-user" });
    },
    onSuccess: () => {
      toast.success("User berhasil dihapus", {
        id: "delete-user",
        description: "User telah dihapus",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus user", {
        id: "delete-user",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      name: user.name || "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string, email: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${email}?`)) return;
    deleteMutation.mutate(id);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateMutation.mutate({ id: editingUser.id, ...editFormData });
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      role: "user",
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      email: "",
      name: "",
      role: "user",
    });
    setEditingUser(null);
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "email",
        header: ({ column }) => (
          <SortableHeader column={column}>Email</SortableHeader>
        ),
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{user.email}</div>
                {user.name && (
                  <div className="text-xs text-gray-500">{user.name}</div>
                )}
              </div>
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const user = row.original;
          const searchValue = value.toLowerCase();
          const name = (user.name || "").toLowerCase();
          const email = user.email.toLowerCase();
          return name.includes(searchValue) || email.includes(searchValue);
        },
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Nama</SortableHeader>
        ),
        cell: ({ row }) => {
          const name = row.getValue("name") as string | null;
          return name || <span className="text-gray-400">-</span>;
        },
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <SortableHeader column={column}>Role</SortableHeader>
        ),
        cell: ({ row }) => {
          const role = row.getValue("role") as string;
          return (
            <Badge
              variant={role === "admin" ? "default" : "secondary"}
              className={
                role === "admin"
                  ? "bg-blue-100 text-blue-800 border-blue-300"
                  : "bg-gray-100 text-gray-800 border-gray-300"
              }
            >
              {role === "admin" ? (
                <>
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </>
              ) : (
                <>
                  <Users className="w-3 h-3 mr-1" />
                  User
                </>
              )}
            </Badge>
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
          const user = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(user)}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(user.id, user.email)}
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

  const totalUsers = users.length;
  const adminCount = users.filter((u: User) => u.role === "admin").length;
  const userCount = users.filter((u: User) => u.role === "user").length;
  const newUsers = users.filter((u: User) => {
    const createdDate = new Date(u.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCog className="w-6 h-6 text-primary" />
            </div>
            Manajemen User
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola semua user dan admin sistem
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
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Tambah User Baru</DialogTitle>
              <DialogDescription>
                Buat user baru dengan email, password, dan role
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
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
                <Label htmlFor="password" className="text-sm font-semibold">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
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
                  placeholder="Nama user (opsional)"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        User
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  disabled={createMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="min-w-[120px]"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    "Buat"
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
              Total User
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{totalUsers}</div>
            <p className="text-xs text-gray-600">Semua user</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Admin
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{adminCount}</div>
            <p className="text-xs text-gray-600">Administrator</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              User Biasa
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{userCount}</div>
            <p className="text-xs text-gray-600">Pelanggan</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full -mr-16 -mt-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-gray-700">
              User Baru
            </CardTitle>
            <div className="p-2.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
              <UserPlus className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900 mb-2">{newUsers}</div>
            <p className="text-xs text-gray-600">30 hari terakhir</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-200 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold">Daftar User</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={users}
            searchKey="email"
            searchPlaceholder="Cari user berdasarkan email atau nama..."
            isLoading={usersLoading}
            emptyMessage={
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Tidak ada user</p>
                <p className="text-sm text-gray-500 mt-1">
                  Mulai dengan menambahkan user pertama Anda
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
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) resetEditForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit User</DialogTitle>
            <DialogDescription>
              Ubah informasi user yang ada
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm font-semibold">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                placeholder="email@example.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-semibold">
                Nama
              </Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder="Nama user (opsional)"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-sm font-semibold">
                Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, role: value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      User
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetEditForm();
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
