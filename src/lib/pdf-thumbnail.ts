// Client-side only — uses browser Canvas API + pdfjs-dist

export async function generatePdfThumbnail(source: File | ArrayBuffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  let data: ArrayBuffer;
  if (source instanceof File) {
    data = await source.arrayBuffer();
  } else {
    data = source;
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const TARGET_WIDTH = 280;
  const viewport = page.getViewport({ scale: 1 });
  const scale = TARGET_WIDTH / viewport.width;
  const scaled = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(scaled.width);
  canvas.height = Math.round(scaled.height);

  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
}
