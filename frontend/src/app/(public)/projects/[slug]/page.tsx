"use client";

import { useParams } from "next/navigation";
import {useProject} from "@/hooks";
import { PageLoader, StatusBadge } from "@/components/shared";
import { formatDate } from "@/lib/utils";
import { Calendar, Users } from "lucide-react";
import Image from "next/image";

export default function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = useProject(slug);

  if (isLoading) return <PageLoader />;
  if (!project) return <div className="p-8 text-center text-muted-foreground">Program not found.</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="relative h-56 mb-8 overflow-hidden rounded-2xl">
        {project.cover_image ? (
          <Image src={project.cover_image} alt={project.title} fill unoptimized loading="eager" className="object-cover" />
        ) : (
          <div className="h-56 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <div className="mb-2"><StatusBadge status={project.status} /></div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">{project.title}</h1>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="mb-3 font-display text-xl font-bold text-foreground">About this Project</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </div>

          {/* Projects */}

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
                  <p className="font-medium text-foreground">{formatDate(project.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">End date</p>
                  <p className="font-medium text-foreground">{formatDate(project.end_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                {/*<div>*/}
                {/*  <p className="text-xs text-muted-foreground">Target beneficiaries</p>*/}
                {/*  <p className="font-medium text-foreground">{project.target_beneficiaries.toLocaleString()}</p>*/}
                {/*</div>*/}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
