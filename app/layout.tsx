import type { Metadata } from "next";
import "./globals.css";
import Effects from "./[locale]/effects";
import StudioCursor from "./components/StudioCursor";

const SITE_URL = "https://www.petitsot.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Original Paintings by Olga Trikhleb | PETIT.SOT STUDIO",
    template: "%s | PETIT.SOT STUDIO",
  },
  description:
    "Discover one-of-a-kind original paintings by contemporary artist Olga Trikhleb at PETIT.SOT STUDIO. Explore landscape, seascape and city artwork for your home, available paintings and custom art commissions.",
  applicationName: "PETIT.SOT STUDIO",
  authors: [{ name: "Olga Trikhleb", url: "https://www.instagram.com/petit.sot.art" }],
  creator: "Olga Trikhleb",
  publisher: "PETIT.SOT STUDIO",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "48x48" }],
    shortcut: ["/favicon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "PETIT.SOT STUDIO",
    title: "Olga Trikhleb — Original Paintings & Contemporary Art",
    description:
      "One-of-a-kind original paintings, contemporary artwork and custom painting commissions by Olga Trikhleb.",
    url: SITE_URL,
    locale: "en_GB",
    alternateLocale: ["ru_RU"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olga Trikhleb — Contemporary Artist",
    description:
      "Paintings, visual research and selected works by Olga Trikhleb.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Effects />
        <StudioCursor />
      </body>
    </html>
  );
}
