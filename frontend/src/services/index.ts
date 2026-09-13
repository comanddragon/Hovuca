import api from "@/lib/api";
import {
    Program, Project, PaginatedResponse,
    DonationCampaign, Donation, DonationPayload,
    Course, Module, Chapter, Enrollment, Quiz, QuizAttempt,
    VolunteerProfile, VolunteerTask,
    Notification,
} from "@/types";

// ─── Programs ─────────────────────────────────────────────────────────────────

export const programsService = {
    getPrograms: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Program>> => {
        const { data } = await api.get("/programs/", { params:{ status: "active", page_size: 5, ...params} });
        return data;
    },

    getProgram: async (id: string): Promise<Program> => {
        const { data } = await api.get(`/programs/${id}/`);
        return data;
    },

    getProgramProjects: async (id: string): Promise<Project[]> => {
        const { data } = await api.get(`/programs/${id}/projects/`);
        return data;
    },

    getProjects: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Project>> => {
        const { data } = await api.get("/projects/", { params:{...params} });
        return data;
    },

    getProject: async (id: string): Promise<Project> => {
        const { data } = await api.get(`/projects/${id}/`);
        return data;
    },
};

// ─── Donations ────────────────────────────────────────────────────────────────

export const donationsService = {
    getCampaigns: async (params?: Record<string, string>): Promise<PaginatedResponse<DonationCampaign>> => {
        const q = new URLSearchParams(params).toString();
        const { data } = await api.get(`/campaigns/${q ? `?${q}` : ""}`);
        return data;
    },

    getCampaign: async (slug: string): Promise<DonationCampaign> => {
        const { data } = await api.get(`/campaigns/${slug}/`);
        return data;
    },

    donate: async (payload: DonationPayload): Promise<Donation> => {
        const { data } = await api.post("/donations/", payload);
        return data;
    },

    getMyDonations: async (): Promise<PaginatedResponse<Donation>> => {
        const { data } = await api.get("/donations/?my=true");
        return data;
    },
};

// ─── E-Learning ───────────────────────────────────────────────────────────────

export const coursesService = {
    getCourses: async (params?: Record<string, string>): Promise<PaginatedResponse<Course>> => {
        const q = new URLSearchParams(params).toString();
        const { data } = await api.get(`/courses/${q ? `?${q}` : ""}`);
        return data;
    },

    getCourse: async (slug: string): Promise<Course> => {
        const { data } = await api.get(`/courses/${slug}/`);
        return data;
    },

    getChapter: async (chapterId: string): Promise<Chapter> => {
        const { data } = await api.get(`/chapters/${chapterId}/`);
        return data;
    },

    getCourseModules: async (courseId: string): Promise<Module[]> => {
        const { data } = await api.get<PaginatedResponse<Module>>(`/modules/?course=${courseId}&page_size=100`);
        return data.results;
    },

    enroll: async (courseSlug: string): Promise<Enrollment> => {
        const { data } = await api.post(`/courses/${courseSlug}/enroll/`);
        return data;
    },

    getMyEnrollments: async (): Promise<PaginatedResponse<Enrollment>> => {
        const { data } = await api.get("/enrollments/");
        return data;
    },

    markChapterComplete: async (chapterId: string) => {
        const { data } = await api.post(`/chapters/${chapterId}/complete/`);
        return data;
    },

    getQuiz: async (quizId: string): Promise<Quiz> => {
        const { data } = await api.get(`/quizzes/${quizId}/`);
        return data;
    },

    submitQuiz: async (quizId: string, answers: { question: string; choice: string }[]): Promise<QuizAttempt> => {
        const { data } = await api.post(`/quizzes/${quizId}/submit/`, { answers });
        return data;
    },

    getMyAttempts: async (quizId: string): Promise<QuizAttempt[]> => {
        const { data } = await api.get(`/quizzes/${quizId}/attempts/`);
        return data;
    },
};

// ─── Volunteers ───────────────────────────────────────────────────────────────

export const volunteersService = {
    getMyProfile: async (): Promise<VolunteerProfile> => {
        const { data } = await api.get("/volunteers/me/");
        return data;
    },

    createProfile: async (payload: Partial<VolunteerProfile>) => {
        const { data } = await api.post("/volunteers/", payload);
        return data;
    },

    updateProfile: async (id: string, payload: Partial<VolunteerProfile>) => {
        const { data } = await api.patch(`/volunteers/${id}/`, payload);
        return data;
    },

    getMyTasks: async (): Promise<PaginatedResponse<VolunteerTask>> => {
        const { data } = await api.get("/volunteer-tasks/");
        return data;
    },
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsService = {
    getAll: async (): Promise<PaginatedResponse<Notification>> => {
        const { data } = await api.get("/notifications/");
        return data;
    },

    markRead: async (id: string) => {
        const { data } = await api.post(`/notifications/${id}/mark_read/`);
        return data;
    },

    markAllRead: async () => {
        const { data } = await api.post("/notifications/mark_all_read/");
        return data;
    },

    getUnreadCount: async (): Promise<number> => {
        const { data } = await api.get("/notifications/unread_count/");
        return data.count ?? 0;
    },
};

export * from "./auth.service";
export * from "./blog.service";
export * from "./events.service";
export * from "./gallery.service";
export * from "./donors.service";
