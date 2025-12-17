import { MetadataRoute } from "next";
import { locations } from "@/lib/data/locations";
import { routes } from "@/lib/data/routes";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://cabigo.in";
    const currentDate = new Date();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: `${baseUrl}/locations`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/routes`,
            lastModified: currentDate,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: currentDate,
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: currentDate,
            changeFrequency: "monthly",
            priority: 0.6,
        },
    ];

    // Dynamic city pages
    const cityPages: MetadataRoute.Sitemap = locations.map((location) => ({
        url: `${baseUrl}/taxi-in-${location.slug}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    // Dynamic route pages
    const routePages: MetadataRoute.Sitemap = routes.map((route) => ({
        url: `${baseUrl}/taxi-${route.slug}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [...staticPages, ...cityPages, ...routePages];
}
