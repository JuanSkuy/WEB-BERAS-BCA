"use client";

import { motion } from "framer-motion";
import HeroSection from "@/components/hero-section";
import ProductCard from "@/components/product-card";
import Footer from "@/components/footer";
import { Leaf, Users, ShoppingBag, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  price_cents: number;
  stock: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactStatus, setContactStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [contactError, setContactError] = useState("");

  function getProductImage(name: string) {
    if (name.includes("10kg")) return "/10kg beras.jpg";
    if (name.includes("20kg")) return "/20kg beras.jpg";
    if (name.includes("50kg")) return "/50kg beras.jpg";
    return "/fotoberas.jpg";
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // First, try to initialize products
        await fetch("/api/debug/init-products", { method: "POST" });
        
        // Then fetch them
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setContactLoading(true);
    setContactStatus("idle");
    setContactError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setContactStatus("error");
        setContactError(
          data.error || "Gagal mengirim pesan. Silakan coba lagi.",
        );
        return;
      }

      setContactStatus("success");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (err) {
      setContactStatus("error");
      setContactError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setContactLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 text-foreground">
      <main className="flex-1">
        {/* ===== Hero Section ===== */}
        <HeroSection />

        {/* ===== Mengapa Memilih ===== */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="container mx-auto px-4 md:px-6 text-center relative z-10"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-r from-green-700 to-green-400 bg-clip-text text-transparent leading-normal">
              Mengapa Memilih Beras Ciherang?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Kami berkomitmen menyediakan beras berkualitas tinggi — sehat,
              lezat, dan aman untuk keluarga Anda. Setiap butir beras Ciherang
              diproses dengan standar terbaik.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16">
              {[
                {
                  icon: "🌾",
                  title: "Pilihan Terbaik",
                  desc: "Dipilih dari varietas padi unggul, menghasilkan beras dengan tekstur sempurna.",
                },
                {
                  icon: "🌱",
                  title: "Alami & Segar",
                  desc: "Tanpa bahan kimia berbahaya, menjaga kesegaran dan nutrisi alami beras.",
                },
                {
                  icon: "👨‍👩‍👧‍👦",
                  title: "Untuk Keluarga",
                  desc: "Sumber energi sehat yang cocok untuk konsumsi sehari-hari seluruh anggota keluarga.",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="p-8 rounded-2xl shadow-md bg-white/70 backdrop-blur-lg border border-white/30 transition-all"
                >
                  <div className="text-5xl mb-3">{item.icon}</div>
                  <h3 className="font-serif text-2xl font-semibold mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ===== Produk ===== */}
        <section
          id="produk"
          className="py-20 md:py-28 bg-gradient-to-b from-green-50 to-green-100"
        >
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="container mx-auto px-4 md:px-6 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-r from-green-700 to-green-400 bg-clip-text text-transparent leading-normal">
              Produk Unggulan Beras Ciherang
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Beras Ciherang yang sesuai dengan
              kebutuhan dan selera Anda.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">
              {loading ? (
                <div className="col-span-full text-center">Loading produk...</div>
              ) : products.length > 0 ? (
                products.map((item) => (
                  <motion.div key={item.id} whileHover={{ scale: 1.05 }}>
                    <ProductCard
                      id={item.id}
                      name={item.name}
                      description="Beras putih pulen berkualitas tinggi, cocok untuk nasi sehari-hari."
                      price={`Rp${(item.price_cents / 100).toLocaleString("id-ID")}`}
                      imageUrl={getProductImage(item.name)}
                      stock={item.stock}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center">Tidak ada produk</div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ===== Tentang Kami ===== */}
        <section
          id="tentang-kami"
          className="py-20 bg-white border-t border-border"
        >
          <div className="container mx-auto px-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-r from-green-700 to-green-400 bg-clip-text text-transparent leading-normal"
            >
              Tentang Kami 🌿
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto"
            >
              Kami adalah tim yang berfokus pada pengembangan produk ramah
              lingkungan dan inovatif. Melalui platform ini, kami ingin membantu
              masyarakat lebih mudah berbelanja, mendaur ulang, dan
              berkontribusi terhadap bumi yang lebih hijau 🌍.
            </motion.p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {[
                {
                  icon: (
                    <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ),
                  title: "Peduli Lingkungan",
                  desc: "Kami percaya bahwa setiap langkah kecil menuju keberlanjutan memiliki dampak besar bagi bumi.",
                },
                {
                  icon: (
                    <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ),
                  title: "Tim Berdedikasi",
                  desc: "Didukung oleh tim profesional muda dengan semangat tinggi dan visi yang sama.",
                },
                {
                  icon: (
                    <ShoppingBag className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ),
                  title: "Belanja Cerdas",
                  desc: "Kami menyediakan pengalaman belanja modern dengan kemudahan dan kenyamanan maksimal.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.2 }}
                  className="p-6 bg-gray-50 rounded-xl shadow-sm border"
                >
                  <div className="flex justify-center mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Kontak ===== */}
        <section
          id="kontak"
          className="py-20 bg-gray-50 border-t border-border"
        >
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-5 text-gray-900">
              Hubungi Kami
            </h2>
            <p className="text-gray-600 mb-10 max-w-xl mx-auto">
              Ada pertanyaan atau ingin bekerja sama? Kirimkan pesan kepada
              kami.
            </p>

            <form
              onSubmit={handleContactSubmit}
              className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-8 space-y-4"
            >
              <input
                type="text"
                placeholder="Nama Anda"
                className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email Anda"
                className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                 value={contactEmail}
                 onChange={(e) => setContactEmail(e.target.value)}
                 required
              />
              <textarea
                placeholder="Pesan Anda"
                rows={5}
                className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                required
              ></textarea>

              {contactStatus === "success" && (
                <p className="text-sm text-green-600 text-left">
                  Terima kasih, pesan Anda sudah terkirim.
                </p>
              )}
              {contactStatus === "error" && (
                <p className="text-sm text-red-600 text-left">{contactError}</p>
              )}

              <button
                type="submit"
                disabled={contactLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-70"
              >
                {contactLoading ? "Mengirim..." : "Kirim Pesan"}
              </button>
            </form>

            <div className="mt-8 text-gray-600">
              <p>
                <Mail className="inline w-4 h-4 mr-2" />
                support@capakor.com
              </p>
              <p>
                <Phone className="inline w-4 h-4 mr-2" /> +62 812-3456-7890
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
