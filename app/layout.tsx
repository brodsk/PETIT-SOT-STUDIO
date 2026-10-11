import type { Metadata } from "next";
import "./globals.css";
import Effects from "./[locale]/effects";
import StudioCursor from "./components/StudioCursor";

const SITE_URL = "https://petitsot.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Olga Trikhleb — Contemporary Artist | PETIT.SOT STUDIO",
    template: "%s | PETIT.SOT STUDIO",
  },
  description:
    "PETIT.SOT STUDIO is the official portfolio of contemporary artist Olga Trikhleb — paintings, visual research and selected works.",
  applicationName: "PETIT.SOT STUDIO",
  authors: [{ name: "Olga Trikhleb", url: "https://www.instagram.com/petit.sot/" }],
  creator: "Olga Trikhleb",
  publisher: "PETIT.SOT STUDIO",
  icons: {
    icon: "/favicon.svg",
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
    title: "Olga Trikhleb — Contemporary Artist",
    description:
      "Paintings, visual research and selected works by contemporary artist Olga Trikhleb.",
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
