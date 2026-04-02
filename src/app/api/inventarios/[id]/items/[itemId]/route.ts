import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGraphClient } from "@/lib/graph";
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
}

function parseSharePointUrl(url: string) {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname;

        const pathParts = parsed.pathname.split("/").filter(Boolean);
        const listsIndex = pathParts.findIndex(p => p.toLowerCase() === "lists");
        const listName = listsIndex >= 0 && pathParts[listsIndex + 1]
            ? decodeURIComponent(pathParts[listsIndex + 1])
            : null;

        let sitePath = "";
        if (listsIndex > 0) {
            sitePath = "/" + pathParts.slice(0, listsIndex).join("/");
        }

        return { hostname, sitePath, listName };
    } catch {
        return null;
    }
}

// Campos internos/somente leitura do SharePoint que nunca devem ser enviados no PATCH
const READ_ONLY_FIELDS = new Set([
    "@odata.etag",
    "id",
    "ID",
    "ContentType",
    "Modified",
    "Created",
    "AuthorLookupId",
    "EditorLookupId",
    "Author",
    "Editor",
    "_UIVersionString",
    "Attachments",
    "Edit",
    "LinkTitleNoMenu",
    "LinkTitle",
    "ItemChildCount",
    "FolderChildCount",
    "_ComplianceFlags",
    "_ComplianceTag",
    "_ComplianceTagWrittenTime",
    "_ComplianceTagUserId",
    "AppAuthorLookupId",
    "AppEditorLookupId",
]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, itemId } = await context.params;
    const rawUpdates = await request.json();

    // Filtra campos somente leitura e campos que começam com @ ou _
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawUpdates)) {
        if (READ_ONLY_FIELDS.has(key)) continue;
        if (key.startsWith("@odata")) continue;
        if (key === "id" || key === "ID") continue;
        // Apenas incluir se o valor não for vazio
        if (value !== undefined && value !== null) {
            updates[key] = value;
        }
    }

    console.log("=== PATCH - Campos que serão enviados ao SharePoint ===");
    console.log(JSON.stringify(updates, null, 2));

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "Nenhum campo editável para atualizar." }, { status: 400 });
    }

    // Fetch the client from the local DB
    const dataFilePath = path.join(process.cwd(), "src/data/inventarios.json");
    let clientUrl = "";
    try {
        if (fs.existsSync(dataFilePath)) {
            const fileContent = fs.readFileSync(dataFilePath, "utf-8");
            const data: Inventario[] = JSON.parse(fileContent);
            const client = data.find((c) => c.id === id);
            if (client) {
                clientUrl = client.url || "";
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
        return NextResponse.json({ error: "URL do SharePoint inválida." }, { status: 400 });
    }

    try {
        const graphClient = getGraphClient(session.accessToken);

        // 1. Resolver o Site ID
        const siteResponse = await graphClient
            .api(`/sites/${urlInfo.hostname}:${urlInfo.sitePath}`)
            .get();

        const siteId = siteResponse.id;

        console.log(`=== PATCH URL: /sites/${siteId}/lists/${urlInfo.listName}/items/${itemId}/fields ===`);

        // 2. Tentar atualizar campos um a um se o batch falhar
        let updateResponse;
        try {
            updateResponse = await graphClient
                .api(`/sites/${siteId}/lists/${urlInfo.listName}/items/${itemId}/fields`)
                .patch(updates);
        } catch (batchError: any) {
            console.error("Batch PATCH failed, trying field by field...", batchError.message);

            // Enviar campo por campo para identificar qual campo está falhando
            const successFields: string[] = [];
            const failedFields: Record<string, string> = {};

            for (const [key, value] of Object.entries(updates)) {
                try {
                    await graphClient
                        .api(`/sites/${siteId}/lists/${urlInfo.listName}/items/${itemId}/fields`)
                        .patch({ [key]: value });
                    successFields.push(key);
                } catch (fieldError: any) {
                    console.error(`Campo "${key}" falhou:`, fieldError.message);
                    failedFields[key] = fieldError.message;
                }
            }

            if (successFields.length > 0 && Object.keys(failedFields).length > 0) {
                return NextResponse.json({
                    partial: true,
                    message: `Alguns campos foram salvos com sucesso, outros falharam.`,
                    successFields,
                    failedFields
                });
            }

            if (Object.keys(failedFields).length > 0 && successFields.length === 0) {
                return NextResponse.json(
                    {
                        error: "Falha ao atualizar todos os campos no SharePoint.",
                        failedFields,
                    },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, successFields });
        }

        return NextResponse.json(updateResponse);

    } catch (error: any) {
        console.error("Graph API Patch Error:", error);
        console.error("Error body:", JSON.stringify(error.body || error, null, 2));
        console.error("Status code:", error.statusCode);
        return NextResponse.json(
            {
                error: "Falha ao atualizar dados no SharePoint.",
                details: error.message,
                statusCode: error.statusCode
            },
            { status: 500 }
        );
    }
}
