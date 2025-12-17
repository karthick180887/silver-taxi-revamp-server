import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://cabigo.in";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/admin/",
                    "/_next/",
                    "/private/",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
