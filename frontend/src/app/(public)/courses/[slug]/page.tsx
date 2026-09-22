import type { Metadata } from "next";
import { CourseDetailClientView } from "./CourseDetailClientView";
import { constructMetadata, getBreadcrumbSchema, getCourseSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const RAW_API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
const API_URL = RAW_API_URL.startsWith("http") ? RAW_API_URL : `http://127.0.0.1:8000${RAW_API_URL}`;

async function fetchCourse(slug: string) {
  try {
    const res = await fetch(`${API_URL}/courses/${slug}/`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await fetchCourse(slug);

  if (course) {
    const cleanDesc = course.description
      ? course.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      : "Free online course from HOVUCA.";

    return constructMetadata({
      title: course.title,
      description: cleanDesc,
      path: `/courses/${slug}`,
      image: course.thumbnail,
      imageAlt: course.title,
      keywords: [
        "HOVUCA course",
        course.title,
        course.subject?.name || "Life skills",
        "free online learning Cameroon",
      ],
    });
  }

  return constructMetadata({
    title: "Course Details",
    description: "Explore free interactive courses and learning materials with HOVUCA.",
    path: `/courses/${slug}`,
  });
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await fetchCourse(slug);

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: course?.title || "Course", path: `/courses/${slug}` },
  ]);

  const courseSchema = course
    ? getCourseSchema({
        name: course.title,
        description: course.description
          ? course.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
          : course.title,
        url: `/courses/${slug}`,
        image: course.thumbnail,
      })
    : null;

  return (
    <>
      <JsonLd data={breadcrumbs} />
      {courseSchema && <JsonLd data={courseSchema} />}
      <CourseDetailClientView />
    </>
  );
}
