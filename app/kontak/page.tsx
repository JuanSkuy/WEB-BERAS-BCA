"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone } from "lucide-react";

export default function KontakPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Gagal mengirim pesan. Silakan coba lagi.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMessage("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950 py-20 px-6">
      <div className="max-w-5xl mx-auto text-center space-y-12">
        {/* Judul */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-green-700 dark:text-green-400 font-serif"
        >
          Hubungi Kami 📬
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Ada pertanyaan, saran, atau ingin bekerja sama dengan kami? Silakan
          isi formulir di bawah ini atau hubungi kami langsung.
        </motion.p>

        {/* Grid dua kolom */}
        <div className="grid md:grid-cols-2 gap-10 mt-12 text-left">
          {/* Formulir kontak */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="shadow-lg border-green-100 dark:border-green-900">
              <CardContent className="p-6 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nama Lengkap
                    </label>
                    <Input
                      placeholder="Masukkan nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="Masukkan alamat email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Pesan
                    </label>
                    <Textarea
                      placeholder="Tulis pesan Anda di sini..."
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  {status === "success" && (
                    <p className="text-sm text-green-600">
                      Terima kasih, pesan Anda sudah terkirim.
                    </p>
                  )}
                  {status === "error" && (
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-300 disabled:opacity-70"
                  >
                    {loading ? "Mengirim..." : "Kirim Pesan"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info kontak */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="space-y-6"
          >
            {[
              {
                icon: (
                  <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                ),
                title: "Email",
                text: "support@capakor.com",
              },
              {
                icon: (
                  <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                ),
                title: "Telepon",
                text: "+62 812-3456-7890",
              },
              {
                icon: (
                  <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                ),
                title: "Alamat",
                text: "Jl. Hijau Lestari No. 45, Bandung, Indonesia",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="hover:shadow-md border-green-100 dark:border-green-900 transition-shadow"
              >
                <CardContent className="p-5 flex items-start gap-4">
                  {item.icon}
                  <div>
                    <h3 className="font-semibold text-lg text-green-700 dark:text-green-400">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">{item.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
