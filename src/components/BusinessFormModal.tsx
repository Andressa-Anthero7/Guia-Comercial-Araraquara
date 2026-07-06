import { useState, FormEvent } from "react";
import { Business, Category } from "../types";
import { CATEGORIES, NEIGHBORHOODS } from "../data";
import { X, Send, CheckCircle2, Sparkles, Image as ImageIcon } from "lucide-react";

interface BusinessFormModalProps {
  onClose: () => void;
  onSubmit: (business: Omit<Business, "id" | "rating" | "reviewsCount" | "isFeatured">) => void;
}

const PRESET_IMAGES = [
  { id: "cafe", label: "Cafeteria / Doceria", url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600" },
  { id: "pizza", label: "Restaurante / Pizzaria", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=600" },
  { id: "loja", label: "Moda / Varejo", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600" },
  { id: "mecanica", label: "Oficina / Automotivo", url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600" },
  { id: "saude", label: "Clínica / Dentista", url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600" },
  { id: "salao", label: "Estética / Barbearia", url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600" }
];

export function BusinessFormModal({ onClose, onSubmit }: BusinessFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState(NEIGHBORHOODS[0]);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [hours, setHours] = useState("Seg - Sáb: 08:00 às 18:00");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(PRESET_IMAGES[0].url);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [imageType, setImageType] = useState<"preset" | "custom">("preset");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !address.trim() || !phone.trim() || !whatsapp.trim()) return;

    // Sanitize whatsapp (remove formatting, non-numeric characters except for leading if applicable)
    const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, "");
    
    // Split tags
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const imageToUse = imageType === "custom" && customImageUrl.trim() ? customImageUrl : selectedImage;

    onSubmit({
      name,
      description,
      category,
      address,
      neighborhood,
      phone,
      whatsapp: cleanWhatsapp,
      instagram: instagram.trim() ? instagram.trim().replace("@", "") : undefined,
      hours,
      tags: tags.length > 0 ? tags : ["Comércio Local"],
      image: imageToUse
    });

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-scale-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          <h2 className="font-display text-2xl font-bold text-stone-900 tracking-tight">
            Empresa Cadastrada!
          </h2>
          <p className="mt-3 text-sm text-stone-600 leading-relaxed">
            Sua empresa foi adicionada com sucesso ao Guia Comercial Araraquara. 
            Você já pode visualizá-la na lista principal de comércios!
          </p>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors cursor-pointer"
            id="success-close-btn"
          >
            Fechar e Ver Guia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8"
        id="business-register-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-stone-50 border-b border-stone-100 px-6 py-5 sm:px-8">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">
                Cadastre sua Empresa Grátis
              </h2>
              <p className="text-xs text-stone-500">
                Alcance milhares de clientes na Morada do Sol de forma online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Fechar"
            id="register-modal-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-stone-800 border-l-2 border-amber-500 pl-2">
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Caffè di Sol"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  id="form-business-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Categoria *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white cursor-pointer"
                  id="form-business-category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Descrição Curta *</label>
              <textarea
                required
                rows={3}
                placeholder="Conte sobre sua empresa, diferenciais, produtos ou história... (mínimo 10 caracteres)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                id="form-business-desc"
              />
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-stone-800 border-l-2 border-amber-500 pl-2">
              Contatos & Localização
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Telefone Comercial / Fixo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (16) 3332-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  id="form-business-phone"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">WhatsApp (Somente números com DDD) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 16997421234 (sem traço ou parênteses)"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  id="form-business-whatsapp"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Endereço Completo (Rua/Av e número) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Av. Bento de Abreu, 1420"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  id="form-business-address"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Bairro *</label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white cursor-pointer"
                  id="form-business-neighborhood"
                >
                  {NEIGHBORHOODS.map((nb) => (
                    <option key={nb} value={nb}>
                      {nb}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">User Instagram (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: @caffedisol_aqa"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  id="form-business-insta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Horário de Atendimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Seg - Sáb: 08:00 às 18:00"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  id="form-business-hours"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Branding / Image Picker */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-stone-800 border-l-2 border-amber-500 pl-2">
              Imagem de Capa do Estabelecimento
            </h3>

            {/* Selector between preset image or custom URL */}
            <div className="flex space-x-4 border-b border-stone-100 pb-3">
              <button
                type="button"
                onClick={() => setImageType("preset")}
                className={`text-xs font-bold pb-1 transition-colors cursor-pointer ${
                  imageType === "preset"
                    ? "border-b-2 border-amber-500 text-stone-900"
                    : "text-stone-400 hover:text-stone-600"
                }`}
                id="img-type-preset-toggle"
              >
                Escolher Ilustração Pronta
              </button>
              <button
                type="button"
                onClick={() => setImageType("custom")}
                className={`text-xs font-bold pb-1 transition-colors cursor-pointer ${
                  imageType === "custom"
                    ? "border-b-2 border-amber-500 text-stone-900"
                    : "text-stone-400 hover:text-stone-600"
                }`}
                id="img-type-custom-toggle"
              >
                Colar URL de Imagem
              </button>
            </div>

            {imageType === "preset" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_IMAGES.map((preset) => {
                  const isChosen = selectedImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedImage(preset.url)}
                      className={`flex flex-col rounded-xl border overflow-hidden text-left transition-all ${
                        isChosen
                          ? "ring-2 ring-amber-500 border-amber-500"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                      id={`preset-img-btn-${preset.id}`}
                    >
                      <img src={preset.url} alt={preset.label} className="h-16 w-full object-cover" />
                      <span className="p-2 text-[10px] font-bold text-stone-800 line-clamp-1">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Cole a URL da Imagem (Unsplash, Imgur, etc.)</label>
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-stone-400" />
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    id="form-business-custom-img"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Tags & Submit */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">
                Palavras-chave / Tags (Separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex: pizza, almoço, promoção, mecânico, freio"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                id="form-business-tags"
              />
            </div>

            {/* Separator */}
            <div className="border-t border-stone-100 pt-5" />

            {/* Submit Action */}
            <button
              type="submit"
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-stone-800 transition-all active:scale-98 cursor-pointer"
              id="form-submit-btn"
            >
              <Send className="h-4.5 w-4.5 text-amber-400" />
              <span>Cadastrar Minha Empresa</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
