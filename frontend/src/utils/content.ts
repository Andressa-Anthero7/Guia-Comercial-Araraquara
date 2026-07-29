const MAX_IMAGE_BYTES = 600 * 1024;
const MAX_IMAGE_DIMENSION = 1280;

export function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;#]+/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 80))
    )
  );
}

export function optimizeImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Envie apenas arquivos de imagem."));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("Cada imagem deve ter no máximo 10 MB."));
      return;
    }

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
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      let result = canvas.toDataURL("image/webp", quality);
      while (result.length * 0.75 > MAX_IMAGE_BYTES && quality > 0.42) {
        quality -= 0.08;
        result = canvas.toDataURL("image/webp", quality);
      }
      if (result.length * 0.75 > MAX_IMAGE_BYTES) {
        reject(new Error("A imagem é muito complexa para otimização. Escolha uma imagem menor."));
        return;
      }
      resolve(result);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Arquivo de imagem inválido ou corrompido."));
    };
    image.src = objectUrl;
  });
}
