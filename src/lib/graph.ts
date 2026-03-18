import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

export function getGraphClient(accessToken: string) {
    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
    });
}

// Helper to get site ID if not configured, or use env
export const SHAREPOINT_SITE_ID = process.env.SHAREPOINT_SITE_ID;
