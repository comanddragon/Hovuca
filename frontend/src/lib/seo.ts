import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://hovuca.org"
).replace(/\/$/, "");

export const DEFAULT_OG_IMAGE = `${SITE_URL}/Hovuca.png`;

export const SITE_CONFIG = {
  name: "HOVUCA",
  legalName: "Hope for the Vulnerable and Children in Action",
  description:
    "Empowering vulnerable children, girls, young people, and communities across Cameroon through research, advocacy, education, and community partnerships.",
  url: SITE_URL,
  ogImage: DEFAULT_OG_IMAGE,
  email: "contact@hovuca.org",
  telephone: "+237 696 230 391",
  address: {
    streetAddress: "Grande Chefferie Simbock",
    addressLocality: "Yaoundé",
    addressCountry: "CM",
  },
  socials: [
    "https://www.facebook.com/hovuca",
    "https://www.linkedin.com/company/hovuca",
    "https://twitter.com/hovuca",
  ],
  keywords: [
    "HOVUCA",
    "NGO Cameroon",
    "vulnerable children Cameroon",
    "child protection Bamenda",
    "girls empowerment Cameroon",
    "sexual reproductive health rights SRHR",
    "community development Cameroon",
    "education non-profit Africa",
    "charity Yaoundé",
    "volunteer Cameroon",
    "donate Cameroon NGO",
  ],
};

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

interface ConstructMetadataParams {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  keywords?: string[];
  noIndex?: boolean;
}

export function constructMetadata({
  title,
  description = SITE_CONFIG.description,
  path = "",
  image,
  imageAlt,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  keywords = [],
  noIndex = false,
}: ConstructMetadataParams = {}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
  const pageTitle = title ? `${title} | ${SITE_CONFIG.name}` : `${SITE_CONFIG.name} | ${SITE_CONFIG.legalName}`;

  return {
    title,
    description,
    keywords: [...SITE_CONFIG.keywords, ...keywords],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: "en_US",
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors && authors.length > 0 && { authors }),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt || pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [imageUrl],
      creator: "@hovuca",
      site: "@hovuca",
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

// ─── Schema.org Structured Data Generators ────────────────────────────────────

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.url,
    logo: absoluteUrl("/Hovuca.png"),
    image: DEFAULT_OG_IMAGE,
    description: SITE_CONFIG.description,
    email: SITE_CONFIG.email,
    telephone: SITE_CONFIG.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.streetAddress,
      addressLocality: SITE_CONFIG.address.addressLocality,
      addressCountry: SITE_CONFIG.address.addressCountry,
    },
    sameAs: SITE_CONFIG.socials,
    areaServed: {
      "@type": "Country",
      name: "Cameroon",
    },
  };
}

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.legalName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/Hovuca.png"),
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/blog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

interface ArticleSchemaParams {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
}

export function getArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
}: ArticleSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: absoluteUrl(url),
    image: image ? absoluteUrl(image) : DEFAULT_OG_IMAGE,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(url),
    },
    author: authorName
      ? {
          "@type": "Person",
          name: authorName,
        }
      : {
          "@type": "Organization",
          name: SITE_CONFIG.name,
          url: SITE_CONFIG.url,
        },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/Hovuca.png"),
      },
    },
  };
}

interface EventSchemaParams {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate?: string;
  locationName?: string;
  locationAddress?: string;
  onlineUrl?: string;
  isOnline?: boolean;
  image?: string | null;
}

export function getEventSchema({
  name,
  description,
  url,
  startDate,
  endDate,
  locationName,
  locationAddress,
  onlineUrl,
  isOnline = false,
  image,
}: EventSchemaParams) {
  const eventLocation = isOnline
    ? {
        "@type": "VirtualLocation",
        url: onlineUrl || absoluteUrl(url),
      }
    : {
        "@type": "Place",
        name: locationName || "HOVUCA Community Center",
        address: {
          "@type": "PostalAddress",
          streetAddress: locationAddress || "Grande Chefferie Simbock",
          addressLocality: "Yaoundé",
          addressCountry: "CM",
        },
      };

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    url: absoluteUrl(url),
    startDate,
    ...(endDate && { endDate }),
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: eventLocation,
    image: image ? absoluteUrl(image) : DEFAULT_OG_IMAGE,
    organizer: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };
}

interface CourseSchemaParams {
  name: string;
  description: string;
  url: string;
  image?: string | null;
}

export function getCourseSchema({
  name,
  description,
  url,
  image,
}: CourseSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url: absoluteUrl(url),
    image: image ? absoluteUrl(image) : DEFAULT_OG_IMAGE,
    provider: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      sameAs: SITE_CONFIG.url,
    },
    isAccessibleForFree: true,
  };
}
