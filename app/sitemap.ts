import type { MetadataRoute } from "next";
import { getWorks } from "../lib/works";

const SITE_URL = "https://petitsot.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const works = await getWorks();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/en`,
      alternates: { languages: { en: `${SITE_URL}/en`, ru: `${SITE_URL}/ru` } },
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/ru`,
      alternates: { languages: { en: `${SITE_URL}/en`, ru: `${SITE_URL}/ru` } },
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/en/works`,
      alternates: { languages: { en: `${SITE_URL}/en/works`, ru: `${SITE_URL}/ru/works` } },
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/ru/works`,
      alternates: { languages: { en: `${SITE_URL}/en/works`, ru: `${SITE_URL}/ru/works` } },
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/en/about`,
      alternates: { languages: { en: `${SITE_URL}/en/about`, ru: `${SITE_URL}/ru/about` } },
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/ru/about`,
      alternates: { languages: { en: `${SITE_URL}/en/about`, ru: `${SITE_URL}/ru/about` } },
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/en/contact`,
      alternates: { languages: { en: `${SITE_URL}/en/contact`, ru: `${SITE_URL}/ru/contact` } },
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/ru/contact`,
      alternates: { languages: { en: `${SITE_URL}/en/contact`, ru: `${SITE_URL}/ru/contact` } },
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const artworkPages: MetadataRoute.Sitemap = works.flatMap((work) => {
    const en = `${SITE_URL}/en/works/${work.slug}`;
    const ru = `${SITE_URL}/ru/works/${work.slug}`;
    return [
      {
        url: en,
        alternates: { languages: { en, ru } },
        changeFrequency: "monthly",
        priority: 0.8,
      },
      {
        url: ru,
        alternates: { languages: { en, ru } },
        changeFrequency: "monthly",
        priority: 0.8,
      },
    ];
  });

  return [...staticPages, ...artworkPages];
}
