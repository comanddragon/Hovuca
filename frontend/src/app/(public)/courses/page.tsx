import type { Metadata } from "next";
import { CoursesClientView } from "./CoursesClientView";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "E-Learning & Community Courses",
  description:
    "Explore free interactive learning programmes on comprehensive sexuality education, life skills, health, gender equality, and children’s rights with HOVUCA.",
  path: "/courses",
  keywords: [
    "HOVUCA e-learning",
    "comprehensive sexuality education Cameroon",
    "life skills courses Africa",
    "free youth training",
    "SRHR courses",
  ],
});

export default function CoursesPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <CoursesClientView />
    </>
  );
}
