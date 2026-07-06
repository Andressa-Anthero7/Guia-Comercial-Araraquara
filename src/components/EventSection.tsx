import { useState } from "react";
import { Event } from "../types";
import { Calendar, MapPin, Sparkles, Star, Heart } from "lucide-react";

interface EventSectionProps {
  events: Event[];
}

export function EventSection({ events }: EventSectionProps) {
  // Local state to keep track of interested count per event ID
  const [interestedMap, setInterestedMap] = useState<Record<string, { count: number; active: boolean }>>({
    e1: { count: 124, active: false },
    e2: { count: 342, active: false },
    e3: { count: 88, active: false }
  });

  const handleInterestToggle = (eventId: string) => {
    setInterestedMap((prev) => {
      const current = prev[eventId] || { count: 20, active: false };
      if (current.active) {
        return {
          ...prev,
          [eventId]: { count: current.count - 1, active: false }
        };
      } else {
        return {
          ...prev,
          [eventId]: { count: current.count + 1, active: true }
        };
      }
    });
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

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => {
            const interest = interestedMap[event.id] || { count: 15, active: false };
            
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

                  <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                    {/* Interested Counter */}
                    <span className="text-xs text-stone-500 font-medium">
                      🔥 <span className="font-bold text-stone-800">{interest.count}</span> pessoas interessadas
                    </span>

                    {/* Interest Action Button */}
                    <button
                      onClick={() => handleInterestToggle(event.id)}
                      className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                        interest.active
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                      id={`event-interest-btn-${event.id}`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${interest.active ? "fill-rose-500 text-rose-500" : ""}`} />
                      <span>{interest.active ? "Tenho Interesse" : "Me Interessa"}</span>
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
