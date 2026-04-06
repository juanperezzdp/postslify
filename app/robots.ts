import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/_next/",
        "/*.json$",
        "/*.woff2$",
        "/*.otf$",
        "/*.ttf$",
        "*/favicon.ico*",
        "*/dashboard/*",
        "*/calendar/*",
        "*/create-post/*",
        "*/voice-profiles/*",
        "*/voice-profile/*",
        "*/billing/*",
        "*/settings/*",
        "*/business-page/*",
        "*/archived-posts/*",
        "*/perfiles/*", 
        "*/perfil/*"
      ],
    },
    sitemap: "https://postslify.com/sitemap.xml",
  };
}
