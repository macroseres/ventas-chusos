import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chusos | Ventas e inventario",
  description: "Control de ventas e inventario de Chusos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
