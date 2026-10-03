import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PETIT.SOT STUDIO — Olga Trikhleb", template: "%s — PETIT.SOT STUDIO" },
  description: "PETIT.SOT STUDIO — contemporary paintings by Olga Trikhleb.",
  metadataBase: new URL("https://petit-sot-studio.vercel.app"),
  openGraph: { title: "PETIT.SOT STUDIO", description: "Paintings by Olga Trikhleb.", type: "website" },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body><header className="site-header"><Link href="/" className="wordmark">PETIT.SOT <span>STUDIO</span></Link><nav><Link href="/works">Works</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></nav></header>{children}<footer><span>© {new Date().getFullYear()} PETIT.SOT STUDIO</span><span>Olga Trikhleb</span><a href="https://www.instagram.com/petit.sot/" target="_blank" rel="noreferrer">Instagram ↗</a></footer></body></html>
}