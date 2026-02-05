import type { Metadata } from "next";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeInit } from "@/app/components/ui/theme-init";
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
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn("min-h-screen bg-bg text-text antialiased")}
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        {/* Inicializa theme (light/dark) desde localStorage */}
        <ThemeInit />

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
