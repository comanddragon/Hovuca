"use client";

import dynamic from "next/dynamic";

const RichTextEditorClient = dynamic(
    () => import("./RichTextEditorClient").then((module) => module.RichTextEditorClient),
    {
        ssr: false,
        loading: () => <div className="min-h-[28rem] animate-pulse border border-border bg-muted/30" />,
    },
);

export function RichTextEditor(props: {
    value: string;
    onChange: (html: string) => void;
    error?: string;
}) {
    return <RichTextEditorClient {...props} />;
}
