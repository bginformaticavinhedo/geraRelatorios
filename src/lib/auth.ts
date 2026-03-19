import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
            // O issuer é crucial para evitar loops de erro no Callback
            issuer: process.env.AZURE_AD_TENANT_ID
                ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`
                : "https://login.microsoftonline.com/common/v2.0",
            authorization: {
                params: {
                    scope: "openid profile email offline_access Sites.Read.All",
                    prompt: "select_account",
                },
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 dias
    },
    callbacks: {
        async jwt({ token, account }) {
            // Se o login acabou de acontecer, o account estará disponível
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
                token.expiresAt = account.expires_at;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            // Opcional: passar os erros de expiração se necessário
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Garante que o redirecionamento sempre caia dentro do domínio do app
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/signin", // Redireciona erros de volta para o signin em vez da página de erro padrão
    },
    debug: process.env.NODE_ENV === "development",
};
