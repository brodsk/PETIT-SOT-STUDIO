"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const leaves = [
  {
    name: "maple",
    // Five-lobed sugar-maple silhouette with pointed tips and softly serrated edges.
    shape: "M50 5 C53 13 54 20 55 27 C62 19 70 14 79 12 C77 21 74 28 70 35 C79 32 88 33 96 37 C89 44 82 49 73 52 C83 55 89 61 93 69 C82 70 74 68 66 64 C69 74 68 84 64 94 C57 86 53 78 50 68 C46 79 40 88 32 96 C28 85 29 75 33 65 C24 71 14 73 5 70 C10 60 17 55 27 51 C17 48 9 42 4 34 C15 31 24 33 32 37 C27 28 25 19 27 10 C37 15 44 22 48 31 C48 21 48 12 50 5Z",
    veins: "M50 110 C50 87 50 57 50 13 M50 49 C40 40 32 33 27 20 M50 55 C62 44 71 34 78 20 M50 66 C38 62 26 55 14 39 M50 70 C63 66 76 59 88 43 M50 83 C43 78 38 73 34 65 M50 85 C57 79 61 73 65 64",
  },
  {
    name: "oak",
    // Rounded, irregular oak lobes rather than a scalloped geometric circle.
    shape: "M50 5 C57 10 58 18 63 22 C68 17 76 18 78 26 C87 25 92 32 87 40 C96 46 94 55 84 59 C90 68 84 77 74 75 C74 86 64 91 57 82 C51 94 42 92 40 81 C31 88 22 83 25 73 C14 76 8 67 17 59 C7 52 11 43 22 41 C15 31 21 23 32 27 C34 16 43 12 50 21 C49 14 49 9 50 5Z",
    veins: "M50 108 C50 82 50 51 50 14 M50 48 C40 39 34 32 29 25 M50 55 C62 46 71 39 80 31 M50 65 C37 61 28 56 18 48 M50 72 C63 67 74 62 86 53 M50 82 C42 77 36 72 29 66 M50 84 C58 78 65 73 72 66",
  },
  {
    name: "beech",
    shape: "M50 5 C60 16 72 31 78 48 C84 69 68 91 50 108 C32 91 16 69 22 48 C28 31 40 16 50 5Z",
    veins: "M50 103 C50 75 50 43 50 13 M50 34 C41 29 35 25 30 20 M50 48 C60 42 67 36 73 29 M50 62 C39 57 32 52 26 45 M50 77 C61 70 68 64 75 56 M50 89 C41 83 36 78 32 72",
  },
  {
    name: "willow",
    shape: "M50 4 C58 20 70 42 69 61 C68 82 57 101 50 114 C43 101 32 82 31 61 C30 42 42 20 50 4Z",
    veins: "M50 109 C50 79 50 43 50 12 M50 38 C56 32 61 26 64 20 M50 55 C43 48 39 42 36 35 M50 72 C57 65 61 59 64 52 M50 88 C44 82 41 77 38 70",
  },
];

const palette = [
  ["#b95732", "#793b27", "#e9a477"],
  ["#c77b2e", "#885022", "#efbd79"],
  ["#a84b32", "#713622", "#d98b68"],
  ["#ad7837", "#765126", "#e6bd7e"],
  ["#bd6038", "#7e3b28", "#e5a078"],
  ["#c69a45", "#82632f", "#efd08b"],
  ["#8f9a42", "#59652e", "#c4c982"],
];

export default function FallingLeaves() {
  const pathname = usePathname();
  if (pathname !== "/" && pathname !== "/en" && pathname !== "/ru") return null;

  return (
    <div className="page-leaf-fall autumn-leaf-layer" aria-hidden="true">
      <style>{`
        .autumn-leaf-layer{z-index:8!important;overflow:hidden!important}
        .autumn-leaf{position:absolute;top:-10%;left:var(--x);width:var(--size);height:calc(var(--size)*1.18);opacity:0;transform-origin:50% 20%;animation:leaf-drift var(--duration) cubic-bezier(.38,.04,.62,.98) var(--delay) infinite;will-change:transform,opacity}
        .autumn-leaf svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(1px 2px 2px rgba(48,30,15,.17));transform-origin:50% 50%;animation:leaf-flutter var(--flutter) ease-in-out var(--delay) infinite}
        .autumn-leaf .leaf-body{fill:var(--fill);stroke:var(--edge);stroke-width:.7;stroke-linejoin:round}
        .autumn-leaf .leaf-veins{fill:none;stroke:var(--vein);stroke-width:.65;stroke-linecap:round;opacity:.52}
        .autumn-leaf .leaf-veins-fine{fill:none;stroke:var(--vein);stroke-width:.38;stroke-linecap:round;opacity:.32}
        @keyframes leaf-drift{
          0%{transform:translate3d(0,-4vh,0) rotate(var(--start-rot));opacity:0}
          5%{opacity:var(--leaf-opacity)}
          22%{transform:translate3d(var(--drift-a),22vh,0) rotate(calc(var(--start-rot) + var(--spin-a)))}
          43%{transform:translate3d(var(--drift-b),45vh,0) rotate(calc(var(--start-rot) + var(--spin-b)))}
          64%{transform:translate3d(var(--drift-c),68vh,0) rotate(calc(var(--start-rot) + var(--spin-c)))}
          83%{transform:translate3d(var(--drift-d),91vh,0) rotate(calc(var(--start-rot) + var(--spin-d)));opacity:var(--leaf-opacity)}
          100%{transform:translate3d(var(--drift-e),116vh,0) rotate(calc(var(--start-rot) + var(--spin-e)));opacity:0}
        }
        @keyframes leaf-flutter{
          0%,100%{transform:perspective(260px) rotateY(0deg) rotateZ(-5deg) scaleX(1)}
          18%{transform:perspective(260px) rotateY(42deg) rotateZ(7deg) scaleX(.82)}
          37%{transform:perspective(260px) rotateY(118deg) rotateZ(-11deg) scaleX(.58)}
          54%{transform:perspective(260px) rotateY(205deg) rotateZ(5deg) scaleX(.88)}
          72%{transform:perspective(260px) rotateY(282deg) rotateZ(-8deg) scaleX(.66)}
          88%{transform:perspective(260px) rotateY(335deg) rotateZ(6deg) scaleX(.92)}
        }
        @media(max-width:700px){
          .autumn-leaf{width:var(--mobile-size);height:calc(var(--mobile-size)*1.18)}
          .autumn-leaf svg{filter:drop-shadow(1px 1px 1px rgba(48,30,15,.14))}
        }
        @media(prefers-reduced-motion:reduce){.autumn-leaf-layer{display:none!important}}
      `}</style>
      {Array.from({ length: 48 }, (_, index) => {
        // Seeded pseudo-random values keep the composition varied but stable between renders.
        const rand = (salt: number) => {
          const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
          return value - Math.floor(value);
        };
        const paletteItem = palette[Math.floor(rand(1) * palette.length)];
        // Oak and maple dominate the mix; a few beech and willow leaves add natural variety.
        const leaf = leaves[[0, 1, 1, 0, 1, 0, 2, 3][Math.floor(rand(2) * 8)]];
        const x = 2 + rand(3) * 96;
        const size = 27 + rand(4) * 27;
        const mobileSize = 20 + rand(5) * 19;
        const duration = 19 + rand(6) * 25;
        const flutter = 2.4 + rand(7) * 3.8;
        const delay = -(rand(8) * duration);
        const style = {
          "--x": `${x}%`,
          "--size": `${size}px`,
          "--mobile-size": `${mobileSize}px`,
          "--duration": `${duration}s`,
          "--flutter": `${flutter}s`,
          "--delay": `${delay}s`,
          "--drift-a": `${(rand(9) - 0.5) * 150}px`,
          "--drift-b": `${(rand(10) - 0.5) * 210}px`,
          "--drift-c": `${(rand(11) - 0.5) * 190}px`,
          "--drift-d": `${(rand(12) - 0.5) * 230}px`,
          "--drift-e": `${(rand(13) - 0.5) * 260}px`,
          "--start-rot": `${rand(14) * 360 - 180}deg`,
          "--spin-a": `${rand(15) * 220 - 110}deg`,
          "--spin-b": `${rand(16) * 520 - 260}deg`,
          "--spin-c": `${rand(17) * 850 - 425}deg`,
          "--spin-d": `${rand(18) * 1150 - 575}deg`,
          "--spin-e": `${rand(19) * 1500 - 750}deg`,
          "--leaf-opacity": `${0.62 + rand(20) * 0.3}`,
          "--fill": paletteItem[0],
          "--edge": paletteItem[1],
          "--vein": paletteItem[2],
        } as CSSProperties;

        return (
          <span className="autumn-leaf" style={style} key={index}>
            <svg viewBox="0 0 100 120" role="presentation">
              <path className="leaf-body" d={leaf.shape} />
              <path className="leaf-veins" d={leaf.veins} />
              {leaf.name === "maple" && <path className="leaf-veins-fine" d="M50 49 L43 37 M50 55 L59 39 M50 66 L37 58 M50 70 L63 57 M50 82 L43 74 M50 85 L58 73" />}
              {leaf.name === "oak" && <path className="leaf-veins-fine" d="M50 48 L43 35 M50 55 L59 43 M50 65 L38 57 M50 72 L63 61 M50 82 L42 74 M50 84 L59 74" />}
            </svg>
          </span>
        );
      })}
    </div>
  );
}
