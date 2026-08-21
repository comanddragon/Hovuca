// hooks/usePagination.ts
export function usePagination(count: number | undefined, pageSize: number, currentPage: number) {
    const totalPages = count ? Math.ceil(count / pageSize) : 1;
    const delta = 2;
    const pages: (number | "...")[] = [];

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== "...") {
            pages.push("...");
        }
    }

    return { totalPages, pages };
}