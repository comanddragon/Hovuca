"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";

import { useChapter, useCourse, useEnroll, useEnrollments, useMarkChapterComplete } from "@/hooks";
import { useAuthStore } from "@/store/auth.store";
import type { Module } from "@/types";
import styles from "../course-handbook.module.css";

function ageBand(module: Module) {
  return module.age_max ? `${module.age_min}–${module.age_max}` : `${module.age_min}+`;
}

function displayModuleTitle(title: string) {
  return title.replace(/^Module\s+\d+:\s*/i, "");
}

function courseAudience(modules: Module[]) {
  const labels = Array.from(new Set(modules.map(ageBand)));
  return labels.length ? labels.join(" · ") : "All ages";
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function HandbookLoader() {
  return (
    <div className={`${styles.page} ${styles.loadingPage}`} aria-label="Loading course handbook">
      <div className={styles.loadingKicker} />
      <div className={styles.loadingTitle} />
      <div className={styles.loadingRule} />
      <div className={styles.loadingPanel} />
    </div>
  );
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const shouldReduceMotion = useReducedMotion();
  const { isAuthenticated } = useAuthStore();
  const { data: course, isLoading, isError } = useCourse(slug);
  const { data: enrollments } = useEnrollments();
  const { mutate: enroll, isPending: enrolling } = useEnroll();
  const { mutate: markChapterComplete, isPending: markingChapter } = useMarkChapterComplete();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [completedChapterId, setCompletedChapterId] = useState<string | null>(null);
  const { data: selectedChapter, isLoading: chapterLoading, isError: chapterError } = useChapter(selectedChapterId);

  if (isLoading) return <HandbookLoader />;

  if (isError || !course) {
    return (
      <div className={`${styles.page} ${styles.notFound}`}>
        <div>
          <p className={styles.eyebrow}>Field handbook</p>
          <h1>Course not found</h1>
          <p>This handbook may have moved or is not yet published.</p>
          <Link href="/courses">Return to all courses</Link>
        </div>
      </div>
    );
  }

  const modules = [...(course.modules ?? [])].sort((a, b) => a.order - b.order);
  const activeModule = modules.find((module) => module.id === activeModuleId) ?? modules[0];
  const activeIndex = Math.max(0, modules.findIndex((module) => module.id === activeModule?.id));
  const chapters = [...(activeModule?.chapters ?? [])].sort((a, b) => a.order - b.order);
  const leadChapter = chapters[0];
  const enrollment = enrollments?.results?.find((item) => item.course.id === course.id);
  const isEnrolled = Boolean(enrollment);
  const chapterCount = modules.reduce((total, module) => total + (module.chapter_count || module.chapters?.length || 0), 0);
  const selectedMinutes = chapters.reduce((total, chapter) => total + chapter.duration_minutes, 0);
  const selectedChapterSummary = chapters.find((chapter) => chapter.id === selectedChapterId);
  const canReadSelectedChapter = isEnrolled || Boolean(isAuthenticated && selectedChapterSummary?.is_preview);

  const goToHandbook = () => {
    document.getElementById("session-map")?.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className={styles.page}>
      <section className={styles.courseHero} aria-labelledby="course-title">
        <Image
          src="/assets/plates/course-hero-photo.webp"
          alt="Young people taking part in a HOVUCA learning session"
          fill
          priority
          loading="eager"
          unoptimized
          sizes="100vw"
          className={styles.heroPhoto}
        />
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Field handbook · {course.subject?.name ?? "Community learning"}</p>
          <h1 id="course-title" className={styles.heroTitle}>{course.title}</h1>
          <p className={styles.heroSummary}>{course.description}</p>
        </div>
      </section>

      <div className={styles.handbookGrid}>
        <aside className={styles.contents} aria-label="Handbook contents">
          <h2 className={styles.railTitle}>Contents</h2>
          {modules.length ? (
            <nav className={styles.moduleNav}>
              {modules.map((module, index) => {
                const isActive = module.id === activeModule?.id;
                return (
                  <button
                    key={module.id}
                    type="button"
                    className={`${styles.moduleButton} ${isActive ? styles.moduleButtonActive : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveModuleId(module.id)}
                  >
                    <span className={styles.moduleNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.moduleName}>{displayModuleTitle(module.title)}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <p className={styles.railNote}>The first modules are being prepared.</p>
          )}
          <p className={styles.railNote}>Choose a module to update the active folio. Your place stays visible as you move through the handbook.</p>
        </aside>

        <main id="handbook-content" className={styles.chapterStage}>
          {activeModule ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={activeModule.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
              >
                <div className={styles.stageTopline}>
                  <p className={styles.eyebrow}>Module {activeIndex + 1} · Ages {ageBand(activeModule)}</p>
                  <span className={styles.folio}>{String(activeIndex + 1).padStart(2, "0")} / {String(modules.length).padStart(2, "0")}</span>
                </div>
                <h2 className={styles.moduleTitle}>{displayModuleTitle(activeModule.title)}</h2>
                <h3 className={styles.chapterTitle}>{leadChapter?.title ?? "Module overview"}</h3>

                <div className={styles.lessonPhotoWrap}>
                  <Image
                    src="/assets/plates/lesson-photo.webp"
                    alt="Young people in a facilitated outdoor learning discussion"
                    fill
                    priority
                    loading="eager"
                    unoptimized
                    sizes="(max-width: 760px) 100vw, 60vw"
                    className={styles.lessonPhoto}
                  />
                </div>

                <p className={styles.moduleDescription}>
                  {activeModule.description || `Work through ${displayModuleTitle(activeModule.title).toLowerCase()} with practical, age-appropriate guidance designed for reflection and discussion.`}
                </p>

                <p id="session-map" className={styles.sessionLabel}>Sessions in this module</p>
                {chapters.length ? (
                  <ol className={styles.chapterList}>
                    {chapters.map((chapter, index) => {
                      const canOpen = isEnrolled || Boolean(isAuthenticated && chapter.is_preview);
                      return (
                        <li key={chapter.id}>
                          <button
                            type="button"
                            className={`${styles.chapterRow} ${selectedChapterId === chapter.id ? styles.chapterRowActive : ""}`}
                            disabled={!canOpen}
                            onClick={() => setSelectedChapterId(chapter.id)}
                          >
                            <span className={styles.chapterIndex}>{index + 1}</span>
                            <span>
                              <span className={styles.chapterName}>{chapter.title}</span>
                              <span className={styles.chapterMeta}>{chapter.content_type} · {formatMinutes(chapter.duration_minutes)}{chapter.is_preview ? " · Preview" : ""}</span>
                            </span>
                            {canOpen
                              ? <ArrowRight className={styles.chapterOpenIcon} size={16} aria-hidden="true" />
                              : <LockKeyhole className={styles.lock} size={15} aria-label="Enroll to access" />}
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className={styles.smallPrint}>Session details will appear here when this module is published.</p>
                )}

                {selectedChapterId && selectedChapterSummary && canReadSelectedChapter && (
                  <section className={styles.chapterReader} aria-live="polite">
                    {chapterLoading ? (
                      <p>Opening session…</p>
                    ) : chapterError || !selectedChapter ? (
                      <p>This session could not be opened. Please try again.</p>
                    ) : (
                      <>
                        <p className={styles.eyebrow}>Open session</p>
                        <h4>{selectedChapter.title}</h4>
                        {selectedChapter.content_type === "text" && selectedChapter.content_body && (
                          <div className={`${styles.readerText} rich-content`} dangerouslySetInnerHTML={{ __html: selectedChapter.content_body }} />
                        )}
                        {selectedChapter.content_type === "video" && selectedChapter.content_url && (
                          <a href={selectedChapter.content_url} target="_blank" rel="noreferrer">Watch the session video <ArrowRight size={16} /></a>
                        )}
                        {selectedChapter.content_type === "pdf" && selectedChapter.content_file && (
                          <a href={selectedChapter.content_file} target="_blank" rel="noreferrer">Open the session document <ArrowRight size={16} /></a>
                        )}
                        {isEnrolled && (
                          <button
                            type="button"
                            className={styles.completeAction}
                            disabled={markingChapter || completedChapterId === selectedChapter.id}
                            onClick={() => markChapterComplete(selectedChapter.id, { onSuccess: () => setCompletedChapterId(selectedChapter.id) })}
                          >
                            <CheckCircle2 size={17} />
                            {completedChapterId === selectedChapter.id ? "Session complete" : markingChapter ? "Saving progress…" : "Mark session complete"}
                          </button>
                        )}
                      </>
                    )}
                  </section>
                )}
              </motion.article>
            </AnimatePresence>
          ) : (
            <div>
              <p className={styles.eyebrow}>Handbook introduction</p>
              <h2 className={styles.moduleTitle}>Modules coming soon</h2>
              <p className={styles.moduleDescription}>{course.description}</p>
            </div>
          )}
        </main>

        <aside className={styles.facts} aria-label="Course details">
          <h2 className={styles.railTitle}>Course details</h2>
          <dl className={styles.factList}>
            <div className={styles.fact}><dt>Level</dt><dd>{course.difficulty}</dd></div>
            <div className={styles.fact}><dt>Cost</dt><dd>{course.is_free ? "Free" : "Paid"}</dd></div>
            <div className={styles.fact}><dt>Modules</dt><dd>{modules.length}</dd></div>
            <div className={styles.fact}><dt>Sessions</dt><dd>{chapterCount}</dd></div>
            <div className={styles.fact}><dt>Time</dt><dd>{course.estimated_hours} hours</dd></div>
            <div className={styles.fact}><dt>Ages</dt><dd>{courseAudience(modules)}</dd></div>
            {course.instructor && <div className={styles.fact}><dt>Instructor</dt><dd>{course.instructor.full_name}</dd></div>}
          </dl>

          {enrollment && (
            <div className={styles.progress}>
              <div className={styles.progressTop}>
                <span>Your progress</span>
                <span>{Math.round(enrollment.progress_percentage)}%</span>
              </div>
              <div className={styles.progressTrack} aria-label={`${enrollment.progress_percentage}% complete`}>
                <div className={styles.progressValue} style={{ width: `${enrollment.progress_percentage}%` }} />
              </div>
            </div>
          )}

          {isEnrolled ? (
            <button type="button" className={styles.primaryAction} onClick={goToHandbook}>
              <span>{enrollment?.status === "completed" ? "Review sessions" : "Open sessions"}</span>
              {enrollment?.status === "completed" ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
            </button>
          ) : isAuthenticated ? (
            <button type="button" className={styles.primaryAction} disabled={enrolling} onClick={() => enroll(course.slug)}>
              <span>{enrolling ? "Enrolling…" : course.is_free ? "Start learning" : "Request access"}</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <Link href={`/login?next=/courses/${course.slug}`} className={styles.primaryAction}>
              <span>Sign in to enroll</span>
              <ArrowRight size={18} />
            </Link>
          )}
          <p className={styles.smallPrint}>
            {isEnrolled
              ? `${selectedMinutes ? formatMinutes(selectedMinutes) : "Self-paced"} in the selected module.`
              : "Create a free account to save progress and access every session."}
          </p>
        </aside>
      </div>
    </div>
  );
}
