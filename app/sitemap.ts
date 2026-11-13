import type { MetadataRoute } from "next";
import { getWorks } from "../lib/works";

const SITE_URL = "https://www.petitsot.com";

function languageAlternates(path: string, includeRussian = true) {
  const cleanPath = path === "/" ? "" : path;
  return {
    languages: {
      en: `${SITE_URL}${cleanPath}`,
      ...(includeRussian ? { ru: `${SITE_URL}/ru${cleanPath}` } : {}),
      "x-default": `${SITE_URL}${cleanPath}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const works = await getWorks();

  const staticPaths = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/works", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/commission", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/commission-terms", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/trencin-art-studio", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/journal", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/journal/how-to-choose-an-original-painting", changeFrequency: "yearly" as const, priority: 0.6 },
    { path: "/journal/original-art-vs-print", changeFrequency: "yearly" as const, priority: 0.6 },
    { path: "/journal/how-to-care-for-an-original-painting", changeFrequency: "yearly" as const, priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap(({ path, changeFrequency, priority }) => {
    const includeRussian = path !== "/trencin-art-studio" && path !== "/commission-terms";
    const englishPage = {
      url: `${SITE_URL}${path === "/" ? "" : path}`,
      changeFrequency,
      priority,
      ...languageAlternates(path, includeRussian),
    };
    if (!includeRussian) return [englishPage];
    return [
      englishPage,
      {
        url: `${SITE_URL}/ru${path === "/" ? "" : path}`,
        changeFrequency,
        priority,
        ...languageAlternates(path),
      },
    ];
  });

  const artworkPages: MetadataRoute.Sitemap = works.flatMap((work) => {
    const path = `/works/${work.slug}`;
    const images = work.images.length > 0 ? [...new Set(work.images)] : undefined;
    return [
      {
        url: `${SITE_URL}${path}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        ...(images ? { images } : {}),
        ...languageAlternates(path),
      },
      {
        url: `${SITE_URL}/ru${path}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        ...(images ? { images } : {}),
        ...languageAlternates(path),
      },
    ];
  });

  return [...staticPages, ...artworkPages];
}
