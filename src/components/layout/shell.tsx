"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Clock, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";

interface ShellProps {
    children: React.ReactNode;
}

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Relatório de Chamados", href: "/chamados", icon: FileText },
    { name: "Relatório de Apontamentos", href: "/apontamentos", icon: Clock },
    { name: "Configurações", href: "/config", icon: Settings },
];

export function Shell({ children }: ShellProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="flex min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-primary-foreground flex flex-col fixed h-full shadow-2xl z-50">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-xl font-bold tracking-tight uppercase text-accent">
                        SharePoint<br />Reporter
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
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

                <div className="p-4 border-t border-white/10">
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

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
