import type { Metadata } from "next";import "./globals.css";
import Effects from "./[locale]/effects";
import StudioCursor from "./components/StudioCursor";
export const metadata:Metadata={title:{default:"PETIT.SOT | STUDIO",template:"%s | PETIT.SOT | STUDIO"},description:"PETIT.SOT STUDIO — contemporary paintings by Olga Trikhleb.",icons:{icon:"/favicon.svg"},metadataBase:new URL("https://petit-sot-studio.vercel.app")};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<Effects /><StudioCursor /></body></html>}