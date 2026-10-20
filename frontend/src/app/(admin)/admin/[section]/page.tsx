import { Suspense } from "react";
import { AdminResourcePage } from "@/components/admin/AdminResourcePage";
import { AdminSkeleton } from "@/components/admin/AdminStates";

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
    const { section } = await params;
    return <Suspense fallback={<AdminSkeleton />}><AdminResourcePage section={section} /></Suspense>;
}
