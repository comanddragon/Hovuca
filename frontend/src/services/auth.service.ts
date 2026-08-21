import api from "@/lib/api";
import { LoginResponse, RegisterPayload, User, ChangePasswordPayload, UpdateProfilePayload } from "@/types";
import Cookies from "js-cookie";

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const { data } = await api.post<LoginResponse>("/auth/login/", { email, password });
        Cookies.set("access_token", data.access, {
            expires: 1,
            path: "/",
            sameSite: "lax",
        });
        Cookies.set("refresh_token", data.refresh, {
            expires: 7,
            path: "/",
            sameSite: "lax",
        });
        return data;
    },

    register: async (payload: RegisterPayload) => {
        const { data } = await api.post("/auth/register/", payload);
        Cookies.set("access_token", data.tokens.access, {
            expires: 1,
            path: "/",
            sameSite: "lax",
        });
        Cookies.set("refresh_token", data.tokens.refresh, {
            expires: 1,
            path: "/",
            sameSite: "lax",
        });
        return data;
    },

    logout: async () => {
        const refresh = Cookies.get("refresh_token");
        try {
            await api.post("/auth/logout/", { refresh });
        } finally {
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
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