import { useState } from "react";
import { UsefulNumber } from "../types";
import { Phone, Copy, Check, Search, LifeBuoy, ShieldAlert, HeartHandshake } from "lucide-react";

interface UsefulNumbersSectionProps {
  numbers: UsefulNumber[];
}

export function UsefulNumbersSection({ numbers }: UsefulNumbersSectionProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const filteredNumbers = numbers.filter(
    (num) =>
      num.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      num.phone.includes(filterQuery) ||
      num.description.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <section id="telefones" className="py-16 bg-gradient-to-b from-stone-50 to-white border-t border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end mb-12">
          
          <div className="lg:col-span-2">
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-100">
              <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
              <span>Sempre à mão 📞</span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-stone-900 tracking-tight sm:text-4xl">
              Telefones e Contatos Úteis
            </h2>
            <p className="mt-3 text-sm text-stone-500 max-w-xl">
              Lista telefônica rápida com contatos de emergência, utilidade pública e serviços essenciais de Araraquara. 
              Clique para ligar direto ou copie o número com um toque.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute top-3 left-4 h-5 w-5 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar telefone... (Ex: Upa, DAAE)"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 py-2.5 pl-12 pr-4 text-sm text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white shadow-xs"
              id="phone-search-input"
            />
          </div>

        </div>

        {/* Numbers Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNumbers.map((num, i) => {
            const isEmergency = num.category === "emergencia";
            const isCopied = copiedPhone === num.phone;

            return (
              <div
                key={i}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
                  isEmergency
                    ? "bg-red-50/40 border-red-100 hover:border-red-300"
                    : "bg-white border-stone-200 hover:border-stone-300 shadow-xs"
                }`}
                id={`phone-card-${i}`}
              >
                <div className="space-y-1.5 flex-1 pr-4">
                  {/* Category Indicator */}
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    isEmergency
                      ? "bg-red-500 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}>
                    {isEmergency ? "Emergência" : "Serviços"}
                  </span>

                  {/* Name */}
                  <h3 className="font-display text-sm font-bold text-stone-950 leading-tight">
                    {num.name}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] text-stone-500 leading-snug line-clamp-2">
                    {num.description}
                  </p>
                </div>

                {/* Interactive Phone Actions */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  
                  {/* Click to Call Dial */}
                  <a
                    href={`tel:${num.phone.replace(/[^0-9]/g, "")}`}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-xs transition-colors cursor-pointer ${
                      isEmergency
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                    title={`Ligar para ${num.phone}`}
                    id={`dial-phone-btn-${i}`}
                  >
                    {isEmergency ? (
                      <span className="text-xs font-black">{num.phone}</span>
                    ) : (
                      <Phone className="h-4.5 w-4.5" />
                    )}
                  </a>

                  {/* Click to Copy */}
                  <button
                    onClick={() => handleCopyPhone(num.phone)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                    title="Copiar número"
                    id={`copy-phone-btn-${i}`}
                  >
                    {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>

                </div>
              </div>
            );
          })}

          {filteredNumbers.length === 0 && (
            <div className="col-span-full text-center py-12 rounded-2xl bg-stone-50 border border-stone-200">
              <HeartHandshake className="h-10 w-10 text-stone-400 mx-auto" />
              <p className="mt-3 text-sm text-stone-500 font-semibold">Nenhum telefone encontrado para "{filterQuery}"</p>
              <p className="text-xs text-stone-400 mt-1">Experimente buscar por "upa", "prefeitura" ou "polícia".</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
