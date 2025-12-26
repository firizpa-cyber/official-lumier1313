import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-[72px] pb-[68px] lg:pb-0 lg:pt-[72px]">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <BottomNav />
    </div>
  );
}
