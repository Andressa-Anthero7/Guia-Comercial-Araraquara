import { Sun, Heart, Instagram, MessageSquare, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top footer area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-stone-800">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-stone-950">
                <Sun className="h-5.5 w-5.5 fill-current" />
              </div>
              <span className="font-display text-lg font-extrabold text-white">
                Guia ComAraraquara
              </span>
            </div>
            <p className="text-xs leading-relaxed text-stone-500">
              O maior e mais completo portal de comércios, cupons, vagas de emprego e eventos locais de Araraquara SP - A Morada do Sol.
            </p>
            
            {/* Live Weather Indicator of Araraquara */}
            <div className="inline-flex items-center space-x-2 rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-amber-400 font-semibold border border-stone-700">
              <span>☀️ Araraquara: 28°C • Ensolarado</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-4">
              Navegação
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#comercios" className="hover:text-amber-400 transition-colors">
                  Listagem de Comércios
                </a>
              </li>
              <li>
                <a href="#cupons" className="hover:text-amber-400 transition-colors">
                  Cupons de Desconto
                </a>
              </li>
              <li>
                <a href="#eventos" className="hover:text-amber-400 transition-colors">
                  Calendário de Eventos
                </a>
              </li>
              <li>
                <a href="#telefones" className="hover:text-amber-400 transition-colors">
                  Contatos de Emergência
                </a>
              </li>
            </ul>
          </div>

          {/* Localized reference */}
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-4">
              A Morada do Sol
            </h4>
            <ul className="space-y-2 text-xs text-stone-500 leading-relaxed">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-1.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Araraquara, São Paulo, Brasil</span>
              </li>
              <li>Fundação: 22 de Agosto de 1817</li>
              <li>Conhecida mundialmente pela beleza de suas árvores e clima caloroso acolhedor.</li>
            </ul>
          </div>

          {/* Advertising CTA */}
          <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700/50 space-y-3">
            <h4 className="font-display text-xs font-bold text-amber-400 uppercase tracking-wider">
              Anuncie Conosco
            </h4>
            <p className="text-[11px] leading-relaxed text-stone-400">
              Quer ter sua marca em destaque no nosso guia e disponibilizar cupons especiais para seus clientes?
            </p>
            <a
              href="https://wa.me/5516997421234?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20planos%20de%20destaque%20no%20Guia%20Comercial%20Araraquara."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-600 transition-colors w-full justify-center"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Contato Comercial</span>
            </a>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-800 text-[11px] text-stone-600">
          <p>
            &copy; {currentYear} Guia Comercial Araraquara. Todos os direitos reservados.
          </p>
          <p className="flex items-center">
            Feito com <Heart className="h-3 w-3 mx-1 text-red-500 fill-red-500" /> para Araraquara SP
          </p>
        </div>

      </div>
    </footer>
  );
}
