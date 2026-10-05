import type { Metadata } from "next";import "./globals.css";
import Effects from "./[locale]/effects";
import FaviconAnimator from "./components/FaviconAnimator";
import StudioCursor from "./components/StudioCursor";
export const metadata:Metadata={title:{default:"PETIT.SOT | STUDIO",template:"%s | PETIT.SOT | STUDIO"},description:"PETIT.SOT STUDIO — contemporary paintings by Olga Trikhleb.",metadataBase:new URL("https://petit-sot-studio.vercel.app")};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<Effects /><FaviconAnimator /><StudioCursor /></body></html>}