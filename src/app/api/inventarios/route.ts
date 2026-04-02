import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGraphClient } from "@/lib/graph";
import { parseSharePointUrl } from "@/lib/utils";
import fs from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "src/data/inventarios.json");

// Define a interface para o Inventário
export interface Inventario {
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

// Inicializa o arquivo se não existir
function initData() {
    if (!fs.existsSync(path.dirname(dataFilePath))) {
        fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
    }
    if (!fs.existsSync(dataFilePath)) {
        const initialData: Inventario[] = [
            { id: "1", nome: "REMAX", setor: "Setor Imobiliário", maquinas: 0, licencas: 18, status: "Ativo", ultimaAtividade: "15/08/2023", codigoEmpresa: "001" },
            { id: "2", nome: "SQ QUIMICA", setor: "Indústria Química", maquinas: 0, licencas: 35, status: "Ativo", ultimaAtividade: "18/08/2023", codigoEmpresa: "002" },
            { id: "3", nome: "XAROPINHO", setor: "Agronegócio", maquinas: 0, licencas: 10, status: "Ativo", ultimaAtividade: "18/08/2023", codigoEmpresa: "003" },
            { id: "4", nome: "RODRIGO ANTUNES", setor: "Profissional Liberal", maquinas: 0, licencas: 4, status: "Ativo", ultimaAtividade: "18/08/2023", codigoEmpresa: "004" },
            { id: "5", nome: "REVISÃO E ORÇAMENTO", setor: "Varejo Local", maquinas: 0, licencas: 0, status: "Inativo", ultimaAtividade: "18/08/2023", codigoEmpresa: "005" }
        ];
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    }
}

export async function GET() {
    try {
        initData();
        const fileContent = fs.readFileSync(dataFilePath, "utf-8");
        const data: Inventario[] = JSON.parse(fileContent);

        // Tenta buscar a contagem de itens do SharePoint para cada cliente
        const session = await getServerSession(authOptions);
        if (session?.accessToken) {
            const graphClient = getGraphClient(session.accessToken);

            // Busca contagem de itens em paralelo para todos os clientes com URL
            const countPromises = data.map(async (client) => {
                if (!client.url) return { ...client, maquinas: 0 };

                const urlInfo = parseSharePointUrl(client.url);
                if (!urlInfo || !urlInfo.listName) return { ...client, maquinas: 0 };

                try {
                    // Resolver o Site ID
                    const siteResponse = await graphClient
                        .api(`/sites/${urlInfo.hostname}:${urlInfo.sitePath}`)
                        .get();
                    const siteId = siteResponse.id;

                    // Buscar informações da lista (inclui itemCount)
                    const listResponse = await graphClient
                        .api(`/sites/${siteId}/lists/${urlInfo.listName}`)
                        .select("id,displayName")
                        .expand("items($select=id)")
                        .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
                        .get();

                    const itemCount = listResponse.items?.length || 0;
                    return { ...client, maquinas: itemCount };
                } catch (err) {
                    console.error(`Falha ao buscar contagem para ${client.nome}:`, err);
                    return { ...client, maquinas: 0 };
                }
            });

            const enrichedData = await Promise.all(countPromises);
            return NextResponse.json(enrichedData);
        }

        // Se não autenticado, retorna os dados sem contagem atualizada
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        initData();
        const body = await request.json();
        const fileContent = fs.readFileSync(dataFilePath, "utf-8");
        const data: Inventario[] = JSON.parse(fileContent);

        let finalCodigo = body.codigoEmpresa;

        if (!finalCodigo) {
            // Generate next codigoEmpresa se vazio
            let maxCodigo = 0;
            data.forEach(client => {
                if (client.codigoEmpresa) {
                    const codNum = parseInt(client.codigoEmpresa, 10);
                    if (!isNaN(codNum) && codNum > maxCodigo) {
                        maxCodigo = codNum;
                    }
                }
            });
            finalCodigo = (maxCodigo + 1).toString().padStart(3, '0');
        }

        const newClient: Inventario = {
            id: Date.now().toString(),
            nome: body.nome || "Novo Cliente",
            setor: body.setor || "Geral",
            maquinas: 0,
            licencas: body.licencas || 0,
            status: body.status || "Ativo",
            ultimaAtividade: new Date().toLocaleDateString("pt-BR"),
            url: body.url || "",
            codigoEmpresa: finalCodigo
        };

        data.push(newClient);
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

        return NextResponse.json(newClient, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
    }
}
