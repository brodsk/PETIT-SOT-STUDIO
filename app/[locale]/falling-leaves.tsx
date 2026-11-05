"use client";

import { usePathname } from "next/navigation";

const shapes = [
  "M30 2 C34 10 35 15 37 19 L51 10 L46 25 L59 29 L47 38 L52 53 L36 48 L30 70 L24 48 L8 53 L13 38 L1 29 L14 25 L9 10 L23 19 C25 14 26 9 30 2Z",
  "M30 3 C43 13 52 25 48 39 C45 52 36 62 30 69 C24 62 15 52 12 39 C8 25 17 13 30 3Z",
  "M30 3 C37 10 42 13 48 14 C43 21 49 25 55 29 C47 34 49 40 52 47 C43 48 40 54 39 63 C32 58 27 62 22 69 C19 59 13 56 5 55 C10 47 7 41 2 36 C11 32 12 26 10 18 C19 20 24 14 30 3Z",
];
const veins = "M30 65 L30 17 M30 34 L14 25 M30 43 L46 34 M30 51 L15 46 M30 27 L43 19";

export default function FallingLeaves() {
  const pathname = usePathname();
  if (pathname !== "/" && pathname !== "/ru") return null;

  return (
    <div className="page-leaf-fall" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => {
        const shape = shapes[index % shapes.length];
        return (
          <span className={`page-leaf page-leaf-${index + 1}`} key={index}>
            <svg viewBox="0 0 60 72" aria-hidden="true">
              <path className="leaf-shape" d={shape} />
              <path className="leaf-veins" d={veins} />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
