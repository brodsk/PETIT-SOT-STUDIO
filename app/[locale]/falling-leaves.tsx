"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const leaves = [
  {
    name: "maple",
    shape: "M50 4 C54 14 57 21 61 28 C69 18 78 13 88 12 C85 24 87 32 97 40 C85 45 80 52 82 64 C69 62 61 68 55 83 C52 72 49 65 45 58 C38 70 29 79 17 83 C20 68 17 59 5 53 C17 48 22 40 19 28 C32 31 40 25 50 4Z",
    veins: "M50 99 L50 23 M50 56 L22 35 M50 66 L79 38 M50 76 L22 67 M50 48 L72 25 M50 82 L78 70",
  },
  {
    name: "oak",
    shape: "M50 5 C58 14 64 12 69 22 C81 19 88 26 84 37 C96 45 91 55 81 60 C88 72 79 81 68 78 C62 93 53 91 49 81 C39 92 29 85 31 74 C17 77 11 67 19 57 C6 48 13 37 25 35 C19 23 29 17 39 23 C42 12 46 8 50 5Z",
    veins: "M50 101 L50 17 M50 51 L27 31 M50 61 L78 43 M50 72 L31 68 M50 42 L67 27 M50 82 L69 77",
  },
  {
    name: "birch",
    shape: "M50 4 C68 17 83 37 81 58 C79 80 62 101 50 114 C38 101 21 80 19 58 C17 37 32 17 50 4Z",
    veins: "M50 107 L50 15 M50 37 L31 25 M50 49 L69 35 M50 62 L29 53 M50 74 L70 60 M50 87 L34 80",
  },
];

const palette = [
  ["#c45b2b", "#843b24", "#e9a06c"],
  ["#d18a32", "#8f5928", "#f0c17b"],
  ["#a94b2d", "#71351f", "#d98a5d"],
  ["#b77b35", "#805126", "#e8b978"],
  ["#bd6336", "#85432a", "#e6a16f"],
  ["#c99b45", "#8d682d", "#f0cf8a"],
];

export default function FallingLeaves() {
  const pathname = usePathname();
  if (pathname !== "/" && pathname !== "/en" && pathname !== "/ru") return null;

  return (
    <div className="page-leaf-fall autumn-leaf-layer" aria-hidden="true">
      <style>{`
        .autumn-leaf-layer{z-index:8!important;overflow:hidden!important}
        .autumn-leaf{position:absolute;top:-9%;left:var(--x);width:var(--size);height:calc(var(--size)*1.18);opacity:0;transform-origin:50% 20%;animation:autumn-drop var(--duration) linear var(--delay) infinite;will-change:top,transform,opacity}
        .autumn-leaf svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(1px 2px 2px rgba(48,30,15,.24));transform-origin:50% 50%;animation:autumn-tumble var(--flutter) ease-in-out var(--delay) infinite}
        .autumn-leaf .leaf-body{fill:var(--fill);stroke:var(--edge);stroke-width:1.1;stroke-linejoin:round}
        .autumn-leaf .leaf-veins{fill:none;stroke:var(--vein);stroke-width:1.25;stroke-linecap:round;opacity:.8}
        @keyframes autumn-drop{
          0%{top:-9%;transform:translate3d(0,0,0) rotate(-25deg);opacity:0}
          5%{opacity:.96}
          17%{top:15%;transform:translate3d(70px,0,0) rotate(65deg)}
          34%{top:33%;transform:translate3d(-54px,0,0) rotate(165deg)}
          51%{top:51%;transform:translate3d(78px,0,0) rotate(265deg)}
          69%{top:69%;transform:translate3d(-62px,0,0) rotate(365deg)}
          86%{top:86%;transform:translate3d(56px,0,0) rotate(465deg);opacity:.9}
          100%{top:102%;transform:translate3d(-28px,0,0) rotate(560deg);opacity:0}
        }
        @keyframes autumn-tumble{
          0%,100%{transform:perspective(190px) rotateY(0deg) rotateZ(-12deg) scaleX(1)}
          19%{transform:perspective(190px) rotateY(75deg) rotateZ(15deg) scaleX(.48)}
          43%{transform:perspective(190px) rotateY(175deg) rotateZ(-8deg) scaleX(.94)}
          67%{transform:perspective(190px) rotateY(285deg) rotateZ(12deg) scaleX(.5)}
        }
        @media(max-width:700px){
          .autumn-leaf{width:var(--mobile-size);height:calc(var(--mobile-size)*1.18)}
          .autumn-leaf svg{filter:drop-shadow(1px 1px 1px rgba(48,30,15,.2))}
        }
        @media(prefers-reduced-motion:reduce){.autumn-leaf-layer{display:none!important}}
      `}</style>
      {Array.from({ length: 56 }, (_, index) => {
        const paletteItem = palette[(index * 5 + 2) % palette.length];
        const leaf = leaves[(index * 7 + Math.floor(index / 3)) % leaves.length];
        const x = (index * 37.7 + (index % 4) * 9.3) % 99;
        const size = 23 + ((index * 13) % 20);
        const mobileSize = 18 + ((index * 11) % 15);
        const duration = 52 + ((index * 17) % 43);
        const flutter = 2.5 + ((index * 7) % 19) / 10;
        const delay = -((index * 19) % 97);
        const style = {
          "--x": `${x}%`,
          "--size": `${size}px`,
          "--mobile-size": `${mobileSize}px`,
          "--duration": `${duration}s`,
          "--flutter": `${flutter}s`,
          "--delay": `${delay}s`,
          "--fill": paletteItem[0],
          "--edge": paletteItem[1],
          "--vein": paletteItem[2],
        } as CSSProperties;

        return (
          <span className="autumn-leaf" style={style} key={index}>
            <svg viewBox="0 0 100 120" role="presentation">
              <path className="leaf-body" d={leaf.shape} />
              <path className="leaf-veins" d={leaf.veins} />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
