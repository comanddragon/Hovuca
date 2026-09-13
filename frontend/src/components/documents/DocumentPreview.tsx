"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import type { PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";

export function DocumentPreview({ url, title }: { url: string; title: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let loadingTask: PDFDocumentLoadingTask | undefined;
        let renderTask: RenderTask | undefined;

        async function renderFirstPage() {
            try {
                setFailed(false);
                const pdfjs = await import("pdfjs-dist");
                pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/build/pdf.worker.min.mjs",
                    import.meta.url,
                ).toString();

                loadingTask = pdfjs.getDocument({ url });
                const pdf = await loadingTask.promise;
                if (cancelled) return;

                const page = await pdf.getPage(1);
                const baseViewport = page.getViewport({ scale: 1 });
                const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
                const scale = (288 * pixelRatio) / baseViewport.width;
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                if (!canvas || cancelled) return;

                const context = canvas.getContext("2d", { alpha: false });
                if (!context) throw new Error("Canvas is unavailable");
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const currentRenderTask = page.render({ canvas, canvasContext: context, viewport });
                renderTask = currentRenderTask;
                await currentRenderTask.promise;
            } catch (error) {
                if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) {
                    setFailed(true);
                }
            }
        }

        void renderFirstPage();
        return () => {
            cancelled = true;
            renderTask?.cancel();
            void loadingTask?.destroy();
        };
    }, [url]);

    return (
        <div className="relative aspect-[8.5/11] w-36 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            {!failed && (
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={`First page preview of ${title}`}
                    className="h-full w-full object-contain"
                />
            )}
            {failed && (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-neutral-50 px-3 text-center text-xs font-semibold text-neutral-500">
                    <FileText className="h-9 w-9 text-[#5d2d84]" aria-hidden="true" />
                    Preview unavailable
                </div>
            )}
            <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-white/90 px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#35145f] shadow-sm">
                <FileText className="h-3 w-3" aria-hidden="true" /> Page 1
            </div>
        </div>
    );
}
