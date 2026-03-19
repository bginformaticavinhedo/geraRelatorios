"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function SignInPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (error) {
            switch (error) {
                case "Signin":
                case "OAuthSignin":
                case "OAuthCallback":
                case "OAuthCreateAccount":
                case "EmailCreateAccount":
                case "Callback":
                    setErrorMessage("Houve um problema com a resposta do servidor de autenticação. Verifique o Redirect URI no portal Azure.");
                    break;
                case "OAuthAccountNotLinked":
                    setErrorMessage("Este e-mail já está associado a outra conta.");
                    break;
                case "EmailSignin":
                    setErrorMessage("O e-mail de verificação não pôde ser enviado.");
                    break;
                case "CredentialsSignin":
                    setErrorMessage("Credenciais inválidas.");
                    break;
                case "SessionRequired":
                    setErrorMessage("Por favor, faça login para acessar esta página.");
                    break;
                default:
                    setErrorMessage("Ocorreu um erro inesperado na autenticação.");
            }
        }
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0f172a]">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-sm shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                        <ShieldCheck className="w-12 h-12 text-accent" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                    SharePoint Reporter
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                    Acesse com sua conta corporativa Microsoft para visualizar os relatórios.
                </p>

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md flex items-start text-left gap-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">Erro de Login</p>
                            <p>{errorMessage}</p>
                            <p className="mt-2 text-xs opacity-70 font-mono">Código: {error}</p>
                        </div>
                    </div>
                )}

                <Button
                    onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
                    className="w-full h-12 text-base font-semibold bg-[#2f2f2f] hover:bg-black text-white"
                >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
                        <path fill="#f3f3f3" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                    </svg>
                    Tentar Entrar com Microsoft
                </Button>

                <p className="mt-8 text-xs text-slate-400">
                    &copy; 2026 Sistema Corporativo. Acesso Restrito.
                </p>
            </div>
        </div>
    );
}
