import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGraphClient } from "@/lib/graph";
import { parseSharePointUrl } from "@/lib/utils";
import fs from "fs";
import path from "path";

// Define a interface para o Inventário local
interface Inventario {
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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch the client from the local DB
    const dataFilePath = path.join(process.cwd(), "src/data/inventarios.json");
    let clientName = "";
    let clientUrl = "";
    let codigoEmpresa = "";
    try {
        if (fs.existsSync(dataFilePath)) {
            const fileContent = fs.readFileSync(dataFilePath, "utf-8");
            const data: Inventario[] = JSON.parse(fileContent);
            const client = data.find((c) => c.id === id);
            if (client) {
                clientName = client.nome;
                clientUrl = client.url || "";
                codigoEmpresa = client.codigoEmpresa || "000";
            } else {
                return NextResponse.json({ error: "Client not found in local db" }, { status: 404 });
            }
        }
    } catch (e) {
        console.error("Local DB read error", e);
        return NextResponse.json({ error: "Failed to parse local db" }, { status: 500 });
    }

    if (!clientUrl) {
        return NextResponse.json({ error: "Este cliente não possui uma URL de inventário configurada." }, { status: 400 });
    }

    const urlInfo = parseSharePointUrl(clientUrl);
    if (!urlInfo || !urlInfo.listName) {
        return NextResponse.json({ error: "URL do SharePoint inválida. Formato esperado: https://tenant.sharepoint.com/sites/SiteName/Lists/NomeDaLista/..." }, { status: 400 });
    }

    try {
        const graphClient = getGraphClient(session.accessToken);

        // 1. Resolver o Site ID dinamicamente a partir do hostname + sitePath
        const siteResponse = await graphClient
            .api(`/sites/${urlInfo.hostname}:${urlInfo.sitePath}`)
            .get();

        const siteId = siteResponse.id; // formato: hostname,siteGuid,webGuid

        // 2. Buscar colunas da lista para descobrir campos de imagem/thumbnail
        let imageColumns: string[] = [];
        try {
            const columnsResponse = await graphClient
                .api(`/sites/${siteId}/lists/${urlInfo.listName}/columns`)
                .get();

            imageColumns = columnsResponse.value
                .filter((col: any) => col.thumbnail || col.columnGroup === "Image" || col.displayName?.toLowerCase().includes("foto") || col.displayName?.toLowerCase().includes("photo") || col.displayName?.toLowerCase().includes("imagem") || col.displayName?.toLowerCase().includes("image"))
                .map((col: any) => col.name);

            console.log("=== IMAGE COLUMNS FOUND ===", imageColumns);
            console.log("=== ALL COLUMNS ===", columnsResponse.value.map((c: any) => ({ name: c.name, displayName: c.displayName, type: c.columnGroup })));
        } catch (colErr) {
            console.error("Error fetching columns:", colErr);
        }

        // 3. Buscar itens da lista usando o nome extraído
        const response = await graphClient
            .api(`/sites/${siteId}/lists/${urlInfo.listName}/items`)
            .expand('fields')
            .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
            .top(2000)
            .get();

        // DEBUG: Log all field names from the first item to discover correct internal names
        if (response.value.length > 0) {
            const sampleFields = response.value[0].fields;
            console.log("=== SHAREPOINT FIELD NAMES (raw keys) ===");
            console.log(Object.keys(sampleFields));
            console.log("=== SAMPLE ITEM (first) ===");
            console.log(JSON.stringify(sampleFields, null, 2));
        }

        const items = response.value.map((item: any) => {
            const f = item.fields;

            // Processar campos de imagem - transformar JSON em URL acessível
            const processedFields: Record<string, any> = { ...f };

            // Buscar todos os campos que possam conter imagem
            for (const key of Object.keys(f)) {
                const val = f[key];
                if (val && typeof val === "string") {
                    try {
                        const parsed = JSON.parse(val);
                        // SharePoint image fields têm serverUrl + serverRelativeUrl
                        if (parsed.serverUrl && parsed.serverRelativeUrl) {
                            processedFields[key] = {
                                _isImage: true,
                                url: parsed.serverUrl + parsed.serverRelativeUrl,
                                fileName: parsed.fileName || "",
                                raw: val
                            };
                        }
                    } catch {
                        // Não é JSON, continua normal
                    }
                }
                // Também verifica se é um objeto com serverUrl (caso já venha decodificado)
                if (val && typeof val === "object" && val.serverUrl && val.serverRelativeUrl) {
                    processedFields[key] = {
                        _isImage: true,
                        url: val.serverUrl + val.serverRelativeUrl,
                        fileName: val.fileName || "",
                        raw: JSON.stringify(val)
                    };
                }
            }

            return {
                id: item.id,
                Created: item.createdDateTime,
                ...processedFields
            };
        });

        return NextResponse.json({
            clientName,
            codigoEmpresa,
            items,
            imageColumns
        });

    } catch (error: any) {
        console.error("Graph API Error:", error);

        return NextResponse.json(
            {
                error: "Falha ao buscar dados do SharePoint.",
                details: error.message,
                clientName,
                parsedUrl: urlInfo
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const dataFilePath = path.join(process.cwd(), "src/data/inventarios.json");

    try {
        if (fs.existsSync(dataFilePath)) {
            const fileContent = fs.readFileSync(dataFilePath, "utf-8");
            let data: Inventario[] = JSON.parse(fileContent);

            const initialLength = data.length;
            data = data.filter((c) => c.id !== id);

            if (data.length < initialLength) {
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ error: "Client not found" }, { status: 404 });
            }
        }
        return NextResponse.json({ error: "DB not found" }, { status: 404 });
    } catch (error) {
        console.error("Local DB delete error", error);
        return NextResponse.json({ error: "Failed to delete from db" }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const dataFilePath = path.join(process.cwd(), "src/data/inventarios.json");

    try {
        if (fs.existsSync(dataFilePath)) {
            const fileContent = fs.readFileSync(dataFilePath, "utf-8");
            let data: Inventario[] = JSON.parse(fileContent);

            const index = data.findIndex((c) => c.id === id);

            if (index !== -1) {
                // Ensure the id isn't overwritten by the body, just in case
                data[index] = { ...data[index], ...body, id };
                fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                return NextResponse.json(data[index]);
            } else {
                return NextResponse.json({ error: "Client not found" }, { status: 404 });
            }
        }
        return NextResponse.json({ error: "DB not found" }, { status: 404 });
    } catch (error) {
        console.error("Local DB update error", error);
        return NextResponse.json({ error: "Failed to update db" }, { status: 500 });
    }
}
