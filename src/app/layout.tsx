import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils"; // Make sure you import 'cn'
import "./globals.css";

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
      {/* 👇 We apply the classes here instead of globals.css */}
      <body className={cn(
          inter.className, 
          "bg-slate-50 text-slate-900 antialiased"
      )}>
        {children}
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