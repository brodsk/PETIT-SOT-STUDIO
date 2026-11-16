import type { MetadataRoute } from "next";
import { getWorks } from "../lib/works";

const SITE_URL = "https://www.petitsot.com";

function languageAlternates(path: string, includeRussian = true) {
  const cleanPath = path === "/" ? "" : path;
  return {
    languages: {
      en: `${SITE_URL}${cleanPath}`,
      ...(path === "/trencin-art-studio" ? { sk: `${SITE_URL}/sk/trencin-art-studio` } : path.startsWith("/works/") ? { sk: `${SITE_URL}/sk/obrazy/${path.split("/").pop()}` } : {}),
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
    { path: "/prints", changeFrequency: "weekly" as const, priority: 0.85 },
    { path: "/commission", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/commission-terms", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/trencin-art-studio", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/journal", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/journal/how-to-choose-an-original-painting", changeFrequency: "yearly" as const, priority: 0.6 },
    { path: "/journal/original-art-vs-print", changeFrequency: "yearly" as const, priority: 0.6 },
    { path: "/journal/how-to-care-for-an-original-painting", changeFrequency: "yearly" as const, priority: 0.6 },
    { path: "/journal/how-to-hang-a-painting", changeFrequency: "yearly" as const, priority: 0.6 },
    { path: "/journal/commission-an-original-painting", changeFrequency: "yearly" as const, priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap(({ path, changeFrequency, priority }) => {
    const includeRussian = path !== "/trencin-art-studio";
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
      {
        url: `${SITE_URL}/sk/obrazy/${work.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        ...(images ? { images } : {}),
        alternates: {
          languages: {
            en: `${SITE_URL}${path}`,
            ru: `${SITE_URL}/ru${path}`,
            sk: `${SITE_URL}/sk/obrazy/${work.slug}`,
            "x-default": `${SITE_URL}${path}`,
          },
        },
      },
    ];
  });

  const slovakLocalLanding: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/sk/trencin-art-studio`,
      changeFrequency: "monthly",
      priority: 0.85,
      alternates: {
        languages: {
          sk: `${SITE_URL}/sk/trencin-art-studio`,
          en: `${SITE_URL}/trencin-art-studio`,
          "x-default": `${SITE_URL}/trencin-art-studio`,
        },
      },
    },
    {
      url: `${SITE_URL}/sk/obrazy`,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          sk: `${SITE_URL}/sk/obrazy`,
          en: `${SITE_URL}/works`,
          ru: `${SITE_URL}/ru/works`,
          "x-default": `${SITE_URL}/works`,
        },
      },
    },
    {
      url: `${SITE_URL}/sk/malba-na-objednavku`,
      changeFrequency: "monthly",
      priority: 0.85,
      alternates: {
        languages: {
          sk: `${SITE_URL}/sk/malba-na-objednavku`,
          en: `${SITE_URL}/commission`,
          ru: `${SITE_URL}/ru/commission`,
          "x-default": `${SITE_URL}/commission`,
        },
      },
    },
  ];

  return [...staticPages, ...slovakLocalLanding, ...artworkPages];
}
