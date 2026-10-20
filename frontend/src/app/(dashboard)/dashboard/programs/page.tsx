"use client";

import { useState } from "react";
import { usePrograms } from "@/hooks";
import { SectionHeader, StatusBadge, PageLoader, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, type Resolver } from "react-hook-form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Plus, Target, Users, Calendar, Search } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { redirect } from "next/navigation";

const programSchema = z.object({
    title: z.string().min(1, "Required"),
    description: z.string().optional(),
    status: z.enum(["draft", "active", "completed", "cancelled"]),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    target_beneficiaries: z.coerce.number().min(0),
});
type ProgramForm = z.infer<typeof programSchema>;

function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProgramForm) => api.post("/programs/", data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program created.");
    },
    onError: () => toast.error("Failed to create program."),
  });
}

export default function AdminProgramsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = usePrograms({
    ...(search && { search }),
    ...(status && status !== "all" && { status }),
  });
  const { mutate: createProgram, isPending: creating } = useCreateProgram();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ProgramForm>({
        resolver: zodResolver(programSchema) as Resolver<ProgramForm>,
        defaultValues: { status: "draft", target_beneficiaries: 0 },
    });

  if (user && !["admin", "staff"].includes(user.role)) redirect("/dashboard");
  if (isLoading) return <PageLoader />;

  const programs = data?.results ?? [];

  const onSubmit = (data: ProgramForm) => {
    createProgram(data, {
      onSuccess: () => { setShowCreate(false); reset(); },
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Programs"
        description={`${data?.count ?? 0} programs total`}
        action={
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New program
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search programs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {["draft", "active", "completed", "cancelled"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {programs.length === 0 ? (
        <EmptyState
          icon={<Target className="h-12 w-12" />}
          title="No programs found"
          action={<Button onClick={() => setShowCreate(true)}>Create your first program</Button>}
        />
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <div key={program.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">{program.title}</h3>
                  <StatusBadge status={program.status} />
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(program.start_date)} → {formatDate(program.end_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {program.target_beneficiaries.toLocaleString()} beneficiaries
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/programs/${program.id}`}>View</Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">New Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Program title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="Brief description" {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input type="date" {...register("start_date")} />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input type="date" {...register("end_date")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  {...register("status")}
                  className="flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {["draft", "active", "completed", "cancelled"].map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Target beneficiaries</Label>
                <Input type="number" min={0} {...register("target_beneficiaries")} />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create program"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
