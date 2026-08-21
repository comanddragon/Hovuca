/**
 * article.store.ts
 * ================
 * Manages optimistic like/bookmark state for articles.
 * Seeded from the API's `is_liked` / `is_bookmarked` / `like_count` fields.
 */

import { create } from "zustand";

interface ArticleInteraction {
    liked: boolean;
    bookmarked: boolean;
    likeCount: number;
}

interface ArticleState {
    interactions: Record<string, ArticleInteraction>;

    /** Sync from server — call whenever article query data arrives. */
    syncFromServer: (slug: string, liked: boolean, bookmarked: boolean, likeCount: number) => void;

    /** Snapshot before toggle so we can revert cleanly. */
    getSnapshot: (slug: string) => ArticleInteraction;

    toggleLike: (slug: string) => void;
    confirmLike: (slug: string, liked: boolean, likeCount: number) => void;
    revertLike: (slug: string, snap: ArticleInteraction) => void;

    toggleBookmark: (slug: string) => void;
    revertBookmark: (slug: string, snap: ArticleInteraction) => void;

    clearArticle: (slug: string) => void;
}

// Module-level constant — never recreated, keeps Zustand getSnapshot stable
const DEFAULT_INTERACTION: ArticleInteraction = Object.freeze({
    liked: false,
    bookmarked: false,
    likeCount: 0,
});

export const useArticleStore = create<ArticleState>()((set, get) => ({
    interactions: {},

    syncFromServer: (slug, liked, bookmarked, likeCount) =>
        set((s) => ({
            interactions: {
                ...s.interactions,
                [slug]: { liked, bookmarked, likeCount },
            },
        })),

    getSnapshot: (slug) =>
        get().interactions[slug] ?? DEFAULT_INTERACTION,

    // ── Like ─────────────────────────────────────────────────────────────────

    toggleLike: (slug) =>
        set((s) => {
            const cur = s.interactions[slug] ?? DEFAULT_INTERACTION;
            const nowLiked = !cur.liked;
            return {
                interactions: {
                    ...s.interactions,
                    [slug]: {
                        ...cur,
                        liked: nowLiked,
                        likeCount: Math.max(0, cur.likeCount + (nowLiked ? 1 : -1)),
                    },
                },
            };
        }),

    confirmLike: (slug, liked, likeCount) =>
        set((s) => ({
            interactions: {
                ...s.interactions,
                [slug]: { ...(s.interactions[slug] ?? DEFAULT_INTERACTION), liked, likeCount },
            },
        })),

    revertLike: (slug, snap) =>
        set((s) => ({
            interactions: { ...s.interactions, [slug]: snap },
        })),

    // ── Bookmark ─────────────────────────────────────────────────────────────

    toggleBookmark: (slug) =>
        set((s) => {
            const cur = s.interactions[slug] ?? DEFAULT_INTERACTION;
            return {
                interactions: {
                    ...s.interactions,
                    [slug]: { ...cur, bookmarked: !cur.bookmarked },
                },
            };
        }),

    revertBookmark: (slug, snap) =>
        set((s) => ({
            interactions: { ...s.interactions, [slug]: snap },
        })),

    // ── Cleanup ───────────────────────────────────────────────────────────────

    clearArticle: (slug) =>
        set((s) => {
            const next = { ...s.interactions };
            delete next[slug];
            return { interactions: next };
        }),
}));

// ─── Selector — stable reference for articles not yet in store ────────────────

export function useArticleInteraction(slug: string): ArticleInteraction {
    return useArticleStore((s) => s.interactions[slug] ?? DEFAULT_INTERACTION);
}