import { useState } from "react";
import { Sun, Menu, X, PlusCircle, Building2 } from "lucide-react";

interface HeaderProps {
  onOpenRegisterModal: () => void;
  onOpenBackoffice: () => void;
  isBackofficeAuthenticated: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function Header({
  onOpenRegisterModal,
  onOpenBackoffice,
  isBackofficeAuthenticated,
  activeSection,
  setActiveSection
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "comercios", label: "Anunciantes" },
    { id: "cupons", label: "Cupons" },
    { id: "eventos", label: "Eventos" },
    { id: "telefones", label: "Telefones" }
  ];

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsOpen(false);

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div
          onClick={() => handleNavClick("comercios")}
          className="flex cursor-pointer items-center space-x-2"
          id="header-logo"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 shadow-sm">
            <Sun className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight text-stone-900 sm:text-xl">
              Guia Com<span className="text-amber-600">Araraquara</span>
            </span>
            <div className="hidden text-[10px] font-semibold uppercase text-stone-400 sm:block">
              Anunciantes locais
            </div>
          </div>
        </div>

        <nav className="hidden md:flex md:items-center md:space-x-7">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`text-sm font-medium transition-colors hover:text-amber-600 ${
                activeSection === item.id ? "text-amber-700 font-semibold" : "text-stone-600"
              }`}
              id={`nav-item-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex md:items-center md:space-x-3">
          {isBackofficeAuthenticated && (
            <button
              onClick={onOpenBackoffice}
              className="flex items-center space-x-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:bg-stone-50"
              id="backoffice-btn-desktop"
            >
              <Building2 className="h-4 w-4 text-amber-600" />
              <span>Backoffice</span>
            </button>
          )}
          <button
            onClick={onOpenRegisterModal}
            className="flex items-center space-x-2 rounded-lg bg-stone-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-800"
            id="register-business-btn-desktop"
          >
            <PlusCircle className="h-4 w-4 text-amber-400" />
            <span>Divulgar empresa</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 md:hidden">
          <button
            onClick={onOpenRegisterModal}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200"
            title="Divulgar empresa"
            id="register-business-btn-mobile-icon"
          >
            <Building2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50"
            id="mobile-menu-toggle"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-b border-stone-100 bg-white px-4 pt-2 pb-6 md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-base font-medium ${
                  activeSection === item.id ? "bg-amber-50 text-amber-700" : "text-stone-600 hover:bg-stone-50"
                }`}
                id={`mobile-nav-item-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 border-t border-stone-100 pt-4">
            {isBackofficeAuthenticated && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenBackoffice();
                }}
                className="mb-2 flex w-full items-center justify-center space-x-2 rounded-lg border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                id="backoffice-btn-mobile"
              >
                <Building2 className="h-4 w-4 text-amber-600" />
                <span>Backoffice</span>
              </button>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenRegisterModal();
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-stone-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800"
              id="register-business-btn-mobile"
            >
              <PlusCircle className="h-4 w-4 text-amber-400" />
              <span>Anunciar negocio</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
