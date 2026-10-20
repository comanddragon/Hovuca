"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useProject } from "@/hooks";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/types";
import { evidenceLabel, projectStatuses } from "./project-labels";
import styles from "./projects.module.css";

export function ProjectDetailView({ initialProject }: { initialProject?: Project }) {
    const { slug } = useParams<{ slug: string }>();
    const { data: project, isLoading, isError, refetch, isFetching, error } = useProject(slug, initialProject);
    const missing = (error as { response?: { status?: number } } | null)?.response?.status === 404;
    if (isLoading) return <div className={`${styles.archive} ${styles.message}`} role="status">Loading project summary…</div>;
    if (isError || !project) return <div className={`${styles.archive} ${styles.message}`} role="alert">
        <h1>{missing ? "Project not found" : "We couldn’t load this project."}</h1>
        <p>{missing ? "This record may have moved or is no longer available." : "Please try again to read the project summary."}</p>
        {!missing && <button className={styles.button} disabled={isFetching} onClick={() => refetch()}>Try again</button>}
        <Link className={styles.readLink} href="/projects"><ArrowLeft size={18} aria-hidden="true" />Browse all projects</Link>
    </div>;

    return <article className={styles.archive}>
        <header className={styles.detailHero}>
            <div className={styles.container}>
                <Link className={styles.backLink} href="/projects"><ArrowLeft size={18} aria-hidden="true" />All projects</Link>
                <h1>{project.title}</h1>
                {project.excerpt && <p className={styles.abstract}>{project.excerpt}</p>}
                <div className={styles.heroMeta}><span>{evidenceLabel(project)}</span>{project.source_year && <span>{project.source_year}</span>}</div>
            </div>
        </header>
        {project.cover_image && <div className={`${styles.container} ${styles.cover}`}><Image src={project.cover_image} alt={project.cover_image_alt || project.title} width={1280} height={720} sizes="(max-width: 1280px) 100vw, 1280px" /></div>}
        <div className={`${styles.container} ${styles.detailGrid}`}>
            <div className={styles.prose}>
                <h2 id="project-overview">Project overview</h2>
                {project.description ? <ReactMarkdown skipHtml>{project.description}</ReactMarkdown> : <p>A full project description will be added when available.</p>}
                {!!project.activities?.length && <section className={styles.activities} aria-labelledby="activities-heading">
                    <h2 id="activities-heading">Project activities</h2>
                    <p>Activities are labelled according to what the source documents establish.</p>
                    <ol>{project.activities.map(activity => <li key={activity.id}>
                        <h3>{activity.title}</h3>
                        <div className={styles.activityMeta}><span>{activity.evidence_status === "reported" ? "Reported in source" : "Planned in source"}</span>{activity.period && <span>{activity.period}</span>}</div>
                        <p>{activity.description}</p>
                    </li>)}</ol>
                </section>}
                {project.evidence_notes && <section className={styles.evidenceNote} aria-labelledby="evidence-heading"><h2 id="evidence-heading">About the evidence</h2><p>{project.evidence_notes}</p></section>}
            </div>
            <aside className={styles.facts} aria-label="Project facts and sources">
                <h2>Project record</h2>
                <dl>
                    {project.location && <><dt>Location</dt><dd>{project.location}</dd></>}
                    {project.reporting_period && <><dt>Documented period</dt><dd>{project.reporting_period}</dd></>}
                    <dt>Record type</dt><dd>{evidenceLabel(project)}</dd>
                    <dt>{project.evidence_type === "proposal" || project.evidence_type === "plan" ? "Recorded project status" : "Status"}</dt><dd>{projectStatuses[project.status]}</dd>
                    {project.start_date && <><dt>{project.evidence_type === "proposal" ? "Proposed start" : "Start date"}</dt><dd>{formatDate(project.start_date)}</dd></>}
                    {project.end_date && <><dt>{project.evidence_type === "proposal" ? "Proposed end" : "End date"}</dt><dd>{formatDate(project.end_date)}</dd></>}
                </dl>
                {!!project.source_documents?.length && <section className={styles.sources}><h3>Source documents</h3><ul>{project.source_documents.map(source => <li key={source}>{source.split("/").pop()}</li>)}</ul><p>Summarised from HOVUCA’s project archive.</p></section>}
                <Link className={styles.readLink} href="/contact">Ask about this project <ArrowUpRight size={18} aria-hidden="true" /></Link>
            </aside>
        </div>
        <div className={`${styles.container} ${styles.detailEnd}`}><Link className={styles.readLink} href="/projects"><ArrowLeft size={18} aria-hidden="true" />Continue exploring projects</Link></div>
    </article>;
}

export default ProjectDetailView;
