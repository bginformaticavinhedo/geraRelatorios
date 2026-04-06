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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    try {
        const client = getGraphClient(session.accessToken);

        let allValues: any[] = [];
        let response = await client
            .api(`/sites/${SHAREPOINT_SITE_ID}/lists/Apontamentos/items`)
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
            
            if (allValues.length > 20000) break;
        }

        let rawItems = allValues;

        // Apply filters in JS
        if (startDate && endDate) {
            // Treat the start and end dates strictly in Brazil Time (UTC-3)
            const startOnly = startDate.split('T')[0];
            const endOnly = endDate.split('T')[0];
            
            const start = new Date(`${startOnly}T00:00:00-03:00`);
            const end = new Date(`${endOnly}T23:59:59.999-03:00`);

            rawItems = rawItems.filter((item: any) => {
                const f = item.fields;
                // SharePoint 'Created' field mapping or fallback to Graph metadata
                const createdVal = f.Created || item.createdDateTime;
                const createdDate = createdVal ? new Date(createdVal) : null;
                if (createdDate) {
                    return createdDate >= start && createdDate <= end;
                }
                return false;
            });
        }

        const items = rawItems.map((item: any) => {
            const fields = item.fields;

            // Robust mapping for Lookups/Choice fields
            const pessoaVal = typeof fields.Pessoa === 'object'
                ? fields.Pessoa?.DisplayName || fields.Pessoa?.Email || fields.Pessoa?.LookupValue
                : fields.Pessoa;

            // Mapeamento exato conforme solicitado pelo usuário
            const rawStart = fields['Hora_x00cd_nicio'] || fields['Hora_x0020_inicio'] || fields['Hora_inicio'] || fields['Horainicio'] || fields.Hora_x0020_Inicio;
            const rawEnd = fields['Hora_x0020_Final'] || fields['Hora_Final'] || fields['HoraFinal'] || fields.Hora_x0020_Final;

            let calculatedHours = 0;

            if (rawStart && rawEnd) {
                const startDate = new Date(rawStart);
                const endDate = new Date(rawEnd);

                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    const diffMs = endDate.getTime() - startDate.getTime();
                    calculatedHours = diffMs / (1000 * 60 * 60); // Converte para horas decimais
                }
            }

            // Mantemos a precisão total para o cálculo interno e soma
            const finalHours = calculatedHours > 0 ? calculatedHours : (parseFloat(fields.Horas) || 0);

            // Formatação amigável de horas (ex: 0.8333h -> 50min)
            const totalMinutes = Math.round(finalHours * 60);
            const wholeHours = Math.floor(totalMinutes / 60);
            const remainingMinutes = totalMinutes % 60;

            const formattedDuration = wholeHours > 0
                ? `${wholeHours}h ${remainingMinutes}min`
                : `${remainingMinutes}min`;

            return {
                id: item.id,
                ...fields,
                Title: fields.Title,
                Tecnico: pessoaVal,
                // Mapeamos para uma chave consistente para o frontend
                Horas: finalHours,
                DuracaoFormatada: formattedDuration,
                HoraInicioFormatada: rawStart ? new Date(rawStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '-',
                HoraFinalFormatada: rawEnd ? new Date(rawEnd).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '-',
                Descricao: fields['Descri_x00e7__x00e3_o'] || fields['Descricao'] || fields['Descrição'],
                Created: fields.Created || item.createdDateTime
            };
        });

        // Ensure robust sorting by date ascending (oldest to newest)
        items.sort((a: any, b: any) => {
            const dateA = a.Created ? new Date(a.Created).getTime() : 0;
            const dateB = b.Created ? new Date(b.Created).getTime() : 0;
            return dateA - dateB;
        });

        return NextResponse.json(items);

    } catch (error: any) {
        console.error("Graph API Error:", error);

        let availableFields = "Could not verify fields.";

        if (error.statusCode === 400 || (error.body && error.body.includes("field name is not recognized"))) {
            try {
                const client = getGraphClient(session.accessToken);
                const probe = await client
                    .api(`/sites/${SHAREPOINT_SITE_ID}/lists/Apontamentos/items`)
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
                details: error.message,
                possibleFix: "Check your SharePoint list settings for internal names.",
                availableColumnsOnFirstItem: availableFields
            },
            { status: 500 }
        );
    }
}
