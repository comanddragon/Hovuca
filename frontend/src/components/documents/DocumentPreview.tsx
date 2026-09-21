"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Video } from "lucide-react";
import type { PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";

export function DocumentPreview({ url, title }: { url: string; title: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [failed, setFailed] = useState(false);
    const [ready, setReady] = useState(false);
    const isVideo = /\.(?:mp4|m4v|mov|webm|ogv)(?:$|[?#])/i.test(url);
    const previewUrl = `/resource-preview?url=${encodeURIComponent(url)}`;

    useEffect(() => {
        if (isVideo) return;
        let cancelled = false;
        let loadingTask: PDFDocumentLoadingTask | undefined;
        let renderTask: RenderTask | undefined;

        async function renderFirstPage() {
            try {
                setFailed(false);
                setReady(false);
                const pdfjs = await import("pdfjs-dist");
                if (cancelled) return;
                pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/build/pdf.worker.min.mjs",
                    import.meta.url,
                ).toString();

                loadingTask = pdfjs.getDocument({ url: previewUrl });
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
                if (!context) {
                    if (!cancelled) setFailed(true);
                    return;
                }
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const currentRenderTask = page.render({ canvas, canvasContext: context, viewport });
                renderTask = currentRenderTask;
                await currentRenderTask.promise;
                if (!cancelled) setReady(true);
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
    }, [isVideo, previewUrl]);

    if (isVideo) {
        return (
            <div className="relative aspect-video w-full max-w-sm overflow-hidden border border-[var(--brand-forest)]/25 bg-[var(--brand-forest-deep)]">
                <video className="h-full w-full object-cover" controls preload="metadata" aria-label={`Video preview: ${title}`}>
                    <source src={url} />
                    Your browser does not support video playback.
                </video>
                <span className="pointer-events-none absolute left-1.5 top-1.5 inline-flex items-center gap-1 bg-[var(--brand-forest-deep)]/85 px-1.5 py-1 text-[10px] font-bold text-white">
                    <Video className="h-3 w-3" aria-hidden="true" /> Video
                </span>
            </div>
        );
    }

    return (
        <div className="relative aspect-8.5/11 w-36 overflow-hidden border border-[var(--brand-forest)]/25 bg-white">
            {!failed && (
                <canvas
                    ref={canvasRef}
                    role={ready ? "img" : undefined}
                    aria-label={ready ? `First page preview of ${title}` : undefined}
                    aria-hidden={!ready}
                    className={`h-full w-full object-contain ${ready ? "" : "invisible"}`}
                />
            )}
            {failed && (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-[var(--brand-sage-light)] px-3 text-center text-xs font-semibold text-[var(--brand-body-muted)]">
                    <FileText className="h-9 w-9 text-[var(--brand-forest)]" aria-hidden="true" />
                    Preview unavailable
                </div>
            )}
            {!failed && !ready && <p className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-[var(--brand-body-muted)]">Loading preview…</p>}
            {ready && <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-white/90 px-1.5 py-1 text-[10px] font-bold text-[var(--brand-forest)]">
                <FileText className="h-3 w-3" aria-hidden="true" /> Page 1
            </div>}
        </div>
    );
}
