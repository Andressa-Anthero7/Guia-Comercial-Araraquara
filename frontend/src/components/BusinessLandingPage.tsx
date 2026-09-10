import { ArrowLeft, Store } from "lucide-react";
import { BusinessProfile, type BusinessProfileProps } from "./BusinessProfile";

const GUIDE_URL = "https://www.guiacomararaquara.com.br";

export function BusinessLandingPage(props: BusinessProfileProps) {
  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href={GUIDE_URL} className="flex min-w-0 items-center gap-2.5 text-sm font-bold text-stone-800">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-stone-950"><Store className="h-5 w-5" /></span>
            <span>Guia Comercial <span className="block text-xs font-medium text-stone-500 sm:inline sm:text-sm">Araraquara</span></span>
          </a>
          <a href={GUIDE_URL} className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-amber-700 sm:text-sm"><ArrowLeft className="h-4 w-4" />Voltar ao guia</a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
        <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm" aria-label={`Página de ${props.business.name}`}>
          <BusinessProfile key={props.business.id} {...props} presentation="page" />
        </article>
      </main>
      <footer className="px-4 pb-8 text-center text-xs text-stone-500">Encontre mais empresas e serviços no <a href={GUIDE_URL} className="font-semibold text-stone-700 hover:text-amber-700">Guia Comercial Araraquara</a>.</footer>
    </div>
  );
}
