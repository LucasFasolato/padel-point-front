import type { Metadata } from "next";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils"; // Make sure you import 'cn'
import "./globals.css";

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
      <body
        className={cn("bg-slate-50 text-slate-900 antialiased")}
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
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
