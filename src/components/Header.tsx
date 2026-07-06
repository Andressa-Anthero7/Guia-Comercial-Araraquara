import { useState } from "react";
import { Sun, Menu, X, PlusCircle, Building2 } from "lucide-react";

interface HeaderProps {
  onOpenRegisterModal: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function Header({ onOpenRegisterModal, activeSection, setActiveSection }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "comercios", label: "Comércios" },
    { id: "cupons", label: "Cupons de Desconto" },
    { id: "eventos", label: "Eventos Locais" },
    { id: "telefones", label: "Telefones Úteis" }
  ];

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsOpen(false);
    
    // Smooth scroll to element if on home
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div 
          onClick={() => handleNavClick("comercios")} 
          className="flex cursor-pointer items-center space-x-2"
          id="header-logo"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
            <Sun className="h-6 w-6 text-white animate-spin-slow" />
          </div>
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight text-stone-900 sm:text-xl">
              Guia Com<span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">Araraquara</span>
            </span>
            <div className="hidden text-[10px] font-semibold uppercase tracking-wider text-stone-400 sm:block">
              A Morada do Sol Online
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex md:items-center md:space-x-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`text-sm font-medium transition-colors hover:text-amber-500 cursor-pointer ${
                activeSection === item.id 
                  ? "text-amber-600 font-semibold" 
                  : "text-stone-600"
              }`}
              id={`nav-item-${item.id}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          <button
            onClick={onOpenRegisterModal}
            className="flex items-center space-x-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow active:scale-95 cursor-pointer"
            id="register-business-btn-desktop"
          >
            <PlusCircle className="h-4 w-4 text-amber-400" />
            <span>Divulgar Empresa</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center space-x-2 md:hidden">
          <button
            onClick={onOpenRegisterModal}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 cursor-pointer"
            title="Divulgar Empresa"
            id="register-business-btn-mobile-icon"
          >
            <Building2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 cursor-pointer"
            id="mobile-menu-toggle"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-b border-stone-100 bg-white px-4 pt-2 pb-6 md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-base font-medium ${
                  activeSection === item.id
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
                id={`mobile-nav-item-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenRegisterModal();
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 cursor-pointer"
              id="register-business-btn-mobile"
            >
              <PlusCircle className="h-4 w-4 text-amber-400" />
              <span>Anunciar meu Negócio</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
