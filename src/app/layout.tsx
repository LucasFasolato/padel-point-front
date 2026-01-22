import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner"; // 👈 Import Sonner
import "./globals.css";

// Configure Font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Padel Point",
  description: "Reserva tu cancha en segundos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        
        {/* 👇 Global Notification Container */}
        <Toaster 
          position="top-center" 
          richColors 
          expand 
          closeButton
        />
      </body>
    </html>
  );
}