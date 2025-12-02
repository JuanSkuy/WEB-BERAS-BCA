"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Settings {
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  contact_whatsapp?: string;
  contact_instagram?: string;
  payment_methods?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || {});
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        setSuccess("Pengaturan berhasil disimpan");
        setSettings({ ...settings, [key]: value });
      } else {
        setError("Gagal menyimpan pengaturan");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return <div className="text-center py-8">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-600 mt-2">Kelola pengaturan toko</p>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Toko</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store_name">Nama Toko</Label>
            <Input
              id="store_name"
              value={settings.store_name || ""}
              onChange={(e) => handleChange("store_name", e.target.value)}
              onBlur={(e) => handleSave("store_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store_address">Alamat Toko</Label>
            <Textarea
              id="store_address"
              value={settings.store_address || ""}
              onChange={(e) => handleChange("store_address", e.target.value)}
              onBlur={(e) => handleSave("store_address", e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store_phone">Nomor Telepon</Label>
              <Input
                id="store_phone"
                value={settings.store_phone || ""}
                onChange={(e) => handleChange("store_phone", e.target.value)}
                onBlur={(e) => handleSave("store_phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_email">Email</Label>
              <Input
                id="store_email"
                type="email"
                value={settings.store_email || ""}
                onChange={(e) => handleChange("store_email", e.target.value)}
                onBlur={(e) => handleSave("store_email", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Kontak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_whatsapp">WhatsApp</Label>
            <Input
              id="contact_whatsapp"
              value={settings.contact_whatsapp || ""}
              onChange={(e) => handleChange("contact_whatsapp", e.target.value)}
              onBlur={(e) => handleSave("contact_whatsapp", e.target.value)}
              placeholder="081234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_instagram">Instagram</Label>
            <Input
              id="contact_instagram"
              value={settings.contact_instagram || ""}
              onChange={(e) => handleChange("contact_instagram", e.target.value)}
              onBlur={(e) => handleSave("contact_instagram", e.target.value)}
              placeholder="@username"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_methods">Daftar Metode Pembayaran</Label>
            <Textarea
              id="payment_methods"
              value={settings.payment_methods || ""}
              onChange={(e) => handleChange("payment_methods", e.target.value)}
              onBlur={(e) => handleSave("payment_methods", e.target.value)}
              rows={4}
              placeholder="COD (Cash on Delivery)&#10;Transfer Bank BCA&#10;Transfer Bank Mandiri"
            />
            <p className="text-sm text-gray-500">
              Satu metode per baris
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

