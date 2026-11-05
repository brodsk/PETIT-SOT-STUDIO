"use client";

import { useEffect } from "react";

export default function MotionEffects() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    const selectors = [
      ".gallery-intro",
      ".gallery-pair > .gallery-piece",
      ".gallery-statement",
      ".gallery-footer-image",
      ".archive-mast",
      ".archive-grid > .archive-card",
      ".page-intro",
      ".archive-list > .archive-row",
      ".work-page > .back",
      ".work-page > .artwork-viewer",
      ".work-page > .single-art",
      ".work-info > *",
      ".text-page > *",
      ".contact-instagram-only .contact-inner > *",
      ".about-portrait",
      ".feature-grid > *",
      ".statement"
    ];

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(",")));
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

    elements.forEach((element, index) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight * 0.78) return;
      element.classList.add("motion-reveal");
      const siblings = element.parentElement
        ? Array.from(element.parentElement.children).filter((child) => child.classList.contains("motion-reveal"))
        : [];
      element.style.setProperty("--reveal-delay", `${Math.min(siblings.length - 1, 4) * 85}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
