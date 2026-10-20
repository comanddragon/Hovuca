import api from "@/lib/api";
import { LoginResponse, RegisterPayload, User, ChangePasswordPayload, UpdateProfilePayload } from "@/types";

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const { data } = await api.post<LoginResponse>("/auth/login/", { email, password });
        return data;
    },

    register: async (payload: RegisterPayload) => {
        const { data } = await api.post("/auth/register/", payload);
        return data;
    },

    logout: async () => {
        // The gateway clears local HttpOnly cookies even when the upstream
        // refresh token has already expired. Logout should therefore always
        // complete locally instead of leaving stale UI state behind.
        try {
            await api.post("/auth/logout/");
        } catch {
            return;
        }
    },

    me: async (): Promise<User> => {
        const { data } = await api.get<User>("/auth/me/");
        return data;
    },

    updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined) formData.append(key, value as string | Blob);
        });
        const { data } = await api.patch<User>("/auth/me/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },

    changePassword: async (payload: ChangePasswordPayload) => {
        const { data } = await api.post("/auth/change-password/", payload);
        return data;
    },

    forgotPassword: async (email: string) => {
        const { data } = await api.post("/auth/forgot-password/", { email });
        return data;
    },

    resetPassword: async (payload: {
        uid: string;
        token: string;
        password: string;
    }) => {
        const { data } = await api.post("/auth/reset-password/", payload);
        return data;
    },
};
