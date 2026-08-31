/**
 * Reduz uma imagem no navegador (canvas) antes do upload — envio muito mais
 * rápido e arquivos menores no storage, sem perder qualidade visível.
 * Só mexe em imagens raster; PDF e outros tipos passam intactos.
 */
export async function downscaleImage(
  file: File,
  opts: { maxSide?: number; quality?: number; skipUnderBytes?: number } = {},
): Promise<File> {
  const maxSide = opts.maxSide ?? 1600;
  const quality = opts.quality ?? 0.82;
  const skipUnder = opts.skipUnderBytes ?? 900_000;

  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.size < skipUnder) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.type === "image/jpeg") {
      bitmap.close?.();
      return file;
    }
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
