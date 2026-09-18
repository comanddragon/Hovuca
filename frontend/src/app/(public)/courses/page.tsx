"use client";

import { useDeferredValue, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useCourse, useCourses } from "@/hooks";
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
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const { data, isLoading, isError } = useCourses({ page_size: "100" });
  const { data: cseCourse } = useCourse("cse");
  const courses = data?.results ?? [];
  const featured = cseCourse ?? courses.find((course) => course.slug === "cse" || course.slug === "cse-training");
  const otherCourses = courses.filter((course) => course.id !== featured?.id);
  const filteredCourses = otherCourses.filter((course) =>
    (!difficulty || course.difficulty === difficulty) &&
    (!deferredSearch || `${course.title} ${plainText(course.description)} ${course.subject?.name ?? ""}`.toLowerCase().includes(deferredSearch)),
  );

  return (
    <div className={styles.page}>
      <section className={styles.featureStage} aria-labelledby="course-feature-heading">
        <div className={styles.featureCopy}>
          <p className={styles.featureLabel}>HOVUCA flagship course</p>
          <h1 id="course-feature-heading" className={styles.featureTitle}>
            {featured?.title.replace(/\s+Training$/i, "") ?? "Comprehensive Sexuality Education"}
          </h1>
          <p className={styles.featureDescription}>
            {featured ? plainText(featured.description) : "Explore relationships, sexual and reproductive health, life skills, gender and rights through HOVUCA’s learning programme."}
          </p>
          {featured && <div className={styles.featureFacts} aria-label="Course details">
            <span>{featured.difficulty}</span>
            {featured.estimated_hours > 0 && <span>{featured.estimated_hours} hours</span>}
            {featured.is_free && <span>Free to learn</span>}
          </div>}
          {featured ? <Link href={`/courses/${featured.slug}`} className={styles.featureAction}>
            Explore the course <ArrowUpRight size={20} aria-hidden="true" />
          </Link> : isError ? <p className={styles.featureError}>The course is temporarily unavailable. Please try again shortly.</p> : <span className={styles.featureLoading}>Opening the course…</span>}
        </div>
        <div className={styles.featurePhoto}>
          <Image
            src="/assets/plates/course-hero-photo.webp"
            alt="A HOVUCA facilitator learning alongside young people"
            fill
            priority
            loading="eager"
            unoptimized
            sizes="(max-width: 760px) 100vw, 50vw"
          />
          <span className={styles.featureMonogram} aria-hidden="true">CSE</span>
          <div className={styles.featureCaption}>Knowledge for real life <span aria-hidden="true">↗</span></div>
        </div>
      </section>

      <section className={styles.courseOverview} aria-labelledby="course-overview-heading">
        <div className={styles.overviewHeading}>
          <h2 id="course-overview-heading">A course for the questions that matter.</h2>
          <p>Move through the themes at your own pace, from everyday relationships to health, safety and rights.</p>
        </div>
        <div className={styles.topicStrip}>
          <div><strong>Relationships</strong><span>Communication, friendship and healthy boundaries</span></div>
          <div><strong>Sexual &amp; reproductive health</strong><span>Puberty, menstrual health, HIV and contraception</span></div>
          <div><strong>Life skills</strong><span>Decision-making, confidence and finding support</span></div>
          <div><strong>Gender &amp; rights</strong><span>Equality, safety and human rights</span></div>
        </div>
      </section>

      {otherCourses.length > 0 && <section className={styles.catalog} aria-labelledby="course-index-heading">
        <div className={styles.moreCoursesHeading}>
          <h2 id="course-index-heading">More ways to learn.</h2>
          <p>Explore the rest of HOVUCA’s course library.</p>
        </div>
        <div className={styles.catalogTools}>
          <div>
            <label className={styles.searchLabel} htmlFor="course-search">Search other courses</label>
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

        <p className={styles.catalogCount} aria-live="polite">
          {isLoading ? "Opening the course register…" : `${filteredCourses.length} ${filteredCourses.length === 1 ? "course" : "courses"} available`}
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
          ) : filteredCourses.length === 0 ? (
            <div className={styles.emptyCatalog}>
              <h3>No courses match that search.</h3>
              <p>Clear a filter or try a broader topic.</p>
            </div>
          ) : (
            filteredCourses.map((course, index) => (
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
      </section>}
    </div>
  );
}
