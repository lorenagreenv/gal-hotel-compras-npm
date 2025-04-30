import { ReactNode } from "react";
import { Header } from "@/components/layout/header";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        {children}
      </main>
      <footer className="border-t py-4 bg-muted/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Gal Hotel Bar. Todos os direitos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Sistema de Controle de Compras
          </p>
        </div>
      </footer>
    </div>
  );
}
