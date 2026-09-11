import { useState, type ChangeEvent } from "react";
import { optimizeImageFile } from "../utils/content";

interface Props {
  cover: string;
  images: string[];
  limit: number;
  disabled?: boolean;
  onChange: (cover: string, images: string[]) => void;
  onProcessing: (processing: boolean) => void;
}

export function BusinessPhotos({ cover, images, limit, disabled, onChange, onProcessing }: Props) {
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>, isCover: boolean) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || processing) return;
    setError("");
    if (!isCover && images.length + files.length > limit) {
      setError(`Seu plano permite até ${limit} foto(s) na galeria.`);
      return;
    }
    setProcessing(true);
    onProcessing(true);
    try {
      const photos = await Promise.all(files.map(optimizeImageFile));
      onChange(isCover ? photos[0] : cover, isCover ? images : [...images, ...photos]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível preparar as fotos.");
    } finally {
      setProcessing(false);
      onProcessing(false);
    }
  }
  const locked = disabled || processing;
  return <fieldset disabled={locked} className="space-y-4 rounded-md border border-slate-200 p-4 sm:col-span-2">
    <legend className="px-2 text-sm font-bold">Fotos do estabelecimento</legend>
    <div className="flex flex-wrap items-center gap-4">
      {cover && <img src={cover} alt="Capa atual" className="h-24 w-36 rounded-md object-cover" />}
      <label className="block text-sm font-semibold">Trocar capa<input aria-label="Trocar capa" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => void upload(event, true)} className="mt-2 block max-w-full text-xs" /></label>
    </div>
    <p className="text-xs text-slate-500">Até {limit} foto(s) na galeria. PNG, JPEG, WebP ou GIF, até 10 MB por arquivo. Salve o cadastro para publicar as alterações.</p>
    <div className="flex flex-wrap gap-3">{images.map((image, index) => <div key={`${index}-${image.slice(-30)}`} className="space-y-1">
      <img src={image} alt={`Foto ${index + 1} da galeria`} className="h-24 w-32 rounded-md object-cover" />
      <button type="button" onClick={() => onChange(cover, images.filter((_, i) => i !== index))} className="text-xs font-semibold text-rose-700">Remover foto {index + 1}</button>
    </div>)}</div>
    <label className="block text-sm font-semibold">Adicionar fotos<input aria-label="Adicionar fotos" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" disabled={locked || images.length >= limit} onChange={event => void upload(event, false)} className="mt-2 block max-w-full text-xs" /></label>
    {processing && <p role="status" className="text-sm text-slate-600">Preparando fotos...</p>}
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
  </fieldset>;
}
