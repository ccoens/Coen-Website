import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://coen.life/sitemap.xml",
    host: "https://coen.life",
  };
}
