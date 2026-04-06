"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Apontamento } from "@/types";
import { Loader2, Download, Search } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";

export default function BancoDeHorasReport() {
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: ""
    });

    const { data, isLoading, isError, error } = useQuery<Apontamento[]>({
        queryKey: ["bancodehoras", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);

            const res = await fetch(`/api/bancodehoras?${params.toString()}`);
            if (!res.ok) {
                let errorData;
                try {
                    errorData = await res.json();
                } catch {
                    errorData = { error: res.statusText };
                }
                const err: any = new Error(errorData.error || "Failed to fetch");
                err.details = errorData.details;
                err.possibleFix = errorData.possibleFix;
                err.availableColumnsOnFirstItem = errorData.availableColumnsOnFirstItem;
                throw err;
            }
            return res.json();
        },
    });

    const totalHoras = data ? data.reduce((acc, curr) => acc + (curr.Horas || 0), 0) : 0;

    const handleExportPDF = () => {
        if (!data) return;
        const exportData = data.map(item => {
            let dataStr = '';
            if (item.Created) {
                try {
                    const date = new Date(item.Created);
                    if (!isNaN(date.getTime())) {
                        dataStr = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                    }
                } catch (e) { }
            }

            return {
                ...item,
                Data: dataStr || '-'
            };
        });
        exportToPDF(exportData, "Relatório Banco de Horas", ["Title", "Data", "Tecnico", "HoraInicioFormatada", "HoraFinalFormatada", "DuracaoFormatada", "Descricao"]);
    };

    const handleExportExcel = () => {
        if (!data) return;
        const exportData = data.map(item => {
            let dataStr = '';
            if (item.Created) {
                try {
                    const date = new Date(item.Created);
                    if (!isNaN(date.getTime())) {
                        dataStr = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                    }
                } catch (e) { }
            }

            return {
                "Título / ID": item.Title,
                "Data": dataStr || '-',
                "Responsável": item.Tecnico,
                "Início": item.HoraInicioFormatada,
                "Fim": item.HoraFinalFormatada,
                "Duração": item.DuracaoFormatada,
                "Descrição": item.Descricao
            };
        });
        exportToExcel(exportData, "Relatório Banco de Horas");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#0d9488' }}>Banco de Horas</h2>
                    <p className="text-slate-400 text-sm">Relatório detalhado do banco de horas por técnico.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportPDF} disabled={!data?.length}>
                        <Download className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel} disabled={!data?.length}>
                        <Download className="mr-2 h-4 w-4" /> Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-sm border-l-4 border-accent shadow-sm grid gap-4 md:grid-cols-3 items-end">
                <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase text-slate-500">Data Inicial</span>
                    <input
                        type="date"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-none focus:outline-none focus:border-accent transition-colors"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                </label>
                <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase text-slate-500">Data Final</span>
                    <input
                        type="date"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-none focus:outline-none focus:border-accent transition-colors"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                </label>
                <Button className="h-10 rounded-sm w-full">
                    <Search className="mr-2 h-4 w-4" /> Filtrar
                </Button>
            </div>

            {/* Summary Card */}
            {data && (
                <div className="bg-[#0f172a] text-white p-4 rounded-sm w-full md:w-64 border-l-4 border-teal-400">
                    <p className="text-xs uppercase opacity-70">Total de Horas</p>
                    <p className="text-3xl font-bold font-mono text-teal-400">
                        {(() => {
                            const totalMinutes = Math.round(totalHoras * 60);
                            const wholeHours = Math.floor(totalMinutes / 60);
                            const remainingMinutes = totalMinutes % 60;
                            return `${wholeHours}h ${remainingMinutes}min`;
                        })()}
                    </p>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    </div>
                ) : isError ? (
                    <div className="p-12 text-center text-red-500 space-y-2">
                        <p className="font-bold">Erro ao carregar dados.</p>
                        <p className="text-sm">{(error as any)?.message}</p>
                        {(error as any)?.details && (
                            <p className="text-xs bg-red-50 p-2 rounded border border-red-100 font-mono text-left overflow-auto max-h-32">
                                Details: {(error as any).details}
                            </p>
                        )}
                        {(error as any)?.possibleFix && (
                            <p className="text-xs bg-red-50 p-2 rounded border border-red-100 font-mono text-left overflow-auto max-h-32">
                                Possible Fix: {(error as any).possibleFix}
                            </p>
                        )}
                        {(error as any)?.availableColumnsOnFirstItem && (
                            <div className="text-left mt-4 p-4 bg-slate-900 text-slate-200 rounded text-xs font-mono">
                                <p className="font-bold mb-2 text-yellow-400">⚠️ DEBUG: Colunas Disponíveis (Internal Names):</p>
                                <div className="break-all">
                                    {(error as any).availableColumnsOnFirstItem}
                                </div>
                            </div>
                        )}
                    </div>
                ) : data && data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#0f172a] text-white uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">TITULO</th>
                                    <th className="px-4 py-3 text-left">Pessoa</th>
                                    <th className="px-4 py-3 text-left">Hora Início</th>
                                    <th className="px-4 py-3 text-left">Hora Final</th>
                                    <th className="px-4 py-3 text-left">Duração</th>
                                    <th className="px-4 py-3 text-left">Descrição</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                                            {item.Title || '-'}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{item.Tecnico}</td>
                                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.HoraInicioFormatada || '-'}</td>
                                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.HoraFinalFormatada || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-sm border border-teal-100 cursor-help"
                                                title={`${item.Horas}h decimais`}
                                            >
                                                {item.DuracaoFormatada}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={item.Descricao}>{item.Descricao}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        Nenhum registro de banco de horas encontrado no período.
                    </div>
                )}
            </div>
        </div>
    );
}
