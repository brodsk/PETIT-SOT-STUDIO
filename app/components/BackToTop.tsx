"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const startY = window.scrollY;
    if (startY <= 0) return;

    const duration = Math.min(1100, Math.max(550, startY * 0.45));
    const startTime = performance.now();
    let frame = 0;

    const cancelOnUserInput = (event: Event) => {
      if (event.type === "keydown") {
        const key = (event as KeyboardEvent).key;
        if (!["ArrowDown", "PageDown", " ", "End"].includes(key)) return;
      }
      cancelAnimationFrame(frame);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("wheel", cancelOnUserInput);
      window.removeEventListener("touchstart", cancelOnUserInput);
      window.removeEventListener("keydown", cancelOnUserInput);
    };

    window.addEventListener("wheel", cancelOnUserInput, { passive: true });
    window.addEventListener("touchstart", cancelOnUserInput, { passive: true });
    window.addEventListener("keydown", cancelOnUserInput);

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Smooth ease-in-out: gradual start, faster middle, soft landing.
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startY * (1 - eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        window.scrollTo(0, 0);
        cleanup();
      }
    };

    frame = requestAnimationFrame(animate);
  };

  return (
    <button
      type="button"
      className={"back-to-top" + (visible ? " is-visible" : "")}
      onClick={scrollTop}
      aria-label="Back to top"
      title="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg viewBox="0 0 24 48" aria-hidden="true" focusable="false">
        <path d="M12 46V3M3.5 11.5 12 3l8.5 8.5" />
      </svg>
    </button>
  );
}
