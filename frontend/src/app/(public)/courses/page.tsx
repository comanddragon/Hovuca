"use client";

import { useDeferredValue, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useCourses } from "@/hooks";
import type { CourseLevel } from "@/types";
import styles from "./course-handbook.module.css";

const LEVELS: Array<{ value: "" | CourseLevel; label: string }> = [
  { value: "", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<"" | CourseLevel>("");
  const deferredSearch = useDeferredValue(search.trim());
  const { data, isLoading, isError } = useCourses({
    ...(deferredSearch && { search: deferredSearch }),
    ...(difficulty && { difficulty }),
  });
  const courses = data?.results ?? [];

  return (
    <div className={styles.page}>
      <section className={styles.indexHero}>
        <div className={styles.indexHeroCopy}>
          <p className={styles.eyebrow}>HOVUCA learning library</p>
          <h1 className={styles.indexTitle}>Field handbooks for everyday life.</h1>
          <p className={styles.indexIntro}>
            Practical, age-aware courses built for young people, families, facilitators, and community partners across Cameroon.
          </p>
        </div>
        <div className={styles.indexHeroPhoto}>
          <Image
            src="/assets/plates/course-hero-photo.png"
            alt="A HOVUCA facilitator learning alongside young people"
            fill
            priority
            loading="eager"
            unoptimized
            sizes="(max-width: 760px) 100vw, 40vw"
          />
        </div>
      </section>

      <section className={styles.catalog} aria-labelledby="course-index-heading">
        <div className={styles.catalogTools}>
          <div>
            <label className={styles.searchLabel} htmlFor="course-search">Search the library</label>
            <input
              id="course-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={styles.searchInput}
              placeholder="Topic, skill, or course title"
            />
          </div>
          <div className={styles.filterRow} aria-label="Filter courses by level">
            {LEVELS.map((level) => (
              <button
                key={level.value || "all"}
                type="button"
                aria-pressed={difficulty === level.value}
                onClick={() => setDifficulty(level.value)}
                className={`${styles.filterButton} ${difficulty === level.value ? styles.filterButtonActive : ""}`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <p id="course-index-heading" className={styles.catalogCount} aria-live="polite">
          {isLoading ? "Opening the course register…" : `${courses.length} ${courses.length === 1 ? "handbook" : "handbooks"} available`}
        </p>

        <div className={styles.courseIndex}>
          {isLoading ? (
            <div className={styles.loadingPage} aria-label="Loading courses">
              <div className={styles.loadingKicker} />
              <div className={styles.loadingRule} />
              <div className={styles.loadingTitle} />
            </div>
          ) : isError ? (
            <div className={styles.emptyCatalog}>
              <h2>The library could not be opened.</h2>
              <p>Please refresh the page or try again in a moment.</p>
            </div>
          ) : courses.length === 0 ? (
            <div className={styles.emptyCatalog}>
              <h2>No handbooks match that search.</h2>
              <p>Clear a filter or try a broader topic.</p>
            </div>
          ) : (
            courses.map((course, index) => (
              <Link key={course.id} href={`/courses/${course.slug}`} className={styles.courseRow}>
                <span className={styles.courseFolio}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p className={styles.courseSubject}>{course.subject?.name ?? "Community learning"}</p>
                  <h2 className={styles.courseName}>{course.title}</h2>
                </div>
                <p className={styles.courseExcerpt}>{plainText(course.description)}</p>
                <div className={styles.courseMeta}>
                  <span>{course.estimated_hours} hours</span>
                  <span>{course.is_free ? "Free" : course.difficulty}</span>
                </div>
                <ArrowUpRight size={22} aria-hidden="true" />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
