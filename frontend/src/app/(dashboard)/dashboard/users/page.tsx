"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SectionHeader, StatusBadge, PageLoader, EmptyState } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAvatarUrl, getInitials, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Users, UserCheck, UserX} from "lucide-react";
import { User, PaginatedResponse, UserRole } from "@/types";
import { useAuthStore } from "@/store/auth.store";
import { redirect } from "next/navigation";

const ROLES: UserRole[] = ["admin", "staff", "volunteer", "student", "donor"];

function useUsers(params: Record<string, string>) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ["admin-users", params],
    queryFn: async () => {
      const q = new URLSearchParams(params).toString();
      const { data } = await api.get(`/users/?${q}`);
      return data;
    },
  });
}

function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/deactivate/`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User deactivated."); },
    onError: () => toast.error("Failed to deactivate user."),
  });
}

function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/activate/`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User activated."); },
    onError: () => toast.error("Failed to activate user."),
  });
}

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useUsers({
    ...(search && { search }),
    ...(role && { role }),
    ...(isActive && { is_active: isActive }),
    page: String(page),
  });

  const { mutate: deactivate, isPending: deactivating } = useDeactivateUser();
  const { mutate: activate, isPending: activating } = useActivateUser();

  // Guard — admin/staff only
  if (user && !["admin", "staff"].includes(user.role)) {
    redirect("/dashboard");
  }

  if (isLoading) return <PageLoader />;

  const users = data?.results ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="User Management"
        description={`${data?.count ?? 0} total users`}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <Select value={role} onValueChange={(v) => { setRole(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={isActive} onValueChange={(v) => { setIsActive(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No users found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={getAvatarUrl(u.avatar) ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(u.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{u.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={u.role} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {u.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user?.id !== u.id && (
                      u.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={deactivating}
                          onClick={() => deactivate(u.id)}
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline ml-1.5">Deactivate</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-600"
                          disabled={activating}
                          onClick={() => activate(u.id)}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline ml-1.5">Activate</span>
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {(data?.next || data?.previous) && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {users.length} of {data?.count} users
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={!data?.previous} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={!data?.next} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
