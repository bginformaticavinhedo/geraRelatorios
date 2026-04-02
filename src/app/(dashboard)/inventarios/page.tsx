"use client";

import { useEffect, useState } from "react";
import { Download, Table, Search, Building2, FlaskConical, Tractor, UserCircle, Store, ArrowRight, Plus, X, Trash2, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientInventory {
    id: string;
    nome: string;
    setor: string;
    maquinas: number;
    licencas: number;
    status: "Ativo" | "Inativo";
    ultimaAtividade: string;
    url?: string;
    codigoEmpresa?: string;
}

export default function InventariosPage() {
    const router = useRouter();
    const [clients, setClients] = useState<ClientInventory[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Form inputs
    const [newClient, setNewClient] = useState({
        nome: "",
        setor: "",
        licencas: 0,
        status: "Ativo",
        url: "",
        codigoEmpresa: ""
    });

    const fetchClients = async () => {
        try {
            const res = await fetch("/api/inventarios");
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (error) {
            console.error("Error fetching clients", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();

        // Configura polling a cada 5 segundos para atualizações em tempo real
        const interval = setInterval(() => {
            fetchClients();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const openModalForEdit = (e: React.MouseEvent, client: ClientInventory) => {
        e.stopPropagation();
        setNewClient({
            nome: client.nome,
            setor: client.setor,
            licencas: client.licencas,
            status: client.status,
            url: client.url || "",
            codigoEmpresa: client.codigoEmpresa || ""
        });
        setEditingId(client.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing && editingId ? `/api/inventarios/${editingId}` : "/api/inventarios";
            const method = isEditing && editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newClient),
            });
            if (res.ok) {
                await fetchClients();
                closeModal();
            }
        } catch (error) {
            console.error("Error saving client", error);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setEditingId(null);
        setNewClient({ nome: "", setor: "", licencas: 0, status: "Ativo", url: "", codigoEmpresa: "" });
    };

    const handleDeleteClient = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir este inventário do cliente?")) return;

        try {
            const res = await fetch(`/api/inventarios/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchClients();
            }
        } catch (error) {
            console.error("Error deleting client", error);
        }
    };

    const getIcon = (setor: string, nome: string) => {
        if (nome === "REMAX") return <Building2 className="w-6 h-6 text-[#00897b]" />;
        if (nome === "SQ QUIMICA") return <FlaskConical className="w-6 h-6 text-[#00897b]" />;
        if (nome === "XAROPINHO") return <Tractor className="w-6 h-6 text-[#00897b]" />;
        if (nome === "RODRIGO ANTUNES") return <UserCircle className="w-6 h-6 text-[#00897b]" />;
        if (nome === "REVISÃO E ORÇAMENTO") return <Store className="w-6 h-6 text-[#00897b]" />;
        return <Building2 className="w-6 h-6 text-[#00897b]" />; // default
    };

    const StatusBadge = ({ status }: { status: string }) => {
        if (status === "Ativo") {
            return (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
                    Ativo
                </span>
            );
        }
        return (
            <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded uppercase">
                {status}
            </span>
        );
    };

    const filteredClients = clients.filter(client => {
        const query = searchQuery.toLowerCase();
        return (
            client.nome.toLowerCase().includes(query) ||
            (client.codigoEmpresa && client.codigoEmpresa.toLowerCase().includes(query))
        );
    });

    return (
        <div className="text-slate-800">
            {/* Header */}
            <header className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#00897b]">Seleção de Cliente - Inventário</h2>
                    <p className="text-slate-500 text-sm mt-1">Visualize e gerencie os inventários de hardware e software por cliente.</p>
                </div>
            </header>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-8 border-l-4 border-l-[#00897b]">
                <div className="flex flex-col gap-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Cliente / Código</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                className="w-full bg-slate-50 border-slate-200 rounded text-sm focus:ring-[#00897b] focus:border-[#00897b] transition-all pl-10 pr-3 py-2 border h-[42px]" 
                                placeholder="Pesquisar por nome ou código da empresa (ex: 001)..." 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => {
                                setNewClient({ nome: "", setor: "", licencas: 0, status: "Ativo", url: "", codigoEmpresa: "" });
                                setIsEditing(false);
                                setEditingId(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-[#00897b] hover:bg-[#00796b] text-white px-8 py-2 rounded flex items-center justify-center gap-2 font-bold text-sm transition-all border border-transparent whitespace-nowrap h-[42px] shadow-sm active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4" /> Novo Cliente
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {loading ? (
                    <div className="text-slate-500 text-sm">Carregando clientes...</div>
                ) : filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <div
                            key={client.id}
                            onClick={() => router.push(`/inventarios/${client.id}`)}
                            className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-t-4 border-t-[#00897b] flex flex-col"
                        >
                            <div className="p-5 flex-1 block">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                        {getIcon(client.setor, client.nome)}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <StatusBadge status={client.status} />
                                        <button
                                            onClick={(e) => openModalForEdit(e, client)}
                                            className="text-slate-300 hover:text-blue-500 transition-colors bg-white hover:bg-blue-50 p-1.5 rounded-full z-10"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClient(e, client.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-1.5 rounded-full z-10"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-[#00897b] transition-colors line-clamp-1 flex items-center justify-between">
                                    <span>{client.nome}</span>
                                    {client.codigoEmpresa && (
                                        <span className="text-xs bg-slate-100 text-slate-500 font-normal px-2 py-0.5 rounded border border-slate-200 ml-2">
                                            {client.codigoEmpresa}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-1">{client.setor}</p>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Máquinas</p>
                                        <p className="text-xl font-semibold text-slate-800">{client.maquinas.toString().padStart(2, '0')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Licenças</p>
                                        <p className="text-xl font-semibold text-slate-800">{client.licencas.toString().padStart(2, '0')}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 py-3 bg-slate-50 flex justify-between items-center mt-auto block">
                                <span className="text-xs text-slate-500">Última att: {client.ultimaAtividade}</span>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#00897b]" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                        <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">Nenhum cliente encontrado com esse termo.</p>
                        <button 
                            onClick={() => { setSearchQuery(""); }}
                            className="mt-4 text-[#00897b] text-sm font-semibold hover:underline"
                        >
                            Limpar busca
                        </button>
                    </div>
                )}

            </div>

            {/* Modal de Novo Cliente. We implement custom overlay to avoid messing with existing Dialog styles if they don't match. Or if this project uses radix dialog, it's fine. */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">{isEditing ? "Editar Cliente" : "Adicionar Novo Cliente"}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddClient} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente *</label>
                                <input
                                    required
                                    className="w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00897b] focus:border-[#00897b] sm:text-sm px-3 py-2 border"
                                    placeholder="Ex: Empresa Ltda"
                                    value={newClient.nome}
                                    onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })}
                                />
                            </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                                 <input
                                     className="w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00897b] focus:border-[#00897b] sm:text-sm px-3 py-2 border"
                                     placeholder="Ex: Tecnologia"
                                     value={newClient.setor}
                                     onChange={(e) => setNewClient({ ...newClient, setor: e.target.value })}
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Código da Empresa</label>
                                    <input
                                        type="text"
                                        className="w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00897b] focus:border-[#00897b] sm:text-sm px-3 py-2 border"
                                        placeholder="Ex: 001 (Automático se vazio)"
                                        value={newClient.codigoEmpresa}
                                        onChange={(e) => setNewClient({ ...newClient, codigoEmpresa: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Licenças</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00897b] focus:border-[#00897b] sm:text-sm px-3 py-2 border"
                                        value={newClient.licencas}
                                        onChange={(e) => setNewClient({ ...newClient, licencas: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Link do Inventário</label>
                                <input
                                    type="url"
                                    className="w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00897b] focus:border-[#00897b] sm:text-sm px-3 py-2 border"
                                    placeholder="https://exemplo.sharepoint.com/..."
                                    value={newClient.url}
                                    onChange={(e) => setNewClient({ ...newClient, url: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-1">Insira o link para acessar o inventário detalhado deste cliente.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00897b]">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#00897b] border border-transparent rounded-md hover:bg-[#00796b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00897b]">
                                    {isEditing ? "Salvar Alterações" : "Salvar Cliente"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
