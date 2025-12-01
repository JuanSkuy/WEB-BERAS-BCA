"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateMode, setUpdateMode] = useState<"email" | "password" | null>(null);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        if (data.email) {
          setUser({ email: data.email });
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailMessage("");

    if (!newEmail || !emailPassword) {
      setEmailError("Email dan password harus diisi");
      return;
    }

    if (!newEmail.includes("@")) {
      setEmailError("Email tidak valid");
      return;
    }

    setEmailLoading(true);
    try {
      const response = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_email: newEmail,
          password: emailPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.error || "Gagal mengubah email");
        return;
      }

      setEmailMessage("Email berhasil diubah! Silakan login kembali.");
      setNewEmail("");
      setEmailPassword("");
      setUpdateMode(null);

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setEmailError("Terjadi kesalahan saat mengubah email");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!newPassword || !confirmPassword) {
      setPasswordError("Password dan konfirmasi harus diisi");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Password tidak cocok");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Gagal mengubah password");
        return;
      }

      setPasswordMessage("Password berhasil diubah!");
      setNewPassword("");
      setConfirmPassword("");
      setUpdateMode(null);

      setTimeout(() => {
        setPasswordMessage("");
      }, 3000);
    } catch (error) {
      setPasswordError("Terjadi kesalahan saat mengubah password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Pengaturan Akun</h1>
        </div>

        {/* Email Section */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold mb-2">Email</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
            {updateMode !== "email" && (
              <Button
                onClick={() => {
                  setUpdateMode("email");
                  setEmailError("");
                  setEmailMessage("");
                }}
                variant="outline"
              >
                Ubah Email
              </Button>
            )}
          </div>

          {updateMode === "email" && (
            <form onSubmit={handleChangeEmail} className="mt-4 space-y-4 border-t pt-4">
              {emailError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {emailError}
                  </AlertDescription>
                </Alert>
              )}
              {emailMessage && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    {emailMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email Baru</label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  disabled={emailLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Password (untuk verifikasi)
                </label>
                <Input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  disabled={emailLoading}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={emailLoading}
                >
                  {emailLoading ? "Memproses..." : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUpdateMode(null);
                    setNewEmail("");
                    setEmailPassword("");
                    setEmailError("");
                    setEmailMessage("");
                  }}
                  disabled={emailLoading}
                >
                  Batal
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Password Section */}
        <Card className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold mb-2">Password</h2>
              <p className="text-gray-600">Ubah password Anda untuk keamanan akun</p>
            </div>
            {updateMode !== "password" && (
              <Button
                onClick={() => {
                  setUpdateMode("password");
                  setPasswordError("");
                  setPasswordMessage("");
                }}
                variant="outline"
              >
                Ubah Password
              </Button>
            )}
          </div>

          {updateMode === "password" && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4 border-t pt-4">
              {passwordError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {passwordError}
                  </AlertDescription>
                </Alert>
              )}
              {passwordMessage && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    {passwordMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Password Baru</label>
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPasswords ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Konfirmasi Password
                </label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  disabled={passwordLoading}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Memproses..." : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUpdateMode(null);
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                    setPasswordMessage("");
                    setShowPasswords(false);
                  }}
                  disabled={passwordLoading}
                >
                  Batal
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
