import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HOVUCA - Hope for the Vulnerable and Children in Action",
    short_name: "HOVUCA",
    description:
      "Empowering vulnerable children, girls, young people, and communities across Cameroon through research, advocacy, and education.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e3a2f",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/Hovuca.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
