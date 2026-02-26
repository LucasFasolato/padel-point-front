import type { Metadata } from "next";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import "./globals.css";
import { Providers } from "./providers"; 

export const metadata: Metadata = {
  title: "Padel Point",
  description: "Reserva tu cancha en segundos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={cn("bg-[#F7F8FA] text-slate-900 antialiased")}
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        <Providers>
          <AuthBootstrap />
          {children}
        </Providers> 
        <Toaster position="top-center" richColors expand closeButton />
      </body>
    </html>
  );
}
