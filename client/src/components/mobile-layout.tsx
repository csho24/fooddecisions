import React from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export function Layout({ children, title, showBack = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative flex flex-col shadow-2xl shadow-black/5 border-x border-border/40">
        {/* Header */}
        {(title || showBack) && (
          <header className="p-4 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/50">
            {showBack && (
              <Link href="/">
                <Button variant="ghost" size="icon" className="-ml-2 rounded-full hover:bg-secondary/50">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </Link>
            )}
            {title && <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>}
          </header>
        )}
        
        <main className="flex-1 flex flex-col p-4 gap-4 relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
