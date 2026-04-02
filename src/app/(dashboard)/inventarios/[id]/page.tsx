"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, Edit2, X, Save, ImageIcon } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Colunas desejadas do SharePoint com os nomes internos reais
const DESIRED_COLUMNS = [
    {
        label: "Foto",
        keys: ["Foto", "Photo", "DevicePhoto", "Image", "Imagem", "Foto_x0020_do_x0020_dispositivo", "FotoDispositivo", "Thumbnail", "Picture"],
        editable: false,
        isImage: true,
    },
    {
        label: "Título",
        keys: ["Title"],
        editable: true,
    },
    {
        label: "Status",
        keys: ["Status"],
        editable: true,
    },
    {
        label: "Configuração",
        keys: ["CONFIGURA_x00c7__x00c3_O", "Configura_x00e7__x00e3_o", "Configuracao"],
        editable: true,
    },
    {
        label: "Fabricante",
        keys: ["Fabricante", "Manufacturer"],
        editable: true,
    },
    {
        label: "Tipo de ativo",
        keys: ["AssetType", "Tipo_x0020_de_x0020_ativo", "TipoAtivo"],
        editable: true,
    },
    {
        label: "Cor",
        keys: ["Color", "Cor"],
        editable: true,
    },
    {
        label: "Número de série",
        keys: [
            "SerialNumber",
            "N_x00fa_mero_x0020_de_x0020_s_x00e9_rie",
            "N_x00fa_mero_x0020_de_x0020_s_x00",
            "NumeroSerie",
        ],
        editable: true,
    },
    {
        label: "Proprietário atual",
        keys: [
            "CurrentOwner",
            "Propriet_x00e1_rio_x0020_atual",
            "ProprietarioAtual",
        ],
        editable: true,
    },
    {
        label: "Observações da condição",
        keys: [
            "ConditionNotes",
            "Observa_x00e7__x00f5_es_x0020_da_x0020_condi_x00e7__x00e3_o",
            "Observa_x00e7__x00f5_es_x0020_da_",
            "ObservacoesCondicao",
        ],
        editable: true,
    },
];

// Busca o valor de um item usando múltiplas chaves possíveis
function getFieldValue(item: Record<string, any>, keys: string[]): string {
    for (const key of keys) {
        const val = item[key];
        if (val !== undefined && val !== null && val !== "") {
            if (typeof val === "object") {
                return val.LookupValue || val.Email || val.DisplayName || JSON.stringify(val);
            }
            return String(val);
        }
    }
    return "—";
}

// Busca a URL da imagem de um item
function getImageUrl(item: Record<string, any>, keys: string[]): string | null {
    for (const key of keys) {
        const val = item[key];
        if (val && typeof val === "object" && val._isImage && val.url) {
            return val.url;
        }
        // Caso seja uma URL direta
        if (val && typeof val === "string" && (val.startsWith("http") && (val.includes(".jpg") || val.includes(".png") || val.includes(".jpeg") || val.includes(".webp") || val.includes("getpreview")))) {
            return val;
        }
    }
    // Também procurar em campos dinâmicos (imageColumns do backend)
    for (const key of Object.keys(item)) {
        const val = item[key];
        if (val && typeof val === "object" && val._isImage && val.url) {
            return val.url;
        }
    }
    return null;
}

// Encontra a chave que realmente tem valor no item
function getActiveKey(item: Record<string, any>, keys: string[]): string | null {
    for (const key of keys) {
        if (item[key] !== undefined) {
            return key;
        }
    }
    // Retorna a primeira chave como fallback se nenhuma for encontrada (para criação)
    return keys[0];
}

export default function DetalhesInventarioPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [clientName, setClientName] = useState<string>("Carregando...");
    const [items, setItems] = useState<Record<string, any>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageColumns, setImageColumns] = useState<string[]>([]);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [codigoEmpresa, setCodigoEmpresa] = useState<string>("000");

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState<Record<string, any> | null>(null);
    const [editingFormData, setEditingFormData] = useState<Record<string, any>>({});
    const [originalFormData, setOriginalFormData] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchInventoryItems = async () => {
            try {
                const res = await fetch(`/api/inventarios/${id}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Erro ao buscar inventário");
                }

                setClientName(data.clientName || "Desconhecido");
                setCodigoEmpresa(data.codigoEmpresa || "000");
                setItems(data.items || []);
                if (data.imageColumns) setImageColumns(data.imageColumns);

            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInventoryItems();

        // Configura polling a cada 5 segundos para atualizações em tempo real (apenas se não estiver editando)
        let interval: NodeJS.Timeout;
        if (!isEditing) {
            interval = setInterval(() => {
                fetchInventoryItems();
            }, 5000);
        }

        return () => clearInterval(interval);
    }, [id, isEditing]);

    const handleEditClick = (item: Record<string, any>) => {
        setEditingItem(item);

        // Prepare initial form data based on DESIRED_COLUMNS
        const initialData: Record<string, any> = {};
        DESIRED_COLUMNS.forEach(col => {
            if (col.editable) {
                const activeKey = getActiveKey(item, col.keys);
                if (activeKey) {
                    const val = item[activeKey];
                    // Formata para exibição em campo de texto
                    initialData[activeKey] = val !== undefined && val !== null ?
                        (typeof val === 'object' ? val.LookupValue || val.Email || val.DisplayName || JSON.stringify(val) : String(val))
                        : "";
                }
            }
        });

        setOriginalFormData({ ...initialData });
        setEditingFormData({ ...initialData });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;

        // Calcula apenas os campos que foram realmente alterados
        const changedFields: Record<string, any> = {};
        for (const [key, value] of Object.entries(editingFormData)) {
            if (originalFormData[key] !== value) {
                changedFields[key] = value;
            }
        }

        if (Object.keys(changedFields).length === 0) {
            alert("Nenhum campo foi alterado.");
            return;
        }

        console.log("Campos alterados:", changedFields);

        setSaving(true);
        try {
            const res = await fetch(`/api/inventarios/${id}/items/${editingItem.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(changedFields),
            });

            const responseData = await res.json();

            if (!res.ok) {
                // Mostra detalhes dos campos que falharam se disponível
                if (responseData.failedFields) {
                    const failedFieldsList = Object.entries(responseData.failedFields)
                        .map(([field, msg]) => `• ${field}: ${msg}`)
                        .join("\n");
                    throw new Error(`${responseData.error}\n\nCampos com falha:\n${failedFieldsList}`);
                }
                throw new Error(responseData.details || responseData.error || "Erro ao salvar item");
            }

            // Verifica se foi parcial (alguns falharam)
            if (responseData.partial) {
                const failedFieldsList = Object.entries(responseData.failedFields || {})
                    .map(([field, msg]) => `• ${field}: ${msg}`)
                    .join("\n");
                alert(`Atenção: ${responseData.message}\n\nCampos salvos: ${responseData.successFields?.join(", ")}\n\nCampos com falha:\n${failedFieldsList}`);
            }

            // Refresh list
            const fetchInventoryItems = async () => {
                const updatedRes = await fetch(`/api/inventarios/${id}`);
                const data = await updatedRes.json();
                if (updatedRes.ok) setItems(data.items || []);
            };
            await fetchInventoryItems();

            setIsEditing(false);
            setEditingItem(null);
        } catch (err: any) {
            alert(`Erro ao salvar: ${err.message}`);
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleExportPDF = () => {
        if (items.length === 0) return;

        const doc = new jsPDF("l", "pt", "a4");

        // Header
        doc.setFontSize(20);
        doc.setTextColor(0, 137, 123); // #00897b
        doc.text(`Inventário - ${clientName}`, 40, 40);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 40, 60);
        doc.text(`Código Empresa: ${codigoEmpresa}`, 40, 75);

        // Prepare data for table
        const tableColumn = ["Etiqueta", "Título", "Status", "Configuração", "Fabricante", "Tipo de Ativo", "Proprietário"];
        const tableRows = items.map(item => [
            `BG_${codigoEmpresa}_${String(item.id).padStart(4, '0')}`,
            getFieldValue(item, ["Title"]),
            getFieldValue(item, ["Status"]),
            getFieldValue(item, ["CONFIGURA_x00c7__x00c3_O", "Configura_x00e7__x00e3_o", "Configuracao"]),
            getFieldValue(item, ["Fabricante", "Manufacturer"]),
            getFieldValue(item, ["AssetType", "Tipo_x0020_de_x0020_ativo", "TipoAtivo"]),
            getFieldValue(item, ["CurrentOwner", "Propriet_x00e1_rio_x0020_atual", "ProprietarioAtual"])
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 95,
            theme: 'striped',
            headStyles: { fillColor: [0, 137, 123], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 5 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 40, right: 40 }
        });

        doc.save(`Inventario_${clientName.replace(/\s+/g, '_')}_${codigoEmpresa}.pdf`);
    };

    return (
        <div className="text-slate-700">
            {/* Header */}
            <header className="pb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => router.push('/inventarios')}
                                className="p-1 hover:bg-slate-200 rounded-full transition-colors inline-flex items-center text-slate-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-bold text-[#00897b]">Inventário - <span className="text-slate-800">{clientName}</span></h2>
                        </div>
                        <p className="text-slate-500 text-sm">Visualize o inventário detalhado de ativos e acessos do cliente.</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleExportPDF}
                            className="px-4 py-2 border border-slate-300 rounded text-xs font-medium flex items-center gap-2 hover:bg-slate-50 bg-white transition-colors"
                        >
                            <FileText className="w-4 h-4 text-slate-600" /> PDF
                        </button>
                        <button className="px-4 py-2 border border-slate-300 rounded text-xs font-medium flex items-center gap-2 hover:bg-slate-50 bg-white transition-colors">
                            <Download className="w-4 h-4 text-slate-600" /> Excel
                        </button>
                    </div>
                </div>
            </header>

            <div className="pb-12 overflow-x-auto">
                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden min-w-[1200px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Etiqueta
                                </th>
                                {DESIRED_COLUMNS.map((col) => (
                                    <th key={col.label} className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-16">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td colSpan={DESIRED_COLUMNS.length + 2} className="px-4 py-8 text-center text-slate-500">
                                        Carregando inventário do SharePoint...
                                    </td>
                                </tr>
                            )}

                            {!loading && error && (
                                <tr>
                                    <td colSpan={DESIRED_COLUMNS.length + 2} className="px-4 py-8 text-center text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.length === 0 && (
                                <tr>
                                    <td colSpan={DESIRED_COLUMNS.length + 2} className="px-4 py-8 text-center text-slate-500">
                                        Nenhum registro encontrado no SharePoint para este cliente.
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-4 text-sm text-slate-600 font-mono font-bold">
                                        BG_{codigoEmpresa}_{String(item.id).padStart(4, '0')}
                                    </td>
                                    {DESIRED_COLUMNS.map((col) => (
                                        <td key={col.label} className="px-4 py-4 text-sm text-slate-600">
                                            {col.isImage ? (
                                                (() => {
                                                    const imgUrl = getImageUrl(item, [...col.keys, ...imageColumns]);
                                                    if (imgUrl) {
                                                        return (
                                                            <button onClick={() => setLightboxUrl(imgUrl)} className="block">
                                                                <img
                                                                    src={imgUrl}
                                                                    alt={getFieldValue(item, ["Title"])}
                                                                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-pointer"
                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                />
                                                            </button>
                                                        );
                                                    }
                                                    return (
                                                        <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                                                            <ImageIcon className="w-5 h-5 text-slate-300" />
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                getFieldValue(item, col.keys)
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            onClick={() => handleEditClick(item)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                            title="Editar item"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Edição */}
            {isEditing && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Editar Ativo <span className="text-slate-500 font-normal text-sm ml-2">({getFieldValue(editingItem, ["Title"])})</span></h3>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {DESIRED_COLUMNS.map(col => {
                                    if (!col.editable) return null;
                                    const activeKey = getActiveKey(editingItem, col.keys) || col.keys[0];
                                    return (
                                        <div key={col.label}>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">{col.label}</label>
                                            <input
                                                type="text"
                                                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-[#00897b] focus:border-[#00897b] sm:text-sm px-3 py-2 border bg-white"
                                                value={editingFormData[activeKey] || ""}
                                                onChange={(e) => setEditingFormData({ ...editingFormData, [activeKey]: e.target.value })}
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1 truncate">Campo SP: {activeKey}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#00897b] border border-transparent rounded-md hover:bg-[#00796b] flex items-center gap-2"
                            >
                                {saving ? (
                                    <>Salvando...</>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" /> Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Lightbox para foto ampliada */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
                    onClick={() => setLightboxUrl(null)}
                >
                    <div className="relative max-w-3xl max-h-[85vh] mx-4">
                        <button
                            onClick={() => setLightboxUrl(null)}
                            className="absolute -top-3 -right-3 bg-white text-slate-600 rounded-full p-1.5 shadow-lg hover:bg-slate-100 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={lightboxUrl}
                            alt="Foto do dispositivo"
                            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

        </div>
    );
}
