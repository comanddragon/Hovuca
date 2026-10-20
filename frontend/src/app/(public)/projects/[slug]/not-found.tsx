import Link from "next/link";
import styles from "@/components/projects/projects.module.css";

export default function ProjectNotFound() {
    return <section className={`${styles.archive} ${styles.container} ${styles.message}`}>
        <h1>Project not found</h1>
        <p>This record may have moved or is no longer available.</p>
        <Link className={styles.readLink} href="/projects">Browse all projects</Link>
    </section>;
}
