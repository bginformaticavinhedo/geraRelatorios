import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Extrai hostname, sitePath e listName de uma URL SharePoint
// Ex: https://tenant.sharepoint.com/sites/SiteName/Lists/ListName/AllItems.aspx
export function parseSharePointUrl(url: string) {
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
