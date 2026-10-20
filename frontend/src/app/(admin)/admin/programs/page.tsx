import { Suspense } from "react";
import { AdminResourcePage } from "@/components/admin/AdminResourcePage";
import { AdminSkeleton } from "@/components/admin/AdminStates";

export default function ProgramsPage() {
    return <Suspense fallback={<AdminSkeleton />}><AdminResourcePage section="programs" /></Suspense>;
}
