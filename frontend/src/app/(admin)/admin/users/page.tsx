import { Suspense } from "react";
import { AdminResourcePage } from "@/components/admin/AdminResourcePage";
import { AdminSkeleton } from "@/components/admin/AdminStates";

export default function UsersPage() {
    return <Suspense fallback={<AdminSkeleton />}><AdminResourcePage section="users" /></Suspense>;
}
