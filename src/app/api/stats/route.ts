import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGraphClient, SHAREPOINT_SITE_ID } from "@/lib/graph";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const client = getGraphClient(session.accessToken);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Fetch items sorted by creation date descending to get the newest ones first
        let chamadosValues: any[] = [];
        let response = await client
            .api(`/sites/${SHAREPOINT_SITE_ID}/lists/Chamados/items`)
            .expand('fields')
            .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
            .query(`$top=2000&$orderby=createdDateTime desc`)
            .get();

        if (response.value) {
            chamadosValues.push(...response.value);
        }

        while (response["@odata.nextLink"]) {
            response = await client
                .api(response["@odata.nextLink"])
                .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
                .get();
            
            if (response.value) {
                chamadosValues.push(...response.value);
            }
            if (chamadosValues.length > 20000) break;
        }

        const items = chamadosValues.map((item: any) => ({
            status: (item.fields.Status?.toString() || "").toLowerCase(),
            created: item.createdDateTime || item.fields.Created
        }));

        const periodItems = items.filter((item: any) => {
            const date = item.created ? new Date(item.created) : null;
            return date && date.getFullYear() === currentYear && date.getMonth() === currentMonth;
        });

        const stats = {
            abertos: periodItems.filter((i: any) => i.status.includes("aberto")).length,
            emAndamento: periodItems.filter((i: any) => i.status.includes("andamento")).length,
            finalizados: periodItems.filter((i: any) => i.status.includes("finalizado") || i.status.includes("fechado")).length,
            total: periodItems.length
        };

        // Fetch Apontamentos for hours calculation
        let apontamentosValues: any[] = [];
        let apontamentosResponse = await client
            .api(`/sites/${SHAREPOINT_SITE_ID}/lists/Apontamentos/items`)
            .expand('fields')
            .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
            .query(`$top=2000&$orderby=createdDateTime desc`)
            .get();

        if (apontamentosResponse.value) {
            apontamentosValues.push(...apontamentosResponse.value);
        }

        while (apontamentosResponse["@odata.nextLink"]) {
            apontamentosResponse = await client
                .api(apontamentosResponse["@odata.nextLink"])
                .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
                .get();
            
            if (apontamentosResponse.value) {
                apontamentosValues.push(...apontamentosResponse.value);
            }
            if (apontamentosValues.length > 20000) break;
        }

        let totalHours = 0;
        apontamentosValues.forEach((item: any) => {
            const f = item.fields;
            const created = item.createdDateTime || f.Created;
            const date = created ? new Date(created) : null;

            if (date && date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
                // Same robust calculation logic as in pointing API
                const rawStart = f['Hora_x00cd_nicio'] || f['Hora_x0020_inicio'] || f['Hora_inicio'] || f.Hora_x0020_Inicio;
                const rawEnd = f['Hora_x0020_Final'] || f['Hora_Final'] || f['HoraFinal'] || f.Hora_x0020_Final;

                if (rawStart && rawEnd) {
                    const startD = new Date(rawStart);
                    const endD = new Date(rawEnd);
                    if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
                        const diffMs = endD.getTime() - startD.getTime();
                        totalHours += diffMs / (1000 * 60 * 60);
                    }
                } else if (f.Horas) {
                    totalHours += parseFloat(f.Horas) || 0;
                }
            }
        });

        return NextResponse.json({
            ...stats,
            totalHours: parseFloat(totalHours.toFixed(2))
        });

    } catch (error: any) {
        console.error("Stats API Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
