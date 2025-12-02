"use client";

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();

  const handleShopNow = () => {
    router.push("/produk");
  };

  return (
    <section
      className="relative h-[75vh] md:h-[85vh] flex flex-col items-center justify-center text-center bg-cover bg-center px-6"
      style={{
        backgroundImage: 'url("/bg-padi.jpg")',
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 max-w-4xl text-white space-y-6">
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 text-balance">
          Cap Akor
          <p>Kualitas Beras Terbaik untuk Keluarga Anda</p>
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
          Nikmati kelezatan dan nutrisi dari beras pilihan Cap Akor, dipanen
          dari sawah terbaik Indonesia.
        </p>
        <Button 
          onClick={handleShopNow}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        >
          Belanja Sekarang
        </Button>
      </div>
    </section>
  );
}
