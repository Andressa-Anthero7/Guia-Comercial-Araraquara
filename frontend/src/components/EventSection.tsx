import { useState } from "react";
import { Event } from "../types";
import { Calendar, MapPin, Bookmark } from "lucide-react";

interface EventSectionProps {
  events: Event[];
}

export function EventSection({ events }: EventSectionProps) {
  const [savedEvents, setSavedEvents] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("gca_saved_events") || "[]");
      return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [];
    } catch { return []; }
  });
  const [saveError, setSaveError] = useState("");
  const toggleSaved = (eventId: string) => {
    const next = savedEvents.includes(eventId) ? savedEvents.filter(id => id !== eventId) : [...savedEvents, eventId];
    try {
      localStorage.setItem("gca_saved_events", JSON.stringify(next));
      setSavedEvents(next);
      setSaveError("");
    } catch { setSaveError("Não foi possível salvar neste navegador. Verifique se o armazenamento está permitido e tente novamente."); }
  };

  return (
    <section id="eventos" className="py-16 bg-stone-50/30 border-t border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
              <Calendar className="h-3.5 w-3.5 text-amber-500" />
              <span>O que fazer na cidade 🎉</span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Próximos Eventos & Feiras
            </h2>
            <p className="mt-3 text-sm text-stone-500">
              Fique por dentro da programação cultural de Araraquara. 
              Feiras de artesanato, festivais, shows no Sesc e muito mais!
            </p>
          </div>
        </div>

        {saveError && <p role="alert" className="mb-4 text-sm text-rose-700">{saveError}</p>}
        {!events.length && <p className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">Nenhum evento publicado no momento. Volte em breve para conferir a programação.</p>}
        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => {
            const saved = savedEvents.includes(event.id);
            
            return (
              <div 
                key={event.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-300 hover:shadow-lg"
                id={`event-card-${event.id}`}
              >
                {/* Event Cover Photo */}
                <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Floating Date Badge */}
                  <div className="absolute top-4 left-4 rounded-xl bg-white/95 backdrop-blur-xs p-2 text-center shadow-md border border-stone-100">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">
                      Evento
                    </span>
                    <span className="block text-xs font-extrabold text-stone-900">
                      Cultural
                    </span>
                  </div>
                </div>

                {/* Event Content */}
                <div className="flex flex-1 flex-col p-6">
                  
                  {/* Event Details metadata */}
                  <div className="space-y-2 text-xs font-semibold text-stone-500">
                    <div className="flex items-center space-x-1.5 text-amber-600">
                      <Calendar className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-4 w-4 text-stone-400" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Event Title */}
                  <h3 className="mt-4 font-display text-lg font-bold text-stone-900 leading-snug line-clamp-1">
                    {event.title}
                  </h3>

                  {/* Event Description */}
                  <p className="mt-2 text-xs text-stone-500 leading-relaxed line-clamp-3 flex-1">
                    {event.description}
                  </p>

                  <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap gap-3 items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">
                      {saved ? "Salvo neste navegador" : "Guarde para consultar depois"}
                    </span>

                    {/* Interest Action Button */}
                    <button
                      onClick={() => toggleSaved(event.id)}
                      aria-pressed={saved}
                      className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        saved
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                      id={`event-interest-btn-${event.id}`}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
                      <span>{saved ? "Evento salvo" : "Salvar evento"}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
