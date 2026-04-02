"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function SignInPage() {
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
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                    Acesse com sua conta corporativa Microsoft para visualizar os relatórios.
                </p>

                <Button
                    onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
                    className="w-full h-12 text-base font-semibold bg-[#2f2f2f] hover:bg-black text-white"
                >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
                        <path fill="#f3f3f3" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
                    </svg>
                    Entrar com Microsoft
                </Button>

                <p className="mt-8 text-xs text-slate-400">
                    &copy; 2026 Sistema Corporativo. Acesso Restrito.
                </p>
            </div>
        </div>
    );
}
