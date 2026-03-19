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
        const response = await client
            .api(`/sites/${SHAREPOINT_SITE_ID}/lists/Chamados/items`)
            .expand('fields')
            .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
            .query(`$top=2000&$orderby=createdDateTime desc`)
            .get();

        const items = response.value.map((item: any) => ({
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
        const apontamentosResponse = await client
            .api(`/sites/${SHAREPOINT_SITE_ID}/lists/Apontamentos/items`)
            .expand('fields')
            .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
            .query(`$top=2000&$orderby=createdDateTime desc`)
            .get();

        let totalHours = 0;
        apontamentosResponse.value.forEach((item: any) => {
            const f = item.fields;
            const created = item.createdDateTime || f.Created;
            const date = created ? new Date(created) : null;

            if (date && date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
                // Same robust calculation logic as in pointing API
                const rawStart = f['Hora_x00cd_nicio'] || f['Hora_x0020_inicio'] || f['Hora_inicio'] || f['Horainicio'] || f.Hora_x0020_Inicio;
                const rawEnd = f['Hora_x0020_Final'] || f['Hora_Final'] || f['HoraFinal'] || f.Hora_x0020_Final;

                let calculatedHours = 0;
                if (rawStart && rawEnd) {
                    const startD = new Date(rawStart);
                    const endD = new Date(rawEnd);
                    if (!isNaN(startD.getTime()) && !isNaN(endD.getTime())) {
                        const diffMs = endD.getTime() - startD.getTime();
                        calculatedHours = diffMs / (1000 * 60 * 60);
                    }
                }

                if (calculatedHours > 0) {
                    totalHours += calculatedHours;
                } else if (f.Horas !== undefined && f.Horas !== null) {
                    totalHours += parseFloat(String(f.Horas).replace(',', '.')) || 0;
                }
            }
        });

        return NextResponse.json({
            ...stats,
            totalHours: parseFloat(totalHours.toFixed(2))
        });

    } catch (error: any) {
        console.error("Stats API Error:", error);
        return NextResponse.json({
            error: "Falha ao carregar estatísticas.",
            message: "Houve um erro técnico ao processar os indicadores."
        }, { status: 500 });
    }
}
