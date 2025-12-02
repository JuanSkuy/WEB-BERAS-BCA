"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Store,
  Mail,
  Phone,
  MapPin,
  Instagram,
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

interface Settings {
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  contact_whatsapp?: string;
  contact_instagram?: string;
  payment_methods?: string;
}

const fetchSettings = async (): Promise<Settings> => {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  const data = await res.json();
  return data.settings || {};
};

const saveSetting = async (key: string, value: string) => {
  const res = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to save setting");
  }
  return res.json();
};

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<Settings>({});
  const [hasChanges, setHasChanges] = useState(false);

  const queryClient = useQueryClient();

  const {
    data: settings = {},
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettings,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (settingsLoading) {
      toast.loading("Memuat pengaturan...", { id: "fetch-settings" });
    } else if (settingsError) {
      toast.error("Gagal memuat pengaturan", {
        id: "fetch-settings",
        description: "Silakan refresh halaman atau coba lagi",
      });
    } else if (settings && Object.keys(settings).length > 0) {
      toast.success("Pengaturan berhasil dimuat", {
        id: "fetch-settings",
        description: "Pengaturan toko siap diubah",
      });
    }
  }, [settingsLoading, settingsError, settings]);

  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const promises = Object.entries(updates).map(([key, value]) =>
        saveSetting(key, value)
      );
      await Promise.all(promises);
    },
    onMutate: () => {
      toast.loading("Menyimpan pengaturan...", { id: "save-settings" });
    },
    onSuccess: () => {
      toast.success("Pengaturan berhasil disimpan", {
        id: "save-settings",
        description: "Semua perubahan telah disimpan",
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyimpan pengaturan", {
        id: "save-settings",
        description: "Silakan coba lagi",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    },
  });

  const handleChange = (key: keyof Settings, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find changed fields
    const changes: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const typedKey = key as keyof Settings;
      if (formData[typedKey] !== settings[typedKey]) {
        changes[key] = formData[typedKey] || "";
      }
    });

    if (Object.keys(changes).length === 0) {
      toast.info("Tidak ada perubahan yang perlu disimpan");
      return;
    }

    saveMutation.mutate(changes);
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            Pengaturan Toko
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola informasi dan konfigurasi toko Anda
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saveMutation.isPending}
            >
              Batal
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasChanges}
            size="lg"
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Information */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Informasi Toko
                </CardTitle>
                <CardDescription>
                  Informasi dasar tentang toko Anda
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store_name" className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                Nama Toko
              </Label>
              <Input
                id="store_name"
                value={formData.store_name || ""}
                onChange={(e) => handleChange("store_name", e.target.value)}
                placeholder="Contoh: Toko Beras BCA"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_address" className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Alamat Toko
              </Label>
              <Textarea
                id="store_address"
                value={formData.store_address || ""}
                onChange={(e) => handleChange("store_address", e.target.value)}
                placeholder="Masukkan alamat lengkap toko"
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store_phone" className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Nomor Telepon
                </Label>
                <Input
                  id="store_phone"
                  value={formData.store_phone || ""}
                  onChange={(e) => handleChange("store_phone", e.target.value)}
                  placeholder="Contoh: +62 812-3456-7890"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email Toko
                </Label>
                <Input
                  id="store_email"
                  type="email"
                  value={formData.store_email || ""}
                  onChange={(e) => handleChange("store_email", e.target.value)}
                  placeholder="Contoh: info@tokoberas.com"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Social Media */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Instagram className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Kontak & Media Sosial
                </CardTitle>
                <CardDescription>
                  Informasi kontak dan media sosial toko
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_whatsapp" className="text-sm font-semibold flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                WhatsApp
              </Label>
              <Input
                id="contact_whatsapp"
                value={formData.contact_whatsapp || ""}
                onChange={(e) => handleChange("contact_whatsapp", e.target.value)}
                placeholder="Contoh: 081234567890"
                className="h-11"
              />
              <p className="text-xs text-gray-500">
                Nomor WhatsApp untuk kontak pelanggan
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_instagram" className="text-sm font-semibold flex items-center gap-2">
                <Instagram className="w-4 h-4 text-gray-500" />
                Instagram
              </Label>
              <Input
                id="contact_instagram"
                value={formData.contact_instagram || ""}
                onChange={(e) => handleChange("contact_instagram", e.target.value)}
                placeholder="Contoh: @tokoberasbca"
                className="h-11"
              />
              <p className="text-xs text-gray-500">
                Masukkan username Instagram tanpa @
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Metode Pembayaran
                </CardTitle>
                <CardDescription>
                  Informasi metode pembayaran yang diterima
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_methods" className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                Metode Pembayaran
              </Label>
              <Textarea
                id="payment_methods"
                value={formData.payment_methods || ""}
                onChange={(e) => handleChange("payment_methods", e.target.value)}
                placeholder="Contoh: Transfer Bank BCA, COD, E-Wallet (OVO, GoPay, DANA)"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Jelaskan metode pembayaran yang diterima toko Anda
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button (Sticky) */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-t-lg shadow-lg -mx-6 -mb-6 z-10">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="text-sm text-gray-600">
                Anda memiliki perubahan yang belum disimpan
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={saveMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  size="lg"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
