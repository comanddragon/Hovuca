"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { X, Upload, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useTags, useCreateTag, useCreateArticle, useUpdateArticle } from "@/hooks";
import type { Article, ArticleStatus } from "@/types";

const STATUSES: ArticleStatus[] = ["draft", "review", "published", "archived"];

const articleSchema = z.object({
    title: z.string().min(1, "Required"),
    slug: z.string().optional(),
    excerpt: z.string().max(500, "500 characters max").optional(),
    body: z.string().min(1, "Required"),
    cover_image_alt: z.string().max(255).optional(),
    category: z.string().optional(),
    status: z.enum(["draft", "review", "published", "archived"]),
    is_featured: z.boolean(),
    meta_title: z.string().max(70, "70 characters max").optional(),
    meta_description: z.string().max(160, "160 characters max").optional(),
});
type ArticleForm = z.infer<typeof articleSchema>;

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function ArticleEditorForm({ article }: { article?: Article }) {
    const router = useRouter();
    const mode = article ? "edit" : "create";

    const { data: categories } = useCategories();
    const { data: tags } = useTags();
    const { mutate: createTag, isPending: creatingTag } = useCreateTag();
    const { mutate: createArticle, isPending: creating } = useCreateArticle();
    const { mutate: updateArticle, isPending: updating } = useUpdateArticle(article?.slug ?? "");
    const saving = creating || updating;

    const [slugTouched, setSlugTouched] = useState(mode === "edit");
    const [tagIds, setTagIds] = useState<string[]>(article?.tags.map((t) => t.id) ?? []);
    const [newTagName, setNewTagName] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(article?.cover_image ?? null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ArticleForm>({
        resolver: zodResolver(articleSchema) as Resolver<ArticleForm>,
        defaultValues: {
            title: article?.title ?? "",
            slug: article?.slug ?? "",
            excerpt: article?.excerpt ?? "",
            body: article?.body ?? "",
            cover_image_alt: article?.cover_image_alt ?? "",
            category: article?.category?.id ?? "",
            status: article?.status ?? "draft",
            is_featured: article?.is_featured ?? false,
            meta_title: article?.meta_title ?? "",
            meta_description: article?.meta_description ?? "",
        },
    });

    const excerpt = watch("excerpt") ?? "";
    const metaTitle = watch("meta_title") ?? "";
    const metaDescription = watch("meta_description") ?? "";

    const titleField = register("title");
    const slugField = register("slug");

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const toggleTag = (id: string) => {
        setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
    };

    const handleCreateTag = () => {
        const name = newTagName.trim();
        if (!name) return;
        createTag(name, {
            onSuccess: (tag) => {
                setTagIds((prev) => [...prev, tag.id]);
                setNewTagName("");
            },
            onError: () => toast.error("Failed to create tag."),
        });
    };

    const onSubmit = (data: ArticleForm) => {
        const payload = {
            ...data,
            category: data.category || null,
            tag_ids: tagIds,
            ...(coverFile && { cover_image: coverFile }),
        };

        if (mode === "create") {
            createArticle(payload, {
                onSuccess: (created) => router.push(`/admin/blog/${created.slug}/edit`),
            });
        } else {
            updateArticle(payload, {
                onSuccess: () => router.push("/admin/blog"),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="space-y-1.5">
                        <Label>Title</Label>
                        <Input
                            placeholder="Article title"
                            {...titleField}
                            onChange={(e) => {
                                titleField.onChange(e);
                                if (!slugTouched) setValue("slug", slugify(e.target.value));
                            }}
                        />
                        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Slug</Label>
                        <Input
                            placeholder="article-slug"
                            {...slugField}
                            onChange={(e) => {
                                slugField.onChange(e);
                                setSlugTouched(true);
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Excerpt</Label>
                        <Textarea placeholder="Short summary shown in listing cards" rows={3} {...register("excerpt")} />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {errors.excerpt ? <span className="text-destructive">{errors.excerpt.message}</span> : <span />}
                            <span>{excerpt.length}/500</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Body</Label>
                        <Textarea
                            placeholder="Write the article…"
                            rows={16}
                            {...register("body")}
                            className="font-mono text-sm"
                        />
                        {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
                    </div>

                    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                        <Label>SEO</Label>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-normal text-muted-foreground">Meta title</Label>
                            <Input placeholder="Meta title" {...register("meta_title")} />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                {errors.meta_title ? <span className="text-destructive">{errors.meta_title.message}</span> : <span />}
                                <span>{metaTitle.length}/70</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-normal text-muted-foreground">Meta description</Label>
                            <Textarea rows={2} placeholder="Meta description" {...register("meta_description")} />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                {errors.meta_description ? (
                                    <span className="text-destructive">{errors.meta_description.message}</span>
                                ) : (
                                    <span />
                                )}
                                <span>{metaDescription.length}/160</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                        <Label>Cover image</Label>
                        {coverPreview ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element -- object URL previews aren't optimizable */}
                                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCoverFile(null);
                                        setCoverPreview(null);
                                    }}
                                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/40"
                            >
                                <Upload className="h-5 w-5" />
                                Upload cover image
                            </button>
                        )}
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverChange}
                        />
                        {!coverPreview && (
                            <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
                                Choose file
                            </Button>
                        )}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-normal text-muted-foreground">Alt text</Label>
                            <Input placeholder="Describe the image" {...register("cover_image_alt")} />
                        </div>
                    </div>

                    <div className="space-y-1.5 rounded-xl border border-border bg-card p-4">
                        <Label>Category</Label>
                        <Select
                            value={watch("category") || "none"}
                            onValueChange={(v) => setValue("category", v === "none" ? "" : v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="No category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No category</SelectItem>
                                {categories?.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {tags?.map((t) => (
                                <Badge
                                    key={t.id}
                                    variant={tagIds.includes(t.id) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => toggleTag(t.id)}
                                >
                                    {t.name}
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="New tag"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCreateTag();
                                    }
                                }}
                            />
                            <Button type="button" size="sm" variant="outline" disabled={creatingTag} onClick={handleCreateTag}>
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ArticleStatus)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((s) => (
                                        <SelectItem key={s} value={s} className="capitalize">
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={watch("is_featured")}
                                onCheckedChange={(v) => setValue("is_featured", v === true)}
                            />
                            Featured
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-6">
                <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
                    Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : mode === "create" ? "Create article" : "Save changes"}
                </Button>
            </div>
        </form>
    );
}
