"use client";

import { FileText, ShieldCheck, LayoutDashboard, Clock, AlertTriangle, ArrowRight, Download, Search, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ManualPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-[fade-in_0.5s_ease-out]">
            {/* Header */}
            <div className="border-b border-slate-200 pb-8">
                <div className="inline-flex items-center justify-center p-3 bg-accent/10 text-accent rounded-sm mb-6">
                    <FileText className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold tracking-tighter text-slate-900 mb-4">Manual do Usuário</h1>
                <p className="text-lg text-slate-500 max-w-2xl">
                    Guia de referência oficial para o uso e extração de dados da plataforma SharePoint Reporter.
                </p>
            </div>

            {/* 1. Introdução */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight border-l-4 border-accent pl-4">1. Introdução</h2>
                <div className="prose prose-slate max-w-none text-slate-600 pl-5">
                    <p>
                        O <strong>SharePoint Reporter</strong> é um sistema corporativo avançado desenvolvido para consolidar, monitorar e exportar dados gerenciais provenientes das listas do Microsoft SharePoint. A plataforma oferece à equipe de suporte e gestão uma visão centralizada para o acompanhamento de chamados técnicos e o gerenciamento de apontamentos de horas.
                    </p>
                </div>
            </section>

            {/* 2. Autenticação */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight border-l-4 border-accent pl-4">2. Acesso e Segurança</h2>
                <div className="pl-5 space-y-4">
                    <p className="text-slate-600">
                        Visando os mais altos padrões de segurança corporativa, o acesso ao sistema é estritamente protegido pelo Microsoft Entra ID (Azure AD).
                    </p>
                    <ol className="list-decimal pl-5 text-slate-600 space-y-2 marker:text-accent marker:font-bold">
                        <li>Acesse o portal da aplicação.</li>
                        <li>Na tela inicial, selecione <strong>Entrar com Microsoft</strong>.</li>
                        <li>Insira suas credenciais corporativas padrão.</li>
                    </ol>

                    {/* MOCK UI IMAGE */}
                    <div className="mt-6 bg-slate-100 p-8 rounded-sm border border-slate-200 flex justify-center items-center select-none shadow-inner">
                        <div className="bg-white p-6 rounded-sm border border-slate-200 w-80 text-center shadow-lg transform rotate-1 transition-transform hover:rotate-0 duration-300">
                            <ShieldCheck className="w-10 h-10 text-accent mx-auto mb-4" />
                            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-6"></div>
                            <div className="bg-[#2f2f2f] text-white py-3 px-4 rounded-sm flex items-center justify-center gap-2 font-medium text-sm">
                                <svg className="h-4 w-4" viewBox="0 0 23 23">
                                    <path fill="#f3f3f3" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                                </svg>
                                Entrar com Microsoft
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Dashboard */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight border-l-4 border-accent pl-4">3. Visão Geral (Dashboard)</h2>
                <div className="pl-5 space-y-4">
                    <p className="text-slate-600">
                        Após a autenticação, você será direcionado ao Centro de Operações, que exibe os indicadores de desempenho essenciais em tempo real.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-white p-5 border border-slate-200 rounded-sm hover:border-accent/50 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="h-5 w-5 text-accent" />
                                <h3 className="font-bold text-slate-800">Métricas de Chamados</h3>
                            </div>
                            <p className="text-sm text-slate-500">Abertos, Em andamento, Finalizados e Total do mês vigente.</p>
                        </div>
                        <div className="bg-white p-5 border border-slate-200 rounded-sm hover:border-accent/50 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="h-5 w-5 text-accent" />
                                <h3 className="font-bold text-slate-800">Métricas de Apontamentos</h3>
                            </div>
                            <p className="text-sm text-slate-500">Soma total do tempo produtivo (horas/min) da equipe no mês.</p>
                        </div>
                    </div>

                    {/* MOCK UI IMAGE */}
                    <div className="mt-6 bg-[#0f172a] p-8 rounded-sm border border-slate-800 relative overflow-hidden select-none">
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-accent/20 to-transparent pointer-events-none" />
                        <h4 className="text-white text-2xl font-bold tracking-tight mb-2">Olá, Colaborador.</h4>
                        <p className="text-slate-400 text-sm max-w-sm mb-6">Aqui você pode monitorar chamados críticos e acompanhar o desempenho da equipe.</p>
                        <div className="flex gap-2">
                            <div className="bg-accent/20 text-accent px-4 py-2 text-xs font-bold rounded-sm border border-accent/20">Abertos: 12</div>
                            <div className="bg-white/10 text-white px-4 py-2 text-xs font-bold rounded-sm">145h 30min</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Chamados */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight border-l-4 border-accent pl-4">4. Relatório de Chamados</h2>
                <div className="pl-5 space-y-4">
                    <p className="text-slate-600">
                        Módulo dedicado à análise e auditoria das requisições de atendimento da equipe de suporte.
                    </p>
                    <ul className="list-disc pl-5 text-slate-600 space-y-1 marker:text-slate-300">
                        <li><strong>Filtros:</strong> Busca por Cliente, Status e Período (Data Inicial/Final).</li>
                        <li><strong>Exportação:</strong> Arquivos em <span className="text-red-500 font-bold text-sm bg-red-50 px-1 rounded">PDF</span> ou <span className="text-green-600 font-bold text-sm bg-green-50 px-1 rounded">Excel</span>.</li>
                    </ul>

                    {/* MOCK UI IMAGE */}
                    <div className="mt-6 bg-slate-50 p-6 rounded-sm border border-slate-200 select-none">
                        <div className="bg-white p-3 border-l-4 border-accent shadow-sm flex gap-2 items-center mb-4">
                            <Search className="h-4 w-4 text-slate-400" />
                            <div className="h-2 w-24 bg-slate-200 rounded"></div>
                            <div className="h-2 w-16 bg-slate-200 rounded ml-auto"></div>
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#0f172a] text-white">
                                <tr>
                                    <th className="p-2">Chamado</th>
                                    <th className="p-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                <tr>
                                    <td className="p-2">INC-001</td>
                                    <td className="p-2"><span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-sm">Em Aberto</span></td>
                                </tr>
                                <tr>
                                    <td className="p-2">REQ-092</td>
                                    <td className="p-2"><span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-sm">Fechado</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 5. Apontamentos */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight border-l-4 border-accent pl-4">5. Relatório de Apontamentos</h2>
                <div className="pl-5 space-y-4">
                    <p className="text-slate-600">
                        O painel converte automaticamente horas decimais (SharePoint) para leituras usuais (ex: `1,5` = `1h 30min`), facilitando o acompanhamento cronológico da alocação da equipe.
                    </p>

                    <Link href="/apontamentos" className="inline-flex items-center text-sm font-bold text-accent hover:text-slate-900 transition-colors group">
                        Acessar Apontamentos
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* 6. Fix & Troubleshooting */}
            <section className="space-y-6 opacity-80 hover:opacity-100 transition-opacity">
                <h2 className="text-2xl font-bold tracking-tight border-l-4 border-slate-400 pl-4">6. Boas Práticas e Resolução</h2>
                <div className="pl-5 space-y-4 text-sm text-slate-600 bg-slate-50 p-6 border border-slate-200 rounded-sm">
                    <div className="flex gap-4">
                        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                        <div>
                            <p className="font-bold text-slate-800 mb-1">Loops de Autenticação (Microsoft Login)</p>
                            <p>Caso o sistema retorne frequentemente para a tela de login, isso indica ausência das Variáveis de Ambiente na infraestrutura (Netlify) ou configuração pendente na URI do Microsoft Entra ID. Comunique o administrador.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-slate-200">
                        <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
                        <div>
                            <p className="font-bold text-slate-800 mb-1">Performance da API</p>
                            <p>O sistema consome o Microsoft Graph. Bases muito vastas requerem 1-3 segundos para processar os filtros localmente. Aguarde a conclusão da barra de progresso antes de emitir PDFs.</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
