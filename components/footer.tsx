import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-card text-card-foreground py-8 md:py-12 border-t border-border">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-serif">Cap Akor</h3>
          <p className="text-muted-foreground leading-relaxed">
            Kualitas beras terbaik untuk setiap hidangan Anda.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <h4 className="text-lg font-semibold">Navigasi</h4>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/#products"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Produk
                </Link>
              </li>
              <li>
                <Link
                  href="/#tentang-kami"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/#kontak"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-lg font-semibold">Legal</h4>
            <ul className="space-y-1">
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Hubungi Kami</h4>
          <p className="text-muted-foreground">
            Email: info@capakor.com
            <br />
            Telepon: +62 857-6606-0691
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 mt-8 text-center text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} Cap Akor. Hak Cipta Dilindungi.
      </div>
    </footer>
  );
}
