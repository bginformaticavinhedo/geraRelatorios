"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Chamado } from "@/types";
import { Loader2, Download, Search } from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { cn } from "@/lib/utils";

export default function ChamadosReport() {
    const [filters, setFilters] = useState({
        cliente: "",
        status: "",
        startDate: "",
        endDate: ""
    });

    const { data, isLoading, isError, error } = useQuery<Chamado[]>({
        queryKey: ["chamados", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.cliente) params.append("cliente", filters.cliente);
            if (filters.status) params.append("status", filters.status);
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);

            const res = await fetch(`/api/chamados?${params.toString()}`);
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

    const handleExportPDF = () => {
        if (!data) return;
        const exportData = data.map(item => {
            let dataStr = '';
            if (item.Created) {
                try {
                    const date = new Date(item.Created);
                    if (!isNaN(date.getTime())) {
                        dataStr = date.toLocaleDateString('pt-BR');
                    }
                } catch (e) { }
            }
            return {
                ...item,
                Data: dataStr || '-',
                Observacoes: item.Descricao || '-'
            };
        });
        exportToPDF(exportData, "Relatório de Chamados", ["Title", "Cliente", "Data", "Status", "Tecnico", "Observacoes"]);
    };

    const handleExportExcel = () => {
        if (!data) return;
        const exportData = data.map(item => {
            let dataStr = '';
            if (item.Created) {
                try {
                    const date = new Date(item.Created);
                    if (!isNaN(date.getTime())) {
                        dataStr = date.toLocaleDateString('pt-BR');
                    }
                } catch (e) { }
            }
            return {
                "Chamado": item.Title,
                "Cliente": item.Cliente,
                "Data": dataStr || '-',
                "Canal de Atendimento": item.Canal || '-',
                "Status": item.Status,
                "Técnico": item.Tecnico,
                "Observações": item.Descricao || '-'
            };
        });
        exportToExcel(exportData, "Relatório de Chamados");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#0d9488' }}>Relatório de Chamados</h2>
                    <p className="text-slate-400 text-sm">Visualize o histórico de atendimento por período e cliente.</p>
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

            {/* Filters (Sharp geometry) */}
            <div className="bg-white p-4 rounded-sm border-l-4 border-accent shadow-sm grid gap-4 md:grid-cols-5 items-end">
                <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase text-slate-500">Cliente</span>
                    <input
                        type="text"
                        placeholder="Nome do Cliente"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-none focus:outline-none focus:border-accent transition-colors"
                        value={filters.cliente}
                        onChange={(e) => setFilters({ ...filters, cliente: e.target.value })}
                    />
                </label>
                <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase text-slate-500">Status</span>
                    <select
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-none focus:outline-none focus:border-accent transition-colors"
                        value={filters.status || ""}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Todos</option>
                        <option value="Aberto">Aberto</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Finalizado">Finalizado</option>
                    </select>
                </label>
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

            {/* Canal Summary */}
            {data && data.length > 0 && (
                <div className="bg-white border-l-4 border-slate-800 p-4 rounded-sm shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div>
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-3">Atendimentos no Período</h3>
                        <div className="flex flex-wrap gap-3 mt-1">
                            {Object.entries(
                                data.reduce((acc: Record<string, number>, item: Chamado) => {
                                    const c = (item.Canal || "Sem Canal Info").trim();
                                    acc[c] = (acc[c] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            ).map(([canal, count]) => {
                                const l = (canal as string).toLowerCase();
                                const label = l === "remoto" ? "remotos" : l === "presencial" ? "presenciais" : l;
                                return (
                                    <div key={canal as string} className="text-sm font-semibold text-slate-700 bg-slate-50 px-4 py-1.5 rounded-sm border border-slate-200 flex items-center gap-2">
                                        <span className="text-accent text-lg font-bold">{count as number}</span>
                                        <span className="capitalize">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
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
                        <p className="font-bold text-lg">⚠️ Ops! Houve um problema.</p>
                        <p className="text-sm">Ocorreu um erro ao carregar os chamados. Por favor, tente novamente mais tarde ou contate o suporte.</p>
                        <p className="text-xs mt-4 text-slate-400">Verifique sua conexão com o SharePoint</p>
                    </div>
                ) : data && data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm item-center">
                            <thead className="bg-[#0f172a] text-white uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 text-left">Chamado</th>
                                    <th className="px-4 py-3 text-left">Cliente</th>
                                    <th className="px-4 py-3 text-left">Abertura</th>
                                    <th className="px-4 py-3 text-left">Tecnico</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-3 font-medium text-slate-700">{item.Title}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.Cliente}</td>
                                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.CreatedFormatted || '-'}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.Tecnico}</td>
                                        <td className="px-4 py-3">
                                            <span className={cn("px-2 py-0.5 text-[0.7rem] uppercase font-bold tracking-wider rounded-sm",
                                                item.Status === 'Fechado' ? "bg-green-100 text-green-700" :
                                                    item.Status === 'Em Aberto' ? "bg-amber-100 text-amber-700" :
                                                        "bg-slate-100 text-slate-600"
                                            )}>
                                                {item.Status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        Nenhum chamado encontrado para os filtros selecionados.
                    </div>
                )}
            </div>
        </div>
    );
}
