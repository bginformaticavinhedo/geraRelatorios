"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Clock, Settings, LogOut, Package, Menu, X, Timer } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";

interface ShellProps {
    children: React.ReactNode;
}

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Relatório de Chamados", href: "/chamados", icon: FileText },
    { name: "Relatório de Apontamentos", href: "/apontamentos", icon: Clock },
    { name: "Banco de Horas", href: "/bancodehoras", icon: Timer },
    { name: "Inventários", href: "/inventarios", icon: Package },
    { name: "Configurações", href: "/config", icon: Settings },
];

export function Shell({ children }: ShellProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <div className="flex min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "w-64 bg-primary text-primary-foreground flex flex-col fixed inset-y-0 left-0 shadow-2xl z-50 transition-transform duration-300 ease-in-out",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold tracking-tight uppercase text-accent">
                        SharePoint<br />Reporter
                    </h1>
                    <button 
                        className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-all duration-200 group relative overflow-hidden",
                                pathname === item.href
                                    ? "bg-accent text-white shadow-lg translate-x-1"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {pathname === item.href && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                            )}
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 mt-auto">
                    <div className="mb-4 px-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Logado como</p>
                        <p className="text-sm font-semibold truncate text-slate-200">
                            {session?.user?.name || session?.user?.email}
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        className="w-full justify-start gap-2"
                        onClick={() => signOut()}
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen md:ml-64 w-full">
                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-primary p-4 border-b border-white/10 shadow-sm text-white">
                    <div className="flex items-center gap-3">
                        <button 
                            className="p-1 -ml-1 hover:bg-white/10 rounded-sm transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="h-6 w-6 text-white" />
                        </button>
                        <h1 className="text-lg font-bold tracking-tight uppercase text-accent leading-tight">
                            SharePoint<br className="hidden" />Reporter
                        </h1>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
