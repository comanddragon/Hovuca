import api from "@/lib/api";
import { Article, Comment, PaginatedResponse, Category, Tag } from "@/types";

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

export const blogService = {
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
};