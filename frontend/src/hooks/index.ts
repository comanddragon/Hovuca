import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import {
    programsService,
    donationsService,
    coursesService,
    volunteersService,
    notificationsService,
    eventCategoryService,
    eventService,
    eventKeys,
    galleryAlbumService,
    galleryImageService,
    galleryKeys,
    type AlbumFilters,
    type ImageFilters,
} from "@/services";
import { blogService } from "@/services/blog.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { ChangePasswordPayload, DonationPayload, RegisterPayload, UpdateProfilePayload } from "@/types";
import { useArticleStore } from "@/store/article.store";
import type {
    EventCategory,
    EventDetail,
    EventWrite,
    EventRegistrationWrite,
    GalleryAlbumDetail,
    GalleryAlbumWrite,
    GalleryImageWrite,
} from "@/types";
import type { EventFilters } from "@/services";
import {
    donorOrganizationService,
    grantService,
    donorEngagementService,
    donorSummaryService,
    donorKeys,
} from "@/services/donors.service";
import type {
    DonorOrganizationFilters,
    GrantFilters,
    DonorEngagementFilters,
} from "@/types";
import type { GrantDetail } from "@/types";
import {keepPreviousData} from "@tanstack/query-core";


// ─── Query Keys ───────────────────────────────────────────────────────────────

export const keys = {
    me: ["me"] as const,
    articles: (f?: object) => ["articles", f] as const,
    adminArticles: (f?: object) => ["admin-articles", f] as const,
    article: (slug: string) => ["article", slug] as const,
    categories: ["categories"] as const,
    tags: ["tags"] as const,
    comments: (id: string) => ["comments", id] as const,
    resources: ["resources"] as const,
    programs: (f?: object) => ["programs", f] as const,
    program: (id: string) => ["program", id] as const,
    programProjects: (id: string) => ["program-projects", id] as const,
    projects: (f?: object) => ["projects", f] as const,
    project: (id: string) => ["project", id] as const,
    campaigns: (f?: object) => ["campaigns", f] as const,
    campaign: (slug: string) => ["campaign", slug] as const,
    myDonations: ["my-donations"] as const,
    courses: (f?: object) => ["courses", f] as const,
    course: (slug: string) => ["course", slug] as const,
    courseModules: (id: string) => ["course-modules", id] as const,
    enrollments: ["enrollments"] as const,
    quiz: (id: string) => ["quiz", id] as const,
    quizAttempts: (id: string) => ["quiz-attempts", id] as const,
    volunteerMe: ["volunteer-me"] as const,
    myTasks: ["my-tasks"] as const,
    notifications: ["notifications"] as const,
    unreadCount: ["unread-count"] as const,
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function useMe() {
    const { isAuthenticated, isHydrated } = useAuthStore();
    return useQuery({
        queryKey: keys.me,
        queryFn: authService.me,
        enabled: isHydrated && isAuthenticated,
        staleTime: 1000 * 60 * 10,
    });
}

export function useLogin() {
    const qc = useQueryClient();
    const { setUser } = useAuthStore();
    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            authService.login(email, password),
        onSuccess: async () => {
            const fullUser = await authService.me();
            setUser(fullUser);
            void qc.invalidateQueries({ queryKey: keys.me });
            toast.success("Welcome back!");
        },
        onError: () => toast.error("Invalid credentials. Please try again."),
    });
}

export function useRegister() {
    const { setUser } = useAuthStore();
    return useMutation({
        mutationFn: (payload: RegisterPayload) => authService.register(payload),
        onSuccess: (data) => {
            setUser(data.user);
            toast.success("Account created successfully!");
        },
        onError: () => toast.error("Registration failed. Please check your details."),
    });
}

export function useLogout() {
    const qc = useQueryClient();
    const { logout } = useAuthStore();
    return useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            logout();
            qc.clear();
            toast.success("Logged out successfully.");
        },
    });
}

export function useUpdateProfile() {
    const qc = useQueryClient();
    const { setUser } = useAuthStore();
    return useMutation({
        mutationFn: (payload: UpdateProfilePayload) => authService.updateProfile(payload),
        onSuccess: (data) => {
            const current = useAuthStore.getState().user;
            setUser({ ...current, ...data });
            qc.setQueryData(keys.me, data);
            toast.success("Profile updated.");
        },
        onError: () => toast.error("Failed to update profile."),
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: (payload: ChangePasswordPayload) => authService.changePassword(payload),
        onSuccess: () => toast.success("Password changed successfully."),
        onError: () => toast.error("Failed to change password. Check your current password."),
    });
}

// src/hooks/useAuth.ts (or same file you showed)

export function useForgotPassword() {
    return useMutation({
        mutationFn: (email: string) => authService.forgotPassword(email),
        onSuccess: () =>
            toast.success("If the email exists, a reset link has been sent."),
        onError: () =>
            toast.error("Something went wrong. Please try again."),
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: (payload: {
            uid: string;
            token: string;
            password: string;
        }) => authService.resetPassword(payload),
        onSuccess: () => {
            toast.success("Password reset successful. You can now login.");
        },
        onError: () =>
            toast.error("Invalid or expired reset link."),
    });
}
// ─── Blog ─────────────────────────────────────────────────────────────────────

export function useResources() {
    return useQuery({
        queryKey: keys.resources,
        queryFn: blogService.getResources,
        staleTime: 1000 * 60 * 30,
    });
}

export function useArticles(filters?: Parameters<typeof blogService.getArticles>[0]) {
    return useQuery({
        queryKey: keys.articles(filters),
        queryFn: () => blogService.getArticles(filters),
        placeholderData: keepPreviousData,
    });
}

// Admin/staff article list — same endpoint as useArticles, but the backend's
// get_queryset already returns every status (not just published) for
// admin/staff callers, so this just needs its own cache key to avoid mixing
// with the public-facing article list's cached results.
export function useAdminArticles(filters?: Parameters<typeof blogService.getArticles>[0]) {
    return useQuery({
        queryKey: keys.adminArticles(filters),
        queryFn: () => blogService.getArticles(filters),
        placeholderData: keepPreviousData,
    });
}

export function useArticle(slug: string) {
    return useQuery({
        queryKey: keys.article(slug),
        queryFn: () => blogService.getArticle(slug),
        enabled: !!slug,
    });
}

export function useFeaturedArticles() {
    return useQuery({
        queryKey: ["featured-articles"],
        queryFn: () => blogService.getFeatured(),
        staleTime: 1000 * 60 * 15,
    });
}

export function useCategories() {
    return useQuery({
        queryKey: keys.categories,
        queryFn: blogService.getCategories,
        staleTime: 1000 * 60 * 30,
    });
}

export function useTags() {
    return useQuery({
        queryKey: keys.tags,
        queryFn: blogService.getTags,
        staleTime: 1000 * 60 * 30,
    });
}

export function useCreateTag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => blogService.createTag(name),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: keys.tags });
        },
    });
}

export function useCreateArticle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: blogService.createArticle,
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ["admin-articles"] });
            void qc.invalidateQueries({ queryKey: ["articles"] });
            toast.success("Article created.");
        },
        onError: () => toast.error("Failed to create article."),
    });
}

export function useUpdateArticle(slug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Parameters<typeof blogService.updateArticle>[1]) =>
            blogService.updateArticle(slug, payload),
        onSuccess: (updated) => {
            qc.setQueryData(keys.article(slug), updated);
            void qc.invalidateQueries({ queryKey: ["admin-articles"] });
            void qc.invalidateQueries({ queryKey: ["articles"] });
            toast.success("Article saved.");
        },
        onError: () => toast.error("Failed to save article."),
    });
}

export function useComments(articleId: string) {
    return useQuery({
        queryKey: keys.comments(articleId),
        queryFn: () => blogService.getComments(articleId),
        enabled: !!articleId,
    });
}

export function useAddComment(articleId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ body, parent }: { body: string; parent?: string }) =>
            blogService.addComment(articleId, body, parent),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: keys.comments(articleId) });
            toast.success("Comment posted.");
        },
        onError: () => toast.error("Failed to post comment."),
    });
}

export function useLikeArticle() {
    const { toggleLike, confirmLike, revertLike, getSnapshot } = useArticleStore.getState();

    return useMutation({
        mutationFn: (slug: string) => blogService.likeArticle(slug),
        onMutate: (slug) => {
            const snap = getSnapshot(slug);
            toggleLike(slug);
            return { slug, snap };
        },
        onSuccess: (data, slug) => {
            confirmLike(slug, data.liked, data.like_count);
        },
        onError: (_err, _slug, context) => {
            if (context) revertLike(context.slug, context.snap);
            toast.error("Could not update like. Please try again.");
        },
    });
}

export function useBookmarkArticle() {
    const qc = useQueryClient();
    const { toggleBookmark, revertBookmark, getSnapshot } = useArticleStore.getState();

    return useMutation({
        mutationFn: (slug: string) => blogService.bookmarkArticle(slug),
        onMutate: (slug) => {
            const snap = getSnapshot(slug);
            toggleBookmark(slug);
            return { slug, snap };
        },
        onSuccess: (_, slug) => {
            void qc.invalidateQueries({ queryKey: keys.article(slug) });
            toast.success("Bookmark updated.");
        },
        onError: (_err, _slug, context) => {
            if (context) revertBookmark(context.slug, context.snap);
            toast.error("Could not update bookmark. Please try again.");
        },
    });
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export function usePrograms(params?: Record<string, string | number | boolean | undefined>) {
    return useQuery({
        queryKey: keys.programs(params),
        queryFn: () => programsService.getPrograms(params),
    });
}

export function useProgram(id: string) {
    return useQuery({
        queryKey: keys.program(id),
        queryFn: () => programsService.getProgram(id),
        enabled: !!id,
    });
}

export function useProgramProjects(programId: string) {
    return useQuery({
        queryKey: keys.programProjects(programId),
        queryFn: () => programsService.getProgramProjects(programId),
        enabled: !!programId,
    });
}

export function useProjects(params?: Record<string, string | number | boolean | undefined>) {
    return useQuery({
        queryKey: keys.projects(params),
        queryFn: () => programsService.getProjects(params),
        placeholderData: keepPreviousData,
    });
}

export function useProject(id: string) {
    return useQuery({
        queryKey: keys.project(id),
        queryFn: () => programsService.getProject(id),
        enabled: !!id,
    });
}

// ─── Donations ────────────────────────────────────────────────────────────────

export function useCampaigns(params?: Record<string, string>) {
    return useQuery({
        queryKey: keys.campaigns(params),
        queryFn: () => donationsService.getCampaigns(params),
    });
}

export function useCampaign(slug: string) {
    return useQuery({
        queryKey: keys.campaign(slug),
        queryFn: () => donationsService.getCampaign(slug),
        enabled: !!slug,
    });
}

export function useMyDonations() {
    const { isAuthenticated, isHydrated } = useAuthStore();
    return useQuery({
        queryKey: keys.myDonations,
        queryFn: donationsService.getMyDonations,
        enabled: isHydrated && isAuthenticated,
    });
}

export function useDonate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: DonationPayload) => donationsService.donate(payload),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ["campaigns"] });
            void qc.invalidateQueries({ queryKey: keys.myDonations });
            toast.success("Thank you for your donation! 🙏");
        },
        onError: () => toast.error("Donation failed. Please try again."),
    });
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export function useCourses(params?: Record<string, string>) {
    return useQuery({
        queryKey: keys.courses(params),
        queryFn: () => coursesService.getCourses(params),
    });
}

export function useCourse(slug: string) {
    return useQuery({
        queryKey: keys.course(slug),
        queryFn: () => coursesService.getCourse(slug),
        enabled: !!slug,
    });
}

export function useCourseModules(courseId: string) {
    return useQuery({
        queryKey: keys.courseModules(courseId),
        queryFn: () => coursesService.getCourseModules(courseId),
        enabled: !!courseId,
    });
}

export function useEnrollments() {
    const { isAuthenticated, isHydrated } = useAuthStore();
    return useQuery({
        queryKey: keys.enrollments,
        queryFn: coursesService.getMyEnrollments,
        enabled: isHydrated && isAuthenticated,
    });
}

export function useEnroll() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (courseSlug: string) => coursesService.enroll(courseSlug),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: keys.enrollments });
            toast.success("Enrolled successfully! Start learning.");
        },
        onError: () => toast.error("Enrollment failed."),
    });
}

export function useMarkChapterComplete() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (chapterId: string) => coursesService.markChapterComplete(chapterId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: keys.enrollments });
        },
    });
}

export function useQuiz(quizId: string) {
    return useQuery({
        queryKey: keys.quiz(quizId),
        queryFn: () => coursesService.getQuiz(quizId),
        enabled: !!quizId,
    });
}

export function useSubmitQuiz(quizId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (answers: { question: string; choice: string }[]) =>
            coursesService.submitQuiz(quizId, answers),
        onSuccess: (data) => {
            void qc.invalidateQueries({ queryKey: keys.quizAttempts(quizId) });
            toast.success(data.passed ? "Quiz passed! 🎉" : "Quiz submitted. Keep practicing!");
        },
        onError: () => toast.error("Failed to submit quiz."),
    });
}

// ─── Volunteers ───────────────────────────────────────────────────────────────

export function useVolunteerMe() {
    const { isAuthenticated, isHydrated, user } = useAuthStore();
    return useQuery({
        queryKey: keys.volunteerMe,
        queryFn: volunteersService.getMyProfile,
        enabled: isHydrated && isAuthenticated && user?.role === "volunteer",
        retry: false,
    });
}

export function useMyTasks() {
    const { isAuthenticated, isHydrated } = useAuthStore();
    return useQuery({
        queryKey: keys.myTasks,
        queryFn: volunteersService.getMyTasks,
        enabled: isHydrated && isAuthenticated,
    });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useNotifications() {
    const { isAuthenticated, isHydrated } = useAuthStore();
    return useQuery({
        queryKey: keys.notifications,
        queryFn: notificationsService.getAll,
        enabled: isHydrated && isAuthenticated,
        refetchInterval: false,
    });
}

export function useUnreadCount() {
    const { isAuthenticated, isHydrated } = useAuthStore();
    return useQuery({
        queryKey: keys.unreadCount,
        queryFn: notificationsService.getUnreadCount,
        enabled: isHydrated && isAuthenticated,
        refetchInterval: false,
    });
}

export function useMarkRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationsService.markRead(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: keys.notifications });
            void qc.invalidateQueries({ queryKey: keys.unreadCount });
        },
    });
}

export function useMarkAllRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: notificationsService.markAllRead,
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: keys.notifications });
            void qc.invalidateQueries({ queryKey: keys.unreadCount });
            toast.success("All notifications marked as read.");
        },
    });
}

// ─── Event Categories ─────────────────────────────────────────────────────────

export function useEventCategories(isActive?: boolean) {
    return useQuery({
        queryKey: eventKeys.categories.list(isActive),
        queryFn: () => eventCategoryService.list(isActive),
    });
}

export function useEventCategory(id: number) {
    return useQuery({
        queryKey: eventKeys.categories.detail(id),
        queryFn: () => eventCategoryService.get(id),
        enabled: !!id,
    });
}

export function useCreateEventCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<EventCategory>) => eventCategoryService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.categories.all }),
    });
}

export function useUpdateEventCategory(id: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<EventCategory>) => eventCategoryService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.categories.all }),
    });
}

export function useDeleteEventCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => eventCategoryService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.categories.all }),
    });
}

// ─── Events — queries ─────────────────────────────────────────────────────────

export function useEvents(filters: EventFilters = {}) {
    return useQuery({
        queryKey: eventKeys.list(filters),
        queryFn: () => eventService.list(filters),
    });
}

export function useFeaturedEvents() {
    return useQuery({
        queryKey: eventKeys.featured(),
        queryFn: () => eventService.featured(),
    });
}

export function useUpcomingEvents(limit = 6) {
    return useQuery({
        queryKey: eventKeys.upcoming(limit),
        queryFn: () => eventService.upcoming(limit),
    });
}

export function useEvent(slug: string) {
    return useQuery({
        queryKey: eventKeys.detail(slug),
        queryFn: () => eventService.get(slug),
        enabled: !!slug,
    });
}

// ─── Events — mutations ───────────────────────────────────────────────────────

export function useCreateEvent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: EventWrite) => eventService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.lists() }),
    });
}

export function useUpdateEvent(slug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<EventWrite>) => eventService.update(slug, data),
        onSuccess: (updated) => {
            qc.setQueryData<EventDetail>(eventKeys.detail(slug), updated);
            void qc.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
}

export function useDeleteEvent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (slug: string) => eventService.delete(slug),
        onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.lists() }),
    });
}

export function usePublishEvent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (slug: string) => eventService.publish(slug),
        onSuccess: (_data, slug) => {
            void qc.invalidateQueries({ queryKey: eventKeys.detail(slug) });
            void qc.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
}

export function useCancelEvent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (slug: string) => eventService.cancel(slug),
        onSuccess: (_data, slug) => {
            void qc.invalidateQueries({ queryKey: eventKeys.detail(slug) });
            void qc.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
}

// ─── Event Registrations ──────────────────────────────────────────────────────

export function useEventRegistrations(slug: string, status?: string) {
    return useQuery({
        queryKey: eventKeys.registrations(slug, status),
        queryFn: () => eventService.getRegistrations(slug, status),
        enabled: !!slug,
    });
}

export function useRegisterForEvent(slug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data?: EventRegistrationWrite) => eventService.register(slug, data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: eventKeys.detail(slug) });
            void qc.invalidateQueries({ queryKey: eventKeys.registrations(slug) });
        },
    });
}

export function useUnregisterFromEvent(slug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => eventService.unregister(slug),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: eventKeys.detail(slug) });
            void qc.invalidateQueries({ queryKey: eventKeys.registrations(slug) });
        },
    });
}

// ─── Gallery Albums — queries ─────────────────────────────────────────────────

export function useGalleryAlbums(filters: AlbumFilters = {}) {
    return useQuery({
        queryKey: galleryKeys.albums.list(filters),
        queryFn: () => galleryAlbumService.list(filters),
    });
}

export function useFeaturedAlbums() {
    return useQuery({
        queryKey: galleryKeys.albums.featured(),
        queryFn: () => galleryAlbumService.featured(),
    });
}

export function useGalleryAlbum(slug: string) {
    return useQuery({
        queryKey: galleryKeys.albums.detail(slug),
        queryFn: () => galleryAlbumService.get(slug),
        enabled: !!slug,
    });
}

// ─── Gallery Albums — mutations ───────────────────────────────────────────────

export function useCreateGalleryAlbum() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: GalleryAlbumWrite) => galleryAlbumService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: galleryKeys.albums.lists() }),
    });
}

export function useUpdateGalleryAlbum(slug: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<GalleryAlbumWrite>) => galleryAlbumService.update(slug, data),
        onSuccess: (updated) => {
            qc.setQueryData<GalleryAlbumDetail>(galleryKeys.albums.detail(slug), updated);
            void qc.invalidateQueries({ queryKey: galleryKeys.albums.lists() });
        },
    });
}

export function useDeleteGalleryAlbum() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (slug: string) => galleryAlbumService.delete(slug),
        onSuccess: () => qc.invalidateQueries({ queryKey: galleryKeys.albums.lists() }),
    });
}

export function useToggleAlbumPublish() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (slug: string) => galleryAlbumService.togglePublish(slug),
        onSuccess: (data, slug) => {
            qc.setQueryData<GalleryAlbumDetail>(
                galleryKeys.albums.detail(slug),
                (old) => (old ? { ...old, is_published: data.is_published } : old)
            );
            void qc.invalidateQueries({ queryKey: galleryKeys.albums.lists() });
        },
    });
}

// ─── Gallery Images — queries ─────────────────────────────────────────────────

export function useGalleryImages(filters: ImageFilters = {}) {
    return useQuery({
        queryKey: galleryKeys.images.list(filters),
        queryFn: () => galleryImageService.list(filters),
    });
}

export function useGalleryImage(id: number) {
    return useQuery({
        queryKey: galleryKeys.images.detail(id),
        queryFn: () => galleryImageService.get(id),
        enabled: !!id,
    });
}

// ─── Gallery Images — mutations ───────────────────────────────────────────────

export function useUploadGalleryImage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: GalleryImageWrite) => galleryImageService.create(data),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: galleryKeys.images.lists() });
            void qc.invalidateQueries({ queryKey: galleryKeys.albums.all() });
        },
    });
}

export function useUpdateGalleryImage(id: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<GalleryImageWrite>) => galleryImageService.update(id, data),
        onSuccess: (updated) => {
            qc.setQueryData(galleryKeys.images.detail(id), updated);
            void qc.invalidateQueries({ queryKey: galleryKeys.images.lists() });
        },
    });
}

export function useDeleteGalleryImage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => galleryImageService.delete(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: galleryKeys.images.lists() });
            void qc.invalidateQueries({ queryKey: galleryKeys.albums.all() });
        },
    });
}

// Add these hooks to src/hooks/index.ts
// ─── Donors ───────────────────────────────────────────────────────────────────


// ─── Organizations ────────────────────────────────────────────────────────────

export function useDonorOrganizations(filters: DonorOrganizationFilters = {}) {
    return useQuery({
        queryKey: donorKeys.organizations.list(filters),
        queryFn: () => donorOrganizationService.list(filters),
    });
}

/** Lightweight hook for the carousel — fetches active donors, all pages */
export function useActiveDonors() {
    return useQuery({
        queryKey: donorKeys.organizations.list({ status: "active", page_size: 100 }),
        queryFn: () =>
            donorOrganizationService.list({ status: "active", page_size: 100 }),
        staleTime: 1000 * 60 * 15, // 15 min — donor list changes rarely
        select: (data) => data.results,
    });
}

export function useDonorOrganization(id: string) {
    return useQuery({
        queryKey: donorKeys.organizations.detail(id),
        queryFn: () => donorOrganizationService.get(id),
        enabled: !!id,
    });
}

export function useDonorOrgGrants(
    orgId: string,
    params?: Pick<GrantFilters, "page" | "page_size">
) {
    return useQuery({
        queryKey: [...donorKeys.grants.byOrg(orgId), params],
        queryFn: () => donorOrganizationService.getGrants(orgId, params),
        enabled: !!orgId,
    });
}

export function useDonorOrgEngagements(
    orgId: string,
    params?: Pick<DonorEngagementFilters, "page" | "page_size">
) {
    return useQuery({
        queryKey: [...donorKeys.engagements.list({ organization: orgId }), params],
        queryFn: () => donorOrganizationService.getEngagements(orgId, params),
        enabled: !!orgId,
    });
}

export function useDonorOrgContacts(orgId: string) {
    return useQuery({
        queryKey: donorKeys.contacts.byOrg(orgId),
        queryFn: () => donorOrganizationService.getContacts(orgId),
        enabled: !!orgId,
    });
}

export function useRecalculateDonor() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => donorOrganizationService.recalculate(id),
        onSuccess: (_, id) => {
            void qc.invalidateQueries({ queryKey: donorKeys.organizations.detail(id) });
            void qc.invalidateQueries({ queryKey: donorKeys.organizations.lists() });
            toast.success("Donor totals recalculated.");
        },
        onError: () => toast.error("Failed to recalculate donor totals."),
    });
}

// ─── Grants ───────────────────────────────────────────────────────────────────

export function useGrants(filters: GrantFilters = {}) {
    return useQuery({
        queryKey: donorKeys.grants.list(filters),
        queryFn: () => grantService.list(filters),
    });
}

export function useGrant(id: string) {
    return useQuery({
        queryKey: donorKeys.grants.detail(id),
        queryFn: () => grantService.get(id),
        enabled: !!id,
    });
}

export function useCompleteGrant() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => grantService.complete(id),
        onSuccess: (data: GrantDetail) => {
            qc.setQueryData<GrantDetail>(donorKeys.grants.detail(data.id), data);
            void qc.invalidateQueries({ queryKey: donorKeys.grants.lists() });
            void qc.invalidateQueries({
                queryKey: donorKeys.organizations.detail(data.donor_organization),
            });
            toast.success("Grant marked as completed.");
        },
        onError: () => toast.error("Failed to complete grant."),
    });
}

export function useSubmitGrantReport() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => grantService.submitReport(id),
        onSuccess: (_, id) => {
            void qc.invalidateQueries({ queryKey: donorKeys.grants.detail(id) });
            toast.success("Report marked as submitted.");
        },
        onError: () => toast.error("Failed to submit report."),
    });
}

// ─── Engagements ──────────────────────────────────────────────────────────────

export function useDonorEngagements(filters: DonorEngagementFilters = {}) {
    return useQuery({
        queryKey: donorKeys.engagements.list(filters),
        queryFn: () => donorEngagementService.list(filters),
    });
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function useDonorSummary() {
    return useQuery({
        queryKey: donorKeys.summary(),
        queryFn: donorSummaryService.get,
        staleTime: 1000 * 60 * 5,
    });
}
