"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function ConfigPage() {
    const { data: session } = useSession();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#0d9488' }}>Configurações</h2>
                <p className="text-slate-400 text-sm">Gerencie o ambiente do sistema.</p>
            </div>

            <div className="bg-white p-6 rounded-sm shadow-sm space-y-6 border border-slate-200">
                <div>
                    <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-4">Autenticação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-none border border-slate-100">
                            <span className="text-xs uppercase text-slate-500 block mb-1">Usuário Logado</span>
                            <div className="font-mono text-sm">{session?.user?.email}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-none border border-slate-100">
                            <span className="text-xs uppercase text-slate-500 block mb-1">Status</span>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-green-700">Conectado via Azure AD</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-4">Conexão SharePoint</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        O ID do Site SharePoint está configurado via variáveis de ambiente.
                    </p>
                    <div className="bg-slate-900 text-slate-300 p-4 font-mono text-xs overflow-x-auto rounded-none">
                        SHAREPOINT_SITE_ID=********-****-****-****-************
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Para alterar o site alvo, edite o arquivo <code className="bg-slate-100 px-1">.env.local</code> no servidor.
                    </p>
                </div>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => window.location.href = '/config/debug'}>Depurar Colunas</Button>
                    <Button disabled variant="secondary">Salvar Alterações (Desabilitado)</Button>
                </div>
            </div>
        </div>
    );
}
