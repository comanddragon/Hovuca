import api from "@/lib/api";
import { Article, Comment, PaginatedResponse, Category, Tag, Resource } from "@/types";

interface ArticleFilters {
    page?: number;
    category?: string;
    tag?: string;
    search?: string;
    is_featured?: boolean;
    author?: string;
    status?: string;
    page_size?: number;
}

export interface ArticleWritePayload {
    title: string;
    slug?: string;
    excerpt?: string;
    body: string;
    cover_image?: File | null;
    cover_image_alt?: string;
    category?: string | null;
    tag_ids?: string[];
    status: string;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
}

// tag_ids is an array and can't survive JSON.stringify through a multipart
// body the way toBody() elsewhere in this app handles arrays — DRF's
// ListField rejects a JSON-encoded string. When cover_image is a File we
// build FormData by hand instead, appending tag_ids as repeated fields so
// DRF picks them up via QueryDict.getlist.
function buildArticleBody(data: Partial<ArticleWritePayload>): FormData | Record<string, unknown> {
    const { cover_image, tag_ids, category, ...rest } = data;
    if (!(cover_image instanceof File)) {
        const body: Record<string, unknown> = { ...rest };
        if (tag_ids !== undefined) body.tag_ids = tag_ids;
        if (category !== undefined) body.category = category;
        return body;
    }

    const fd = new FormData();
    for (const [key, value] of Object.entries(rest)) {
        if (value === undefined || value === null) continue;
        fd.append(key, String(value));
    }
    // Empty string signals "clear" for a nullable FK field in form-encoded data.
    if (category !== undefined) fd.append("category", category ?? "");
    fd.append("cover_image", cover_image);
    for (const id of tag_ids ?? []) fd.append("tag_ids", id);
    return fd;
}

const multipart = { "Content-Type": "multipart/form-data" };

export const blogService = {
    getResources: async (): Promise<Resource[]> => {
        const { data } = await api.get("/resources/");
        return data.results ?? data;
    },

    getArticles: async (filters: ArticleFilters = {}): Promise<PaginatedResponse<Article>> => {
        const { data } = await api.get("/articles/", { params: { ...filters } });
        return data;
    },

    getArticle: async (slug: string): Promise<Article> => {
        const { data } = await api.get(`/articles/${slug}/`);
        return data;
    },

    getFeatured: async (params?: Record<string, unknown>): Promise<Article[]> => {
        const { data } = await api.get("/articles/", {
            params: { is_featured: true, published: true, page_size: 6, ...params }
        });
        return data.results ?? data;
    },

    likeArticle: async (slug: string) => {
        const { data } = await api.post(`/articles/${slug}/like/`);
        return data;
    },

    bookmarkArticle: async (slug: string) => {
        const { data } = await api.post(`/articles/${slug}/bookmark/`);
        return data;
    },

    getComments: async (articleId: string): Promise<Comment[]> => {
        const { data } = await api.get(`/comments/?article=${articleId}`);
        return data.results ?? data;
    },

    addComment: async (article: string, body: string, parent?: string) => {
        const { data } = await api.post(`/comments/`, { article, body, parent });
        return data;
    },

    getCategories: async (): Promise<Category[]> => {
        const { data } = await api.get("/categories/");
        return data.results ?? data;
    },

    getTags: async (): Promise<Tag[]> => {
        const { data } = await api.get("/tags/");
        return data.results ?? data;
    },

    createTag: async (name: string): Promise<Tag> => {
        const { data } = await api.post("/tags/", { name });
        return data;
    },

    createArticle: async (payload: ArticleWritePayload): Promise<Article> => {
        const body = buildArticleBody(payload);
        const headers = body instanceof FormData ? multipart : undefined;
        const { data } = await api.post("/articles/", body, { headers });
        return data;
    },

    updateArticle: async (slug: string, payload: Partial<ArticleWritePayload>): Promise<Article> => {
        const body = buildArticleBody(payload);
        const headers = body instanceof FormData ? multipart : undefined;
        const { data } = await api.patch(`/articles/${slug}/`, body, { headers });
        return data;
    },
};
