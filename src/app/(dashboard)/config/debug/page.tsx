"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search } from "lucide-react";

export default function DebugPage() {
    const { data: session } = useSession();
    const [listName, setListName] = useState("Chamados");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function fetchLists() {
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const res = await fetch(`/api/debug?action=listLists`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || JSON.stringify(json));
            setResult(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function fetchFields() {
        setLoading(true);
        setError("");
        setResult(null);
        try {
            // We will call a new debug API endpoint
            const res = await fetch(`/api/debug?list=${listName}&action=inspect`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || JSON.stringify(json));
            setResult(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#0d9488' }}>Depuração de Campos</h2>
                <p className="text-slate-400 text-sm">Descubra os nomes internos das colunas do SharePoint.</p>
            </div>

            <div className="bg-white p-6 rounded-sm shadow-sm space-y-4 border border-slate-200">
                <div className="flex gap-4">
                    <input
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        className="border p-2 rounded-sm w-full font-mono text-sm"
                        placeholder="Nome da Lista (ex: Chamados)"
                    />
                    <Button onClick={fetchFields} disabled={loading}>
                        {loading ? "Carregando..." : "Inspecionar Lista"}
                    </Button>
                    <Button variant="secondary" onClick={fetchLists} disabled={loading}>
                        Ver Todas as Listas
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-sm text-sm border-l-4 border-red-500">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-4">
                        <h3 className="font-bold">Campos Encontrados no 1º Item:</h3>
                        <div className="bg-slate-900 text-slate-200 p-4 rounded-sm overflow-auto max-h-[500px] font-mono text-xs">
                            <pre>{JSON.stringify(result, null, 2)}</pre>
                        </div>
                        <p className="text-xs text-slate-500">Procure por chaves como 'DataAbertura', 'OData__x0044_ata', etc.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
