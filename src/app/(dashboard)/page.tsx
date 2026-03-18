"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, Settings, ArrowRight, TrendingUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { data: session } = useSession();
    const user = session?.user?.name || "Usuário";
    const firstName = user.split(" ")[0];

    const { data: stats, isLoading } = useQuery({
        queryKey: ["stats"],
        queryFn: async () => {
            const res = await fetch("/api/stats");
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        }
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now);
    const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

    return (
        <div className="space-y-8 animate-[fade-in_0.5s_ease-out]">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-sm bg-primary text-primary-foreground p-8 md:p-12 border border-slate-800">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
                        Olá, <span className="text-accent">{firstName}</span>.
                    </h1>
                    <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                        Bem-vindo ao centro de operações. Aqui você pode monitorar chamados críticos e acompanhar o desempenho da equipe em tempo real.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link href="/chamados" className="inline-flex items-center px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-sm hover:brightness-110 transition-all">
                            <FileText className="mr-2 h-5 w-5" />
                            Ver Relatórios
                        </Link>
                        <Link href="/manual" className="inline-flex items-center px-6 py-3 bg-white/10 text-white font-semibold rounded-sm hover:bg-white/20 transition-all backdrop-blur-sm">
                            Documentação
                        </Link>
                    </div>
                </div>

                {/* Abstract Background Element */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-accent/20 to-transparent pointer-events-none" />
                <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full border-[32px] border-white/5 opacity-50" />
            </div>

            {/* KPI Grid - Asymmetric */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* KPI 1: Chamados (Larger) */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-sm hover:border-accent/50 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-sm group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                            <FileText className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm text-slate-500">{capitalizedMonth}</span>
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight mb-1">Chamados Recentes</h3>
                    <p className="text-slate-500 text-sm mb-6">Acompanhe a fila de atendimento do mês atual.</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                        <div>
                            <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Abertos</p>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-300" /> : (
                                <p className="text-2xl font-mono font-bold text-amber-500 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> {stats?.abertos || 0}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Em andamento</p>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-300" /> : (
                                <p className="text-2xl font-mono font-bold text-blue-500 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> {stats?.emAndamento || 0}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Finalizados</p>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-300" /> : (
                                <p className="text-2xl font-mono font-bold text-emerald-500 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" /> {stats?.finalizados || 0}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs uppercase text-slate-400 font-semibold mb-1">Total</p>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-300" /> : (
                                <p className="text-2xl font-mono font-bold text-slate-700 dark:text-white uppercase tracking-tighter">
                                    {stats?.total || 0}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI 2: Apontamentos (Vertical) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-sm flex flex-col justify-between hover:border-accent/50 transition-colors group">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-sm group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                <Clock className="h-6 w-6" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold tracking-tight mb-1">Apontamentos</h3>
                        <p className="text-slate-500 text-sm">Horas lançadas em {capitalizedMonth}.</p>
                    </div>

                    <div className="mt-8">
                        {isLoading ? (
                            <div className="flex justify-end p-4">
                                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                            </div>
                        ) : (
                            <>
                                <p className="text-4xl font-mono font-bold tracking-tighter text-right">
                                    {Math.floor(stats?.totalHours || 0)}<span className="text-lg text-slate-400 font-sans font-normal ml-1">h</span> {Math.round(((stats?.totalHours || 0) - Math.floor(stats?.totalHours || 0)) * 60)}<span className="text-lg text-slate-400 font-sans font-normal ml-1">min</span>
                                </p>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-4 rounded-full overflow-hidden">
                                    <div
                                        className="bg-accent h-full transition-all duration-1000"
                                        style={{ width: `${Math.min((stats?.totalHours || 0) / 1.6, 100)}%` }} // Baseado em uma meta teórica
                                    />
                                </div>
                                <p className="text-xs text-right mt-2 text-slate-400">Total acumulado no mês</p>
                            </>
                        )}
                    </div>
                </div>

            </div>

            {/* Quick Access List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/chamados" className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 hover:border-solid hover:border-accent hover:bg-white dark:hover:bg-slate-900 transition-all rounded-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Relatório de Chamados</span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-accent" />
                </Link>
                <Link href="/apontamentos" className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 hover:border-solid hover:border-accent hover:bg-white dark:hover:bg-slate-900 transition-all rounded-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Relatório de Apontamentos</span>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-accent" />
                </Link>
                <Link href="/config" className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 hover:border-solid hover:border-accent hover:bg-white dark:hover:bg-slate-900 transition-all rounded-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Configurar Conexão</span>
                    <Settings className="h-4 w-4 text-slate-400 group-hover:text-accent transition-colors" />
                </Link>
            </div>
        </div>
    );
}
