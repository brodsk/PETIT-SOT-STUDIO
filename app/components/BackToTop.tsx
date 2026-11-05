"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress =
          scrollableHeight > 0
            ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
            : 0;

        setVisible(window.scrollY > 320);
        setProgress(currentProgress);
        ticking = false;
      });
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
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
      const eased =
        progress < 0.5
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

  const circumference = 2 * Math.PI * 27;

  return (
    <button
      type="button"
      className={"back-to-top" + (visible ? " is-visible" : "")}
      onClick={scrollTop}
      aria-label={`Back to top — page ${Math.round(progress * 100)}% scrolled`}
      title="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle
          className="back-to-top-progress"
          cx="32"
          cy="32"
          r="27"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference * (1 - progress),
          }}
        />
        <path className="back-to-top-arrow" d="M32 46V19M20 31L32 19L44 31" />
      </svg>
    </button>
  );
}
