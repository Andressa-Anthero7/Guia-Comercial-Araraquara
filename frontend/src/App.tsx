import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { CategoryList } from "./components/CategoryList";
import { BusinessCard } from "./components/BusinessCard";
import { BusinessModal } from "./components/BusinessModal";
import { CouponSection } from "./components/CouponSection";
import { EventSection } from "./components/EventSection";
import { UsefulNumbersSection } from "./components/UsefulNumbersSection";
import { BusinessFormModal } from "./components/BusinessFormModal";
import { Footer } from "./components/Footer";
import { Backoffice } from "./components/Backoffice";
import { BackofficeLogin } from "./components/BackofficeLogin";

import { Business, Review, Coupon, Event, UsefulNumber } from "./types";
import { INITIAL_BUSINESSES, INITIAL_REVIEWS, COUPONS, EVENTS, USEFUL_NUMBERS } from "./data";
import {
  createPublicBusiness,
  createReview,
  deleteBackofficeBusiness,
  getSession,
  loadBackofficeBusinesses,
  loadPortalData,
  loginBackoffice,
  logoutBackoffice,
  saveBackofficeBusiness,
  BackofficeSession
} from "./api";
import { SlidersHorizontal, Sparkles, Building2, Store } from "lucide-react";

export default function App() {
  const isNativeApp = Capacitor.isNativePlatform();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [isBackofficeAuthenticated, setIsBackofficeAuthenticated] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [backofficeSession, setBackofficeSession] = useState<BackofficeSession>({
    is_authenticated: false, is_backoffice: false, username: "", name: "", email: ""
  });

  // --- Persistent States using LocalStorage Fallbacks ---
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem("guiacom_businesses");
    if (saved) {
      try {
        const savedBusinesses = JSON.parse(saved) as Business[];
        const simulationBusinesses = INITIAL_BUSINESSES.filter((business) =>
          business.id.startsWith("sim-")
        );
        const simulationIds = new Set(simulationBusinesses.map((business) => business.id));
        return [
          ...simulationBusinesses,
          ...savedBusinesses.filter((business) => !simulationIds.has(business.id))
        ];
      } catch (e) {
        console.error("Failed to parse businesses from localStorage", e);
      }
    }
    return INITIAL_BUSINESSES;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem("guiacom_reviews");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse reviews from localStorage", e);
      }
    }
    return INITIAL_REVIEWS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
  const [events, setEvents] = useState<Event[]>(EVENTS);
  const [usefulNumbers, setUsefulNumbers] = useState<UsefulNumber[]>(USEFUL_NUMBERS);

  // --- Filtering & UI States ---
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [activeSection, setActiveSection] = useState("comercios");

  // --- Modal States ---
  const [selectedBusinessForModal, setSelectedBusinessForModal] = useState<Business | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    const handleRouteChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  useEffect(() => {
    if (!currentPath.startsWith("/backoffice")) return;
    getSession()
      .then((session) => {
        setBackofficeSession(session);
        setIsBackofficeAuthenticated(session.is_backoffice === true);
      })
      .catch(() => setIsBackofficeAuthenticated(false))
      .finally(() => setIsSessionChecked(true));
  }, [currentPath]);

  useEffect(() => {
    loadPortalData()
      .then((data) => {
        if (data.businesses.length) setBusinesses(data.businesses);
        if (data.reviews.length) setReviews(data.reviews);
        if (data.coupons.length) setCoupons(data.coupons);
        if (data.events.length) setEvents(data.events);
        if (data.usefulNumbers.length) setUsefulNumbers(data.usefulNumbers);
      })
      .catch((error) => console.error("Nao foi possivel carregar a API.", error));
  }, []);

  useEffect(() => {
    if (!isBackofficeAuthenticated || !currentPath.startsWith("/backoffice")) return;
    loadBackofficeBusinesses()
      .then(setBusinesses)
      .catch((error) => console.error("Nao foi possivel carregar o backoffice.", error));
  }, [isBackofficeAuthenticated, currentPath]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Search & Filter Logic ---
  const visibleBusinesses = businesses.filter((biz) => (biz.status ?? "active") === "active");

  const filteredBusinesses = visibleBusinesses.filter((biz) => {
    // 1. Category Filter
    if (selectedCategory && biz.category !== selectedCategory) {
      return false;
    }

    // 2. Neighborhood Filter
    if (selectedNeighborhood && biz.neighborhood !== selectedNeighborhood) {
      return false;
    }

    // 3. Search Query Filter (name, description, tags, category, neighborhood)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = biz.name.toLowerCase().includes(q);
      const matchDesc = biz.description.toLowerCase().includes(q);
      const matchNeighborhood = biz.neighborhood.toLowerCase().includes(q);
      const matchTags = biz.tags.some((tag) => tag.toLowerCase().includes(q));
      
      if (!matchName && !matchDesc && !matchNeighborhood && !matchTags) {
        return false;
      }
    }

    return true;
  });

  // Split featured vs standard listed shops for aesthetic visual hierarchy
  const featuredBusinesses = filteredBusinesses.filter((b) => b.isFeatured);
  const regularBusinesses = filteredBusinesses.filter((b) => !b.isFeatured);

  // --- Interactive Callback Handlers ---
  const handleRegisterBusiness = async (newBizData: Omit<Business, "id" | "rating" | "reviewsCount" | "isFeatured">) => {
    const newBiz: Business = {
      ...newBizData,
      id: `biz-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 0,
      isFeatured: false, // Standard default listing
      status: "pending"
    };

    await createPublicBusiness(newBiz);
    setIsRegisterModalOpen(false);
  };

  const handleSubmitReview = async (newReviewData: Omit<Review, "id" | "date">) => {
    await createReview(newReviewData);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedNeighborhood("");
  };

  const handleSaveBackofficeBusiness = async (business: Business) => {
    const savedBusiness = await saveBackofficeBusiness(business);
    setBusinesses((previous) => {
      const exists = previous.some((item) => item.id === savedBusiness.id);
      return exists
        ? previous.map((item) => (item.id === savedBusiness.id ? savedBusiness : item))
        : [savedBusiness, ...previous];
    });
  };

  const handleDeleteBackofficeBusiness = async (business: Business) => {
    await deleteBackofficeBusiness(business);
    setBusinesses((previous) => previous.filter((item) => item.id !== business.id));
  };

  if (currentPath.startsWith("/backoffice")) {
    if (!isSessionChecked) return <div className="min-h-screen bg-stone-100" />;
    if (!isBackofficeAuthenticated) {
      return (
        <BackofficeLogin
          onLogin={async (username, password) => {
            const session = await loginBackoffice(username, password);
            setBackofficeSession(session);
            setIsBackofficeAuthenticated(true);
          }}
          onExit={() => {
            window.location.href = "https://webapp415008.ip-45-79-2-160.cloudezapp.io/";
          }}
        />
      );
    }
    return (
      <Backoffice
        businesses={businesses}
        onSaveBusiness={handleSaveBackofficeBusiness}
        onDeleteBusiness={handleDeleteBackofficeBusiness}
        onBusinessCreated={(business) => {
          setBusinesses(previous => [business, ...previous.filter(item => item.id !== business.id)]);
        }}
        session={backofficeSession}
        onExit={async () => {
          window.location.href = "https://webapp415008.ip-45-79-2-160.cloudezapp.io/";
        }}
        onLogout={async () => {
          await logoutBackoffice();
          setIsBackofficeAuthenticated(false);
          setBackofficeSession({
            is_authenticated: false, is_backoffice: false, username: "", name: "", email: ""
          });
          window.location.href = "https://webapp415008.ip-45-79-2-160.cloudezapp.io/";
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/20 text-stone-900 flex flex-col font-sans selection:bg-amber-150 selection:text-amber-900">
      
      {/* 1. Navigation Header */}
      <Header
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenBackoffice={() => {
          window.location.href =
            "https://webapp415078.ip-45-79-2-160.cloudezapp.io/backoffice/";
        }}
        isBackofficeAuthenticated={!isNativeApp}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* 2. Banner/Hero Section */}
      <Hero
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedNeighborhood={selectedNeighborhood}
        setSelectedNeighborhood={setSelectedNeighborhood}
      />

      {/* 3. Category Grid */}
      <CategoryList
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* 4. Main Directory Listings Container */}
      <main id="comercios" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-1">
        
        {/* Section Heading with Filters bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-stone-900 tracking-tight">
              Anunciantes
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Exibindo <span className="font-bold text-stone-800">{filteredBusinesses.length}</span> cadastro(s) encontrados
            </p>
          </div>

          {/* Active Filtering Pills */}
          {(selectedCategory || selectedNeighborhood || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1.5 self-start sm:self-auto rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer shadow-xs"
              id="reset-all-filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-stone-400" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* --- Featured Row / Gold Level Listings --- */}
        {featuredBusinesses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse fill-amber-500/20" />
              <h3 className="font-display text-xs font-extrabold uppercase tracking-wider text-amber-700">
                Anunciantes em destaque
              </h3>
              <h3 className="hidden">
                Parceiros em Destaque ⭐
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredBusinesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  onOpenDetails={setSelectedBusinessForModal}
                />
              ))}
            </div>
          </div>
        )}

        {/* --- Standard Listings Grid --- */}
        {regularBusinesses.length > 0 ? (
          <div>
            {featuredBusinesses.length > 0 && (
              <>
              <h3 className="font-display text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-4 border-t border-stone-100 pt-6">
                Outros anunciantes
              </h3>
              <h3 className="hidden">
                Outros Cadastros Locais
              </h3>
              </>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {regularBusinesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  onOpenDetails={setSelectedBusinessForModal}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* --- Empty State Notice --- */}
        {filteredBusinesses.length === 0 && (
          <div className="text-center py-20 px-6 rounded-3xl border-2 border-dashed border-stone-200 bg-white max-w-xl mx-auto my-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mx-auto mb-6">
              <Store className="h-7 w-7" />
            </div>
            
            <h3 className="font-display text-xl font-bold text-stone-900 tracking-tight">
              Nenhum comércio encontrado
            </h3>
            <p className="mt-2.5 text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
              Não encontramos resultados para a busca selecionada em Araraquara. 
              Tente redefinir os termos ou buscar em bairros vizinhos.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleResetFilters}
                className="w-full sm:w-auto rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-all cursor-pointer"
                id="empty-state-reset"
              >
                Resetar Filtros
              </button>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full sm:w-auto rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
                id="empty-state-register"
              >
                Cadastrar Empresa
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 5. Coupons Section */}
      <CouponSection
        coupons={coupons}
        businesses={businesses}
        onOpenBusinessDetails={setSelectedBusinessForModal}
      />

      {/* 6. Upcoming Events Section */}
      <EventSection events={events} />

      {/* 7. Useful Phone Numbers List */}
      <UsefulNumbersSection numbers={usefulNumbers} />

      {/* 8. Elegant Footer */}
      <Footer />

      {/* --- BUSINESS DETAILED VIEW MODAL --- */}
      {selectedBusinessForModal && (
        <BusinessModal
          business={selectedBusinessForModal}
          reviews={reviews}
          coupons={coupons}
          onClose={() => setSelectedBusinessForModal(null)}
          onSubmitReview={handleSubmitReview}
        />
      )}

      {/* --- ADD NEW BUSINESS FORM MODAL --- */}
      {isRegisterModalOpen && (
        <BusinessFormModal
          onClose={() => setIsRegisterModalOpen(false)}
          onSubmit={handleRegisterBusiness}
        />
      )}

    </div>
  );
}
