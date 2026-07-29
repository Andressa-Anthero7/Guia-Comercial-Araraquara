import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Edit3,
  ImageIcon,
  List,
  LayoutDashboard,
  PlusCircle,
  Save,
  Search,
  Star,
  Trash2,
  UploadCloud,
  XCircle
} from "lucide-react";
import { Business } from "../types";
import { CATEGORIES, NEIGHBORHOODS } from "../data";

interface BackofficeProps {
  businesses: Business[];
  onSaveBusiness: (business: Business) => Promise<void>;
  onDeleteBusiness: (business: Business) => Promise<void>;
  onExit: () => void | Promise<void>;
}

type BusinessStatus = NonNullable<Business["status"]>;

interface BusinessFormState {
  id: string;
  name: string;
  category: string;
  description: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  phoneWhatsapp: string;
  email: string;
  website: string;
  instagram: string;
  image: string;
  logoImage: string;
  images: string[];
  hours: string;
  tags: string;
  isFeatured: boolean;
  status: BusinessStatus;
}

const STATUS_OPTIONS: Array<{ value: BusinessStatus; label: string }> = [
  { value: "active", label: "Publicado" },
  { value: "pending", label: "Pendente" },
  { value: "draft", label: "Rascunho" },
  { value: "inactive", label: "Inativo" }
];

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600";
const MAX_GALLERY_IMAGES = 10;
const MAX_IMAGE_SIZE_MB = 10;
const MAX_OPTIMIZED_IMAGE_SIZE_MB = 1.5;
const MAX_IMAGE_DIMENSION = 1600;

function getBusinessStatus(business: Business): BusinessStatus {
  return business.status ?? "active";
}

function splitAddress(address: string) {
  const [streetPart = "", complementPart = ""] = address.split(" - ");
  const [street = streetPart, number = ""] = streetPart.split(",").map((part) => part.trim());
  return { street, number, complement: complementPart.trim() };
}

function emptyForm(): BusinessFormState {
  return {
    id: "",
    name: "",
    category: CATEGORIES[0]?.slug ?? "",
    description: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: NEIGHBORHOODS[0] ?? "",
    city: "Araraquara",
    state: "SP",
    postalCode: "",
    phoneWhatsapp: "",
    email: "",
    website: "",
    instagram: "",
    image: "",
    logoImage: "",
    images: [],
    hours: "Seg - Sab: 08:00 as 18:00",
    tags: "",
    isFeatured: false,
    status: "pending"
  };
}

function businessToForm(business: Business): BusinessFormState {
  const addressParts = splitAddress(business.address);

  return {
    id: business.id,
    name: business.name,
    category: business.category,
    description: business.description,
    street: business.street ?? addressParts.street,
    number: business.number ?? addressParts.number,
    complement: business.complement ?? addressParts.complement,
    neighborhood: business.neighborhood,
    city: business.city ?? "Araraquara",
    state: business.state ?? "SP",
    postalCode: business.postalCode ?? "",
    phoneWhatsapp: business.phone,
    email: business.email ?? "",
    website: business.website ?? "",
    instagram: business.instagram ?? "",
    image: business.image,
    logoImage: business.logoImage ?? "",
    images: business.images?.length ? business.images : business.image ? [business.image] : [],
    hours: business.hours,
    tags: business.tags.join(", "),
    isFeatured: business.isFeatured,
    status: getBusinessStatus(business)
  };
}

function statusLabel(status: BusinessStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function statusClass(status: BusinessStatus) {
  const classes: Record<BusinessStatus, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    draft: "bg-stone-50 text-stone-600 border-stone-200",
    inactive: "bg-rose-50 text-rose-700 border-rose-200"
  };
  return classes[status];
}

function categoryName(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug)?.name ?? slug;
}

function buildAddress(form: BusinessFormState) {
  const streetLine = [form.street.trim(), form.number.trim()].filter(Boolean).join(", ");
  return [streetLine, form.complement.trim()].filter(Boolean).join(" - ");
}

export function Backoffice({ businesses, onSaveBusiness, onDeleteBusiness, onExit }: BackofficeProps) {
  const [activeView, setActiveView] = useState<"list" | "form">(() =>
    window.location.pathname.includes("/cadastro") ? "form" : "list"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BusinessStatus>("all");
  const [form, setForm] = useState<BusinessFormState>(() => emptyForm());
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  const filteredBusinesses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return businesses.filter((business) => {
      const currentStatus = getBusinessStatus(business);
      if (statusFilter !== "all" && currentStatus !== statusFilter) return false;
      if (!query) return true;

      return [
        business.name,
        business.description,
        business.address,
        business.neighborhood,
        business.phone,
        business.email ?? "",
        categoryName(business.category),
        ...business.tags
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [businesses, searchQuery, statusFilter]);

  const totals = useMemo(() => {
    return businesses.reduce(
      (summary, business) => {
        const currentStatus = getBusinessStatus(business);
        summary.total += 1;
        summary[currentStatus] += 1;
        summary.featured += business.isFeatured ? 1 : 0;
        return summary;
      },
      { total: 0, active: 0, pending: 0, draft: 0, inactive: 0, featured: 0 }
    );
  }, [businesses]);

  const openNewForm = () => {
    window.history.pushState({}, "", "/backoffice/cadastro");
    setForm(emptyForm());
    setImageUploadError("");
    setIsLogoDragging(false);
    setIsGalleryDragging(false);
    setActiveView("form");
  };

  const openEditForm = (business: Business) => {
    window.history.pushState({}, "", `/backoffice/estabelecimentos/${business.id}/editar`);
    setForm(businessToForm(business));
    setImageUploadError("");
    setIsLogoDragging(false);
    setIsGalleryDragging(false);
    setActiveView("form");
  };

  const closeForm = () => {
    window.history.pushState({}, "", "/backoffice");
    setForm(emptyForm());
    setImageUploadError("");
    setIsLogoDragging(false);
    setIsGalleryDragging(false);
    setActiveView("list");
  };

  const validateImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return "Envie apenas arquivos de imagem.";
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return `Cada imagem deve ter no maximo ${MAX_IMAGE_SIZE_MB} MB.`;
    }

    return "";
  };

  const fileToOptimizedDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const scale = Math.min(
          1,
          MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Nao foi possivel processar a imagem."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const maxBytes = MAX_OPTIMIZED_IMAGE_SIZE_MB * 1024 * 1024;
        let quality = 0.86;
        let result = canvas.toDataURL("image/webp", quality);

        while (result.length * 0.75 > maxBytes && quality > 0.46) {
          quality -= 0.1;
          result = canvas.toDataURL("image/webp", quality);
        }

        if (result.length * 0.75 > maxBytes) {
          reject(
            new Error(
              `Nao foi possivel reduzir a imagem para ${MAX_OPTIMIZED_IMAGE_SIZE_MB} MB.`
            )
          );
          return;
        }

        resolve(result);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Arquivo de imagem invalido ou corrompido."));
      };
      image.src = objectUrl;
    });

  const setLogoFromFile = async (file?: File) => {
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setImageUploadError(validationError);
      return;
    }

    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      setForm((current) => ({ ...current, logoImage: dataUrl }));
      setImageUploadError("");
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Nao foi possivel carregar a imagem.");
    }
  };

  const addGalleryImages = async (files?: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const availableSlots = MAX_GALLERY_IMAGES - form.images.length;

    if (availableSlots <= 0) {
      setImageUploadError(`Cada estabelecimento pode ter ate ${MAX_GALLERY_IMAGES} imagens.`);
      return;
    }

    const filesToRead = selectedFiles.slice(0, availableSlots);
    const firstInvalidFile = filesToRead.find((file) => validateImageFile(file));
    if (firstInvalidFile) {
      setImageUploadError(validateImageFile(firstInvalidFile));
      return;
    }

    try {
      const dataUrls = await Promise.all(
        filesToRead.map((file) => fileToOptimizedDataUrl(file))
      );
      setForm((current) => ({
        ...current,
        images: [...current.images, ...dataUrls].slice(0, MAX_GALLERY_IMAGES)
      }));
      setImageUploadError(
        selectedFiles.length > availableSlots
          ? `Foram adicionadas ${availableSlots} imagens. O limite e ${MAX_GALLERY_IMAGES}.`
          : ""
      );
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Nao foi possivel carregar as imagens.");
    }
  };

  const handleLogoInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLogoFromFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleGalleryInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addGalleryImages(event.target.files ?? undefined);
    event.target.value = "";
  };

  const handleLogoDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsLogoDragging(false);
    setLogoFromFile(event.dataTransfer.files?.[0]);
  };

  const handleGalleryDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsGalleryDragging(false);
    addGalleryImages(event.dataTransfer.files);
  };

  const removeGalleryImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index)
    }));
    setImageUploadError("");
  };

  const handleDelete = async (business: Business) => {
    const confirmed = window.confirm(`Remover "${business.name}" do portal?`);
    if (!confirmed) return;

    try {
      await onDeleteBusiness(business);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Nao foi possivel remover.");
      return;
    }
    if (form.id === business.id) {
      setForm(emptyForm());
      setActiveView("list");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const existingBusiness = businesses.find((business) => business.id === form.id);
    const cleanWhatsapp = form.phoneWhatsapp.replace(/[^0-9]/g, "");
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const galleryImages = form.images.slice(0, MAX_GALLERY_IMAGES);
    const coverImage = galleryImages[0] || form.image.trim() || DEFAULT_IMAGE;

    try {
      await onSaveBusiness({
        id: form.id || `biz-${Date.now()}`,
        slug: existingBusiness?.slug,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        address: buildAddress(form),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim(),
        neighborhood: form.neighborhood,
        city: form.city.trim() || "Araraquara",
        state: form.state.trim() || "SP",
        postalCode: form.postalCode.trim(),
        phone: form.phoneWhatsapp.trim(),
        whatsapp: cleanWhatsapp,
        email: form.email.trim(),
        website: form.website.trim(),
        instagram: form.instagram.trim().replace("@", ""),
        rating: existingBusiness?.rating ?? 0,
        reviewsCount: existingBusiness?.reviewsCount ?? 0,
        image: coverImage,
        logoImage: form.logoImage,
        images: galleryImages,
        isFeatured: form.isFeatured,
        status: form.status,
        hours: form.hours.trim(),
        tags: tags.length > 0 ? tags : ["Comercio Local"]
      });
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Nao foi possivel salvar.");
      return;
    }

    window.history.pushState({}, "", "/backoffice");
    setForm(emptyForm());
    setActiveView("list");
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-stone-950">Backoffice</h1>
              <p className="text-xs font-semibold uppercase text-stone-500">Guia Comercial Araraquara</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={onExit}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              id="backoffice-exit"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao portal</span>
            </button>
            <button
              onClick={openNewForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
              id="backoffice-new-business"
            >
              <PlusCircle className="h-4 w-4 text-amber-400" />
              <span>Cadastrar estabelecimento</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="space-y-3">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-900">
              <Building2 className="h-4 w-4 text-amber-500" />
              <span>Portal</span>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <button
                onClick={closeForm}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
                  activeView === "list"
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Estabelecimentos
                </span>
                <span>{totals.total}</span>
              </button>
              <button
                onClick={openNewForm}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${
                  activeView === "form" && !form.id
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Cadastrar
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveView("list");
                  setStatusFilter("pending");
                }}
                className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                <span>Pendentes</span>
                <span>{totals.pending}</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="mb-3 text-xs font-bold uppercase text-stone-500">Publicacao</div>
            <div className="space-y-2">
              {[
                { label: "Total", value: totals.total, icon: Building2 },
                { label: "Publicados", value: totals.active, icon: CheckCircle2 },
                { label: "Destaques", value: totals.featured, icon: Star },
                { label: "Inativos", value: totals.inactive, icon: XCircle }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-stone-600">
                      <Icon className="h-4 w-4 text-stone-400" />
                      {item.label}
                    </span>
                    <span className="font-bold text-stone-950">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {activeView === "list" && (
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-stone-950">Estabelecimentos</h2>
                <p className="text-xs text-stone-500">{filteredBusinesses.length} cadastro(s) na visualizacao atual</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 sm:w-72"
                    placeholder="Buscar"
                    id="backoffice-search"
                  />
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "all" | BusinessStatus)}
                  className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  id="backoffice-status-filter"
                >
                  <option value="all">Todos os status</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-100 text-left">
                <thead>
                  <tr className="text-xs font-bold uppercase text-stone-500">
                    <th className="px-3 py-3">Estabelecimento</th>
                    <th className="px-3 py-3">Contato</th>
                    <th className="px-3 py-3">Endereco</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredBusinesses.map((business) => {
                    const currentStatus = getBusinessStatus(business);
                    return (
                      <tr key={business.id} className="align-top text-sm">
                        <td className="px-3 py-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={business.image}
                              alt={business.name}
                              className="h-12 w-12 rounded-md object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-stone-950">{business.name}</div>
                              <div className="text-xs text-stone-500">{categoryName(business.category)}</div>
                              {business.isFeatured && (
                                <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                  <BadgeCheck className="h-3 w-3" />
                                  Destaque
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-stone-800">{business.phone}</div>
                          <div className="text-xs text-stone-500">{business.email || "Sem e-mail"}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-64 text-stone-700">{business.address}</div>
                          <div className="text-xs text-stone-500">
                            {business.neighborhood} · {business.city ?? "Araraquara"}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${statusClass(currentStatus)}`}>
                            {statusLabel(currentStatus)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditForm(business)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50"
                              title="Editar"
                              id={`backoffice-edit-${business.id}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(business)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                              title="Remover"
                              id={`backoffice-delete-${business.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBusinesses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-sm font-semibold text-stone-500">
                        Nenhum cadastro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {activeView === "form" && (
            <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-4" id="backoffice-business-form">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-stone-950">
                    {form.id ? "Editar estabelecimento" : "Cadastro de estabelecimento"}
                  </h2>
                  <p className="text-xs text-stone-500">Preencha os dados que serao usados no portal publico.</p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                  title="Fechar"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-xs font-bold uppercase text-stone-500">
                  Nome do estabelecimento
                  <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Categoria
                  <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                    {CATEGORIES.map((category) => (
                      <option key={category.slug} value={category.slug}>{category.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Rua
                  <input required value={form.street} onChange={(event) => setForm((current) => ({ ...current, street: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <label className="block text-xs font-bold uppercase text-stone-500">
                    Numero
                    <input required value={form.number} onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                  </label>
                  <label className="block text-xs font-bold uppercase text-stone-500">
                    Complemento
                    <input value={form.complement} onChange={(event) => setForm((current) => ({ ...current, complement: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                  </label>
                </div>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Bairro
                  <select value={form.neighborhood} onChange={(event) => setForm((current) => ({ ...current, neighborhood: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                    {NEIGHBORHOODS.map((neighborhood) => (
                      <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Cidade
                  <input required value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <div className="grid grid-cols-[90px_1fr] gap-3">
                  <label className="block text-xs font-bold uppercase text-stone-500">
                    UF
                    <input required value={form.state} maxLength={2} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value.toUpperCase() }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                  </label>
                  <label className="block text-xs font-bold uppercase text-stone-500">
                    CEP
                    <input value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                  </label>
                </div>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Fone/WhatsApp
                  <input required value={form.phoneWhatsapp} onChange={(event) => setForm((current) => ({ ...current, phoneWhatsapp: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  E-mail
                  <input type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Site
                  <input type="url" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Instagram
                  <input value={form.instagram} onChange={(event) => setForm((current) => ({ ...current, instagram: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Horario
                  <input value={form.hours} onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <div className="space-y-5 lg:col-span-2">
                  <div>
                    <div className="mb-1 text-xs font-bold uppercase text-stone-500">Logomarca</div>
                    <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                      <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                        {form.logoImage ? (
                          <img
                            src={form.logoImage}
                            alt="Logomarca"
                            className="h-full w-full object-contain p-3"
                          />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-stone-300" />
                        )}
                      </div>

                      <div className="space-y-3">
                        <label
                          onDragOver={(event) => {
                            event.preventDefault();
                            setIsLogoDragging(true);
                          }}
                          onDragLeave={() => setIsLogoDragging(false)}
                          onDrop={handleLogoDrop}
                          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
                            isLogoDragging
                              ? "border-amber-400 bg-amber-50"
                              : "border-stone-300 bg-white hover:border-amber-300 hover:bg-stone-50"
                          }`}
                        >
                          <input type="file" accept="image/*" onChange={handleLogoInputChange} className="sr-only" />
                          <UploadCloud className="mb-2 h-6 w-6 text-amber-600" />
                          <div className="text-sm font-bold text-stone-900">Arraste a logomarca ou clique para selecionar</div>
                          <div className="mt-1 text-xs text-stone-500">1 imagem, PNG/JPG/WEBP ate 5 MB</div>
                        </label>

                        {form.logoImage && (
                          <button
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, logoImage: "" }))}
                            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Remover logomarca
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase text-stone-500">Imagens do estabelecimento</div>
                      <div className="text-xs font-bold text-stone-500">
                        {form.images.length}/{MAX_GALLERY_IMAGES}
                      </div>
                    </div>

                    <label
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsGalleryDragging(true);
                      }}
                      onDragLeave={() => setIsGalleryDragging(false)}
                      onDrop={handleGalleryDrop}
                      className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
                        isGalleryDragging
                          ? "border-amber-400 bg-amber-50"
                          : "border-stone-300 bg-white hover:border-amber-300 hover:bg-stone-50"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryInputChange}
                        className="sr-only"
                      />
                      <UploadCloud className="mb-2 h-7 w-7 text-amber-600" />
                      <div className="text-sm font-bold text-stone-900">Arraste ate 10 imagens ou clique para selecionar</div>
                      <div className="mt-1 text-xs text-stone-500">A primeira imagem sera usada como capa no portal</div>
                    </label>

                    {imageUploadError && (
                      <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                        {imageUploadError}
                      </div>
                    )}

                    {form.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {form.images.map((image, index) => (
                          <div key={`${image.slice(0, 24)}-${index}`} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
                            <div className="relative h-28 bg-stone-100">
                              <img src={image} alt={`Imagem ${index + 1}`} className="h-full w-full object-cover" />
                              {index === 0 && (
                                <span className="absolute left-2 top-2 rounded-md bg-stone-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                  Capa
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="flex w-full items-center justify-center gap-1 border-t border-stone-100 px-2 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="mt-3 block text-xs font-bold uppercase text-stone-500">
                      URL alternativa da capa
                      <div className="relative mt-1">
                        <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          type="url"
                          value={form.image.startsWith("data:") ? "" : form.image}
                          onChange={(event) => {
                            setForm((current) => ({ ...current, image: event.target.value }));
                            setImageUploadError("");
                          }}
                          placeholder="https://..."
                          className="h-10 w-full rounded-lg border border-stone-200 pl-9 pr-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <label className="block text-xs font-bold uppercase text-stone-500 lg:col-span-2">
                  Descricao
                  <textarea required rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500 lg:col-span-2">
                  Tags
                  <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </label>

                <label className="block text-xs font-bold uppercase text-stone-500">
                  Status
                  <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as BusinessStatus }))} className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium normal-case text-stone-950 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-stone-200 px-3 py-2 text-sm font-bold text-stone-700">
                  <input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} className="h-4 w-4 rounded border-stone-300 text-amber-500" />
                  Destaque no portal
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeForm} className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
                  Cancelar
                </button>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">
                  <Save className="h-4 w-4 text-amber-400" />
                  Salvar cadastro
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
