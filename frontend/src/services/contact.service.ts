import api from "@/lib/api";

export interface ContactMessagePayload {
    full_name: string;
    email: string;
    phone: string;
    topic: "general" | "partnership" | "volunteering" | "donations";
    subject: string;
    message: string;
    contact_consent: boolean;
}

export const contactService = {
    submit: async (payload: ContactMessagePayload): Promise<{ id: string; status: string }> => {
        const { data } = await api.post("/contact-messages/", payload);
        return data;
    },
};
