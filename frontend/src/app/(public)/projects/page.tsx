import type { Metadata } from "next";
import ProjectsDirectory from "@/components/projects/ProjectsDirectory";
import styles from "@/components/projects/projects.module.css";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
    title: "Our Projects",
    description: "Explore HOVUCA’s documented projects, proposals and research on girls’ health, education, rights and community participation in Cameroon.",
    path: "/projects",
    keywords: ["HOVUCA projects", "Cameroon", "adolescent health", "community research", "girls’ rights"],
});

export default function ProjectsPage() {
    return <div className={styles.archive}>
        <JsonLd data={getBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }])} />
        <header className={styles.masthead}>
            <div className={`${styles.container} ${styles.mastheadInner}`}>
                <h1>Our projects.<br />Their purpose.<br />The evidence.</h1>
                <div><p>Explore the work behind HOVUCA’s commitment to young people’s health, education and rights in Cameroon.</p><p className={styles.introNote}>Read project proposals, implementation plans and research summaries. Each record makes clear what was planned and what its sources document.</p></div>
            </div>
        </header>
        <ProjectsDirectory />
    </div>;
}
