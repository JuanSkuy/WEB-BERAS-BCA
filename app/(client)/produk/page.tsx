"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Leaf, Users, ShoppingBag } from "lucide-react";

export default function ProdukPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950 py-20 px-6">
      <div className="max-w-5xl mx-auto text-center space-y-12">
        {/* Judul utama */}
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-green-700 dark:text-green-400 font-serif"
        >
          Produk Kami 🛍️
        </motion.h1>

        {/* Deskripsi utama */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto"
        >
          Kami menyediakan berbagai macam produk beras berkualitas tinggi, langsung dari petani terbaik.
        </motion.p>

        {/* Tiga kartu misi */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {[
            {
              icon: (
                <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
              ),
              title: "Beras Putih",
              desc: "Beras putih pulen dan berkualitas, cocok untuk makanan sehari-hari.",
            },
            {
              icon: (
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              ),
              title: "Beras Merah",
              desc: "Beras merah organik, kaya akan serat dan baik untuk kesehatan.",
            },
            {
              icon: (
                <ShoppingBag className="w-8 h-8 text-green-600 dark:text-green-400" />
              ),
              title: "Beras Ketan",
              desc: "Beras ketan pilihan untuk membuat berbagai macam hidangan tradisional.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.2 }}
            >
              <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-green-100 dark:border-green-900 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="flex justify-center">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-16"
        >
          <Link href="/#produk">
            <Button className="px-8 py-6 text-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-300 hover:scale-105">
              Lihat Semua Produk
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
