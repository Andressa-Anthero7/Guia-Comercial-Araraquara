import type { PortalSection } from "../api";

const sectionNames: Record<PortalSection, string> = {
  businesses: "empresas", reviews: "avaliações", coupons: "cupons",
  events: "eventos", usefulNumbers: "telefones úteis", categories: "categorias",
};

export function PortalStatus({ loading, unavailable, onRetry }: {
  loading: boolean;
  unavailable: PortalSection[];
  onRetry: () => void;
}) {
  if (loading) return <p role="status" className="mx-auto max-w-7xl px-4 py-6 text-sm font-semibold text-stone-600">Carregando informações do guia...</p>;
  if (!unavailable.length) return null;
  return (
    <div role="alert" className="mx-auto my-4 flex max-w-7xl flex-wrap items-center gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <div>
        <p className="font-bold">Não foi possível carregar parte do guia.</p>
        <p>Informações indisponíveis: {unavailable.map((section) => sectionNames[section]).join(", ")}.</p>
      </div>
      <button type="button" onClick={onRetry} className="rounded-lg bg-stone-900 px-4 py-2 font-bold text-white">Tentar novamente</button>
    </div>
  );
}
