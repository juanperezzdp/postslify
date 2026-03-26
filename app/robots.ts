import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
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
