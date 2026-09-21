"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
    AccessibilityHelp, Alignment, Autoformat, BlockQuote, Bold, ClassicEditor,
    Code, CodeBlock, Essentials, FindAndReplace, FontBackgroundColor, FontColor,
    FontSize, Fullscreen, GeneralHtmlSupport, Heading, Highlight,
    HorizontalLine, Image, ImageCaption, ImageInsert, ImageResize, ImageStyle,
    ImageToolbar, ImageUpload, Indent, IndentBlock, Italic, Link, LinkImage,
    List, ListProperties, MediaEmbed, PageBreak, Paragraph, PasteFromOffice,
    RemoveFormat, SelectAll, ShowBlocks, SourceEditing, SpecialCharacters,
    SpecialCharactersEssentials, Strikethrough, Subscript, Superscript, Table,
    TableCaption, TableCellProperties, TableColumnResize, TableProperties,
    TableToolbar, Underline, Undo,
    type Editor, type FileLoader, type UploadAdapter,
} from "ckeditor5";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { blogService } from "@/services/blog.service";

import "ckeditor5/ckeditor5.css";

class HovucaUploadAdapter implements UploadAdapter {
    constructor(private readonly loader: FileLoader) {}

    async upload(): Promise<Record<string, string>> {
        const file = await this.loader.file;
        if (!file) throw new Error("No image selected.");
        return { default: await blogService.uploadInlineImage(file) };
    }

    abort(): void {}
}

function HovucaUploadAdapterPlugin(editor: Editor) {
    editor.plugins.get("FileRepository").createUploadAdapter = (loader) => new HovucaUploadAdapter(loader);
}

const editorConfig = {
    licenseKey: "GPL",
    plugins: [
        AccessibilityHelp, Alignment, Autoformat, BlockQuote, Bold, Code, CodeBlock,
        Essentials, FindAndReplace, FontBackgroundColor, FontColor,
        FontSize, Fullscreen, GeneralHtmlSupport, Heading, Highlight, HorizontalLine,
        Image, ImageCaption, ImageInsert, ImageResize, ImageStyle, ImageToolbar,
        ImageUpload, Indent, IndentBlock, Italic, Link, LinkImage, List,
        ListProperties, MediaEmbed, PageBreak, Paragraph, PasteFromOffice,
        RemoveFormat, SelectAll, ShowBlocks, SourceEditing, SpecialCharacters,
        SpecialCharactersEssentials, Strikethrough, Subscript, Superscript, Table,
        TableCaption, TableCellProperties, TableColumnResize, TableProperties,
        TableToolbar, Underline, Undo,
    ],
    extraPlugins: [HovucaUploadAdapterPlugin],
    toolbar: {
        items: [
            "undo", "redo", "findAndReplace", "|", "heading", "fontSize",
            "|", "bold", "italic", "underline", "strikethrough", "code", "subscript",
            "superscript", "removeFormat", "|", "fontColor", "fontBackgroundColor",
            "highlight", "|", "alignment", "bulletedList", "numberedList", "outdent",
            "indent", "|", "link", "blockQuote", "codeBlock", "insertImage",
            "mediaEmbed", "insertTable", "horizontalLine", "pageBreak", "specialCharacters",
            "|", "showBlocks", "sourceEditing", "fullscreen",
        ],
        shouldNotGroupWhenFull: true,
    },
    fontSize: { options: [9, 11, 13, "default", 17, 20, 24, 30, 36], supportAllValues: true },
    htmlSupport: {
        allow: [{ name: /.*/, attributes: /.*/, classes: /.*/, styles: /.*/ }],
    },
    image: {
        toolbar: [
            "imageTextAlternative", "toggleImageCaption", "|", "imageStyle:alignLeft",
            "imageStyle:alignCenter", "imageStyle:alignRight", "|", "imageStyle:inline",
            "imageStyle:wrapText", "imageStyle:breakText", "|", "resizeImage",
        ],
        resizeOptions: [
            { name: "resizeImage:original", value: null, label: "Original" },
            { name: "resizeImage:25", value: "25", label: "25%" },
            { name: "resizeImage:50", value: "50", label: "50%" },
            { name: "resizeImage:75", value: "75", label: "75%" },
        ],
    },
    table: {
        contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
    },
    link: { addTargetToExternalLinks: true, defaultProtocol: "https://" },
    placeholder: "Write the article or lesson content…",
};

export function RichTextEditorClient({ value, onChangeAction, error }: {
    value: string;
    onChangeAction: (html: string) => void;
    error?: string;
}) {
    return (
        <div className={cn("hovuca-ckeditor", error && "hovuca-ckeditor--error")}>
            <CKEditor
                editor={ClassicEditor}
                config={editorConfig}
                data={value}
                onChange={(_, editor) => onChangeAction(editor.getData())}
                onError={(_, details) => {
                    if (!details.willEditorRestart) {
                        toast.error("The rich-text editor stopped unexpectedly. Reload the page and try again.");
                    }
                }}
            />
            <p className="border border-t-0 border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                The toolbar wraps onto additional rows. Select an image for alignment, wrapping, captions, and resizing.
            </p>
        </div>
    );
}
