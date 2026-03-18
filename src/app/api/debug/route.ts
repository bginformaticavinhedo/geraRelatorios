import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGraphClient, SHAREPOINT_SITE_ID } from "@/lib/graph";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listName = searchParams.get("list");
    const action = searchParams.get("action");

    if (!SHAREPOINT_SITE_ID) {
        return NextResponse.json({ error: "Missing config" }, { status: 400 });
    }

    try {
        const client = getGraphClient(session.accessToken);

        if (action === "listLists") {
            const listsRes = await client
                .api(`/sites/${SHAREPOINT_SITE_ID}/lists`)
                .select('id,displayName,name,webUrl')
                .get();
            return NextResponse.json(listsRes.value);
        }

        if (!listName) {
            return NextResponse.json({ error: "List name required for inspection" }, { status: 400 });
        }

        // Fetch just 1 item without expanding fields to see raw props, 
        // AND fetch columns definition

        // 1. Fetch Columns Definition
        const columnsRes = await client
            .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/columns`)
            .get();

        // 2. Fetch 1 item expanded
        const itemsRes = await client
            .api(`/sites/${SHAREPOINT_SITE_ID}/lists/${listName}/items`)
            .expand('fields')
            .top(1)
            .get();

        // Simplify output for user
        const columnMap = columnsRes.value.map((c: any) => ({
            displayName: c.displayName,
            name: c.name, // Internal Name
            type: c.columnGroup || c.text ? 'text' : 'other'
        }));

        const firstItemFields = itemsRes.value[0]?.fields || {};

        return NextResponse.json({
            columnsDefinition: columnMap,
            sampleItemFields: firstItemFields
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
