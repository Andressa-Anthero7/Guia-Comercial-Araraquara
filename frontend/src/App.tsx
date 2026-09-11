import { advertiserAuthTarget, advertiserRouteEvent } from "./advertiserRoutes";
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
import { BusinessLandingPage } from "./components/BusinessLandingPage";
import { Footer } from "./components/Footer";
import { PortalStatus } from "./components/PortalStatus";
import { refreshCategories } from "./categories";
import { Backoffice } from "./management/Management";
import { BackofficeLogin } from "./components/BackofficeLogin";
import { AdvertiserLogin } from "./components/AdvertiserLogin";
import { AdvertiserPortal } from "./components/AdvertiserPortal";

import { Business, Review, Coupon, Event, UsefulNumber } from "./types";
import {
  authenticationRedirectUrl,
  createPublicBusiness,
  createReview,
  deleteBackofficeBusiness,
  getSession,
  loadBackofficeBusinesses,
  loadPortalData,
  loginBackoffice,
  loginAdvertiser,
  logoutBackoffice,
  saveBackofficeBusiness,
  changeBackofficeBusinessStatus,
  BackofficeSession,
  PortalSection
} from "./api";
import { SlidersHorizontal, Sparkles, Building2, Store } from "lucide-react";

const GUIDE_DOMAIN = "guiacomararaquara.com.br";

function tenantSubdomain(hostname: string) {
  const normalizedHost = hostname.toLowerCase().replace(/\.$/, "");
  if (normalizedHost.endsWith(".localhost")) {
    return normalizedHost.slice(0, -".localhost".length);
  }
  const suffix = `.${GUIDE_DOMAIN}`;
  if (!normalizedHost.endsWith(suffix)) return "";
  const subdomain = normalizedHost.slice(0, -suffix.length);
  return subdomain && !["www", "api", "admin", "backoffice", "mail"].includes(subdomain)
    ? subdomain
    : "";
}

export default function App() {
  const isNativeApp = Capacitor.isNativePlatform();
  // The query parameter is a shareable fallback while a customer's custom domain is pending.
  const subdomainPreview = new URLSearchParams(window.location.search).get("subdomain")?.toLowerCase() ?? "";
  const currentTenantSubdomain = tenantSubdomain(window.location.hostname) || subdomainPreview;
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const isAdvertiserArea = /^\/(anunciante|area-do-anunciante)(?:\/|$)/.test(currentPath);
  const sessionArea = isAdvertiserArea ? "advertiser" : currentPath.startsWith("/backoffice") ? "backoffice" : "";
  const authenticationUrl = authenticationRedirectUrl(currentPath);
  const [advertiserLoginNotice, setAdvertiserLoginNotice] = useState("");
  const [isBackofficeAuthenticated, setIsBackofficeAuthenticated] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [backofficeSession, setBackofficeSession] = useState<BackofficeSession>({
    is_authenticated: false, is_backoffice: false, username: "", name: "", email: ""
  });

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [usefulNumbers, setUsefulNumbers] = useState<UsefulNumber[]>([]);
  const [isPortalLoaded, setIsPortalLoaded] = useState(false);
  const [portalUnavailable, setPortalUnavailable] = useState<PortalSection[]>([]);
  const [portalAttempt, setPortalAttempt] = useState(0);
  const retryPortal = () => setPortalAttempt((attempt) => attempt + 1);

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
    window.addEventListener(advertiserRouteEvent, handleRouteChange);
    return () => { window.removeEventListener("popstate", handleRouteChange); window.removeEventListener(advertiserRouteEvent, handleRouteChange); };
  }, []);

  useEffect(() => {
    if (authenticationUrl) {
      window.location.replace(authenticationUrl);
      return;
    }
    if (!sessionArea) return;
    let active = true;
    setIsSessionChecked(false);
    getSession()
      .then((session) => {
        if (!active) return;
        setBackofficeSession(session);
        setIsBackofficeAuthenticated(session.is_backoffice === true);
      })
      .catch(() => { if (active) setIsBackofficeAuthenticated(false); })
      .finally(() => { if (active) setIsSessionChecked(true); });
    return () => { active = false; };
  }, [sessionArea, authenticationUrl]);

  useEffect(() => {
    if (authenticationUrl || !isAdvertiserArea || !isSessionChecked) return;
    const target = advertiserAuthTarget(Boolean(backofficeSession.is_advertiser), currentPath, window.location.search, window.location.hash);
    if (window.location.pathname + window.location.search + window.location.hash === target) return;
    window.history.replaceState({ ...window.history.state }, "", target);
    setCurrentPath(window.location.pathname);
    window.dispatchEvent(new window.Event(advertiserRouteEvent));
  }, [authenticationUrl, isAdvertiserArea, isSessionChecked, backofficeSession.is_advertiser, currentPath]);

  useEffect(() => {
    if (sessionArea) return;
    let active = true;
    setIsPortalLoaded(false);
    Promise.all([loadPortalData(), refreshCategories()])
      .then(([data, categoriesLoaded]) => {
        if (!active) return;
        setBusinesses(data.businesses);
        setReviews(data.reviews);
        setCoupons(data.coupons);
        setEvents(data.events);
        setUsefulNumbers(data.usefulNumbers);
        setPortalUnavailable([...data.unavailable, ...(categoriesLoaded ? [] : ["categories" as const])]);
        setIsPortalLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setBusinesses([]);
        setReviews([]);
        setCoupons([]);
        setEvents([]);
        setUsefulNumbers([]);
        setPortalUnavailable(["businesses", "reviews", "coupons", "events", "usefulNumbers", "categories"]);
        setIsPortalLoaded(true);
      });
    return () => { active = false; };
  }, [currentPath, sessionArea, portalAttempt]);

  useEffect(() => {
    if (!isBackofficeAuthenticated || !currentPath.startsWith("/backoffice")) return;
    const reload = () => {
      loadBackofficeBusinesses()
        .then(setBusinesses)
        .catch((error) => console.error("Nao foi possivel carregar o backoffice.", error));
    };
    reload();
    const timer = window.setInterval(reload, 30000);
    window.addEventListener("focus", reload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", reload);
    };
  }, [isBackofficeAuthenticated, currentPath]);

  useEffect(() => {
    if (currentPath.startsWith("/backoffice")) return;
    const businessReference = new URLSearchParams(window.location.search).get("empresa");
    if (!businessReference) return;
    const business = businesses.find(
      (item) =>
        (item.slug === businessReference || item.id === businessReference) &&
        (item.status ?? "active") === "active"
    );
    if (business) setSelectedBusinessForModal(business);
  }, [businesses, currentPath]);

  const closeBusinessDetails = () => {
    setSelectedBusinessForModal(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has("empresa")) {
      url.searchParams.delete("empresa");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

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

  const handleChangeBackofficeBusinessStatus = async (
    business: Business,
    status: NonNullable<Business["status"]>
  ) => {
    const savedBusiness = await changeBackofficeBusinessStatus(business, status);
    setBusinesses((previous) =>
      previous.map((item) => (item.id === savedBusiness.id ? savedBusiness : item))
    );
  };

  if (authenticationUrl) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><p role="status" className="text-sm font-semibold text-slate-600">Abrindo a área de acesso...</p></main>;
  }

  if (isAdvertiserArea) {
    if (!isSessionChecked) {
      return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">Carregando acesso...</div>;
    }
    if (!backofficeSession.is_advertiser) {
      return <AdvertiserLogin notice={advertiserLoginNotice} onLogin={async (username, password) => {
        const session = await loginAdvertiser(username, password);
        setBackofficeSession(session);
        setAdvertiserLoginNotice("");
      }} onExit={() => { window.location.href = "https://guiacomararaquara.com.br/"; }} />;
    }
    return <AdvertiserPortal onSessionExpired={() => {
      setBackofficeSession({ is_authenticated: false, is_backoffice: false, is_advertiser: false, username: "", name: "", email: "" });
      setIsBackofficeAuthenticated(false);
      setAdvertiserLoginNotice("Sua sessão expirou. Entre novamente para continuar.");
    }} onLogout={async () => {
      await logoutBackoffice();
      window.history.replaceState({}, "", "/anunciante/login");
      setCurrentPath("/anunciante/login");
      setBackofficeSession({ is_authenticated: false, is_backoffice: false, is_advertiser: false, username: "", name: "", email: "" });
      setAdvertiserLoginNotice("");
    }} />;
  }

  if (currentPath.startsWith("/backoffice")) {
    if (!isSessionChecked) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-3 animate-pulse rounded-2xl bg-amber-400/20" />
              <img
                src="/assets/brand-logo.png"
                alt="Guia Comercial Araraquara"
                className="relative h-24 w-24 rounded-2xl border border-slate-300 object-cover shadow-lg"
              />
            </div>
            <div className="mt-6 text-sm font-bold tracking-wide text-slate-800">Carregando Backoffice</div>
            <div className="mt-3 h-1 w-32 overflow-hidden rounded-full bg-slate-300">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-800" />
            </div>
            <div className="mt-3 text-xs text-slate-500">Guia Comercial Araraquara</div>
          </div>
        </div>
      );
    }
    if (!isBackofficeAuthenticated) {
      return (
        <BackofficeLogin
          onLogin={async (username, password) => {
            const session = await loginBackoffice(username, password);
            setBackofficeSession(session);
            setIsBackofficeAuthenticated(true);
          }}
          onExit={() => {
            window.location.href = "https://guiacomararaquara.com.br/";
          }}
        />
      );
    }
    return (
      <Backoffice
        businesses={businesses}
        onSaveBusiness={handleSaveBackofficeBusiness}
        onChangeBusinessStatus={handleChangeBackofficeBusinessStatus}
        onDeleteBusiness={handleDeleteBackofficeBusiness}
        onBusinessCreated={(business) => {
          setBusinesses(previous => [business, ...previous.filter(item => item.id !== business.id)]);
        }}
        session={backofficeSession}
        onExit={async () => {
          window.location.href = "https://guiacomararaquara.com.br/";
        }}
        onLogout={async () => {
          await logoutBackoffice();
          setIsBackofficeAuthenticated(false);
          setBackofficeSession({
            is_authenticated: false, is_backoffice: false, username: "", name: "", email: ""
          });
          window.location.href = "https://guiacomararaquara.com.br/";
        }}
      />
    );
  }

  if (currentTenantSubdomain) {
    const tenantBusiness = businesses.find(
      (business) => business.publicSubdomain === currentTenantSubdomain && (business.status ?? "active") === "active"
    );
    if (!isPortalLoaded) {
      return <div className="flex min-h-screen items-center justify-center bg-stone-50 text-sm font-bold text-stone-600">Carregando pagina da empresa...</div>;
    }
    if (portalUnavailable.includes("businesses")) {
      return <main className="min-h-screen bg-stone-50 p-6"><PortalStatus loading={false} unavailable={portalUnavailable} onRetry={retryPortal} /></main>;
    }
    if (tenantBusiness) {
      return <><PortalStatus loading={false} unavailable={portalUnavailable} onRetry={retryPortal} /><BusinessLandingPage business={tenantBusiness} reviews={reviews} coupons={coupons} reviewsUnavailable={portalUnavailable.includes("reviews")} onSubmitReview={handleSubmitReview} /></>;
    }
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-center">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-stone-900">Pagina indisponivel</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">Esta pagina de empresa nao existe ou ainda nao foi publicada.</p>
          <a href="https://www.guiacomararaquara.com.br" className="mt-6 inline-flex rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white">Ir para o Guia Comercial</a>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/20 text-stone-900 flex flex-col font-sans selection:bg-amber-150 selection:text-amber-900">
      
      {/* 1. Navigation Header */}
      <Header
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenBackoffice={() => {
          window.location.href =
            "https://guiacomararaquara.com.br/backoffice/";
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
      <PortalStatus loading={!isPortalLoaded} unavailable={portalUnavailable} onRetry={retryPortal} />
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
            {isPortalLoaded && !portalUnavailable.includes("businesses") && <p className="text-xs text-stone-500 mt-1">
              Exibindo <span className="font-bold text-stone-800">{filteredBusinesses.length}</span> cadastro(s) encontrados
            </p>}
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
        {isPortalLoaded && !portalUnavailable.includes("businesses") && filteredBusinesses.length === 0 && (
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
      {isPortalLoaded && !portalUnavailable.includes("coupons") && <CouponSection
        coupons={coupons}
        businesses={businesses}
        onOpenBusinessDetails={setSelectedBusinessForModal}
      />}

      {/* 6. Upcoming Events Section */}
      {isPortalLoaded && !portalUnavailable.includes("events") && <EventSection events={events} />}

      {/* 7. Useful Phone Numbers List */}
      {isPortalLoaded && !portalUnavailable.includes("usefulNumbers") && <UsefulNumbersSection numbers={usefulNumbers} />}

      {/* 8. Elegant Footer */}
      <Footer />

      {/* --- BUSINESS DETAILED VIEW MODAL --- */}
      {selectedBusinessForModal && (
        <BusinessModal
          business={selectedBusinessForModal}
          reviews={reviews}
          reviewsUnavailable={portalUnavailable.includes("reviews")}
          coupons={coupons}
          onClose={closeBusinessDetails}
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
