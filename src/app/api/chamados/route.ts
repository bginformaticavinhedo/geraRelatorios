import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGraphClient, SHAREPOINT_SITE_ID } from "@/lib/graph";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!SHAREPOINT_SITE_ID) {
        return NextResponse.json({ error: "SharePoint Site ID not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const cliente = searchParams.get("cliente");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    try {
        const client = getGraphClient(session.accessToken);

        // Fetch all items (up to 1000) and filter in JS to avoid 400 errors with calculated columns
        // or complex OData filters that SharePoint often rejects.
        // Fetch items sorted by creation date descending to get the newest ones first
        let allValues: unknown[] = [];
        
        let response = await client
            .api(`/sites/${SHAREPOINT_SITE_ID}/lists/Chamados/items`)
            .expand('fields')
            .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
            .query(`$top=2000&$orderby=createdDateTime asc`)
            .get();

        if (response.value) {
            allValues.push(...response.value);
        }

        while (response["@odata.nextLink"]) {
            response = await client
                .api(response["@odata.nextLink"])
                .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
                .get();
            
            if (response.value) {
                allValues.push(...response.value);
            }
            
            // To prevent memory or infinite loop issues just in case, break if too many
            if (allValues.length > 20000) break;
        }

        let items = (allValues as any[]).map((item: any) => {
            const f = item.fields;
            // Get creation date from fields or root object (Graph metadata)
            const created = f.Created || item.createdDateTime;

            // Format date to Brazilian format (UTC-3)
            let formattedDate = '';
            if (created) {
                const date = new Date(created);
                formattedDate = date.toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            // Map Tecnico to T_x00e9_cnicoResonsavel field
            const tecnicoField = f['T_x00e9_cnicoResonsavel'] || f['TecnicoResponsavel'] || f['Tecnico'];
            let tecnicoValue = '';

            if (Array.isArray(tecnicoField)) {
                // If it's an array, join the values
                tecnicoValue = tecnicoField.map((t: any) =>
                    typeof t === 'object' ? (t?.LookupValue || t?.Email || t?.DisplayName || '') : t
                ).filter(Boolean).join(', ');
            } else if (typeof tecnicoField === 'object' && tecnicoField !== null) {
                tecnicoValue = tecnicoField?.LookupValue || tecnicoField?.Email || tecnicoField?.DisplayName || '';
            } else {
                tecnicoValue = tecnicoField || '';
            }

            // Robust mapping for Lookups or Choice fields that might come as objects
            return {
                id: item.id,
                ...f,
                Created: created,
                CreatedFormatted: formattedDate,
                Cliente: typeof f.Cliente === 'object' ? f.Cliente?.LookupValue || f.Cliente?.Value || JSON.stringify(f.Cliente) : f.Cliente,
                Status: typeof f.Status === 'object' ? f.Status?.LookupValue || f.Status?.Value || JSON.stringify(f.Status) : f.Status,
                Tecnico: tecnicoValue,
                CanalDeAtendimento: f.CanaldeAtendimento || f.Canal_x0020_de_x0020_Atendimento || f.CanalDeAtendimento || f.Canal || '',
                AcoesAplicadas: f.A_x00e7__x00f5_esaplicadas || f.AcoesAplicadas || ''
            };
        });

        // Apply filters in JS
        if (cliente) {
            items = items.filter((item: any) =>
                item.Cliente?.toString().toLowerCase().includes(cliente.toLowerCase())
            );
        }

        if (status) {
            items = items.filter((item: any) => {
                const itemStatus = item.Status?.toString().toLowerCase().trim() || "";
                const filterStatus = status.toLowerCase().trim();
                return itemStatus.includes(filterStatus) || filterStatus.includes(itemStatus);
            });
        }

        if (startDate && endDate) {
            // Treat the start and end dates strictly in Brazil Time (UTC-3)
            const startOnly = startDate.split('T')[0];
            const endOnly = endDate.split('T')[0];
            
            const start = new Date(`${startOnly}T00:00:00-03:00`);
            const end = new Date(`${endOnly}T23:59:59.999-03:00`);

            items = items.filter((item: any) => {
                const createdDate = item.Created ? new Date(item.Created) : null;
                if (createdDate) {
                    return createdDate >= start && createdDate <= end;
                }
                return false;
            });
        }

        // Ensure robust sorting by date ascending (oldest to newest)
        items.sort((a: any, b: any) => {
            const dateA = a.Created ? new Date(a.Created).getTime() : 0;
            const dateB = b.Created ? new Date(b.Created).getTime() : 0;
            return dateA - dateB;
        });

        return NextResponse.json(items);

    } catch (error: unknown) {
        console.error("Graph API Error:", error);

        let availableFields = "Could not verify fields.";

        const graphError = error as { statusCode?: number; body?: string; message?: string };
        // Diagnostic: If it's a field name error, try to fetch one item to see available fields
        if (graphError.statusCode === 400 || (graphError.body && graphError.body.includes("field name is not recognized"))) {
            try {
                const client = getGraphClient(session.accessToken);
                const probe = await client
                    .api(`/sites/${SHAREPOINT_SITE_ID}/lists/Chamados/items`)
                    .expand('fields')
                    .top(1)
                    .get();
                if (probe.value && probe.value.length > 0) {
                    availableFields = Object.keys(probe.value[0].fields).join(", ");
                } else {
                    availableFields = "List is empty, cannot determine fields.";
                }
            } catch (probeError) {
                console.error("Diagnostic probe failed:", probeError);
            }
        }

        return NextResponse.json(
            {
                error: "Failed to fetch data. Likely invalid column name.",
                details: (error as Error).message,
                possibleFix: "Check your SharePoint list settings for internal names.",
                availableColumnsOnFirstItem: availableFields
            },
            { status: 500 }
        );
    }
}
