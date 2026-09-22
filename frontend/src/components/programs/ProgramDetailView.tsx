"use client";

import { useParams } from "next/navigation";
import { useProgram, useProgramProjects } from "@/hooks";
import { PageLoader, StatusBadge } from "@/components/shared";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getInitials } from "@/lib/utils";
import { Calendar, Users, Layers, DollarSign } from "lucide-react";
import Image from "next/image";

export function ProgramDetailView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: program, isLoading } = useProgram(slug);
  const { data: projects = [] } = useProgramProjects(slug);

  if (isLoading) return <PageLoader />;
  if (!program) return <div className="p-8 text-center text-muted-foreground">Program not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="relative h-56 mb-8 overflow-hidden rounded-2xl">
        {program.banner ? (
          <Image src={program.banner} alt={program.title} fill unoptimized loading="eager" className="object-cover" />
        ) : (
          <div className="h-56 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <div className="mb-2"><StatusBadge status={program.status} /></div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{program.title}</h1>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="mb-3 font-display text-xl font-bold text-foreground">About this Program</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{program.description}</p>
          </div>

          {/* Projects */}
          <div>
            <h2 className="mb-4 font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Projects ({projects.length})
            </h2>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects listed yet.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{project.title}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {project.lead && (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={getAvatarUrl(project.lead.avatar) ?? undefined} />
                            <AvatarFallback className="text-[9px]">{getInitials(project.lead.full_name)}</AvatarFallback>
                          </Avatar>
                          {project.lead.full_name}
                        </div>
                      )}
                      {project.start_date && (
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(project.start_date)}</span>
                      )}
                      <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${Number(project.budget).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar stats */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-display font-semibold text-foreground">Program Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Start date</p>
                  <p className="font-medium text-foreground">{formatDate(program.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">End date</p>
                  <p className="font-medium text-foreground">{formatDate(program.end_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Target beneficiaries</p>
                  <p className="font-medium text-foreground">{program.target_beneficiaries.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Projects</p>
                  <p className="font-medium text-foreground">{projects.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgramDetailView;
