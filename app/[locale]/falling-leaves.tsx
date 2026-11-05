"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const leaves = [
  {
    name: "maple",
    shape: "M50 7 C54 15 57 23 59 31 C67 23 75 18 84 17 C81 26 79 33 82 40 C89 41 94 44 98 49 C88 52 81 57 77 65 C69 62 62 63 56 70 C55 80 53 88 50 97 C46 87 43 78 42 69 C34 74 27 78 19 78 C20 69 17 63 8 58 C17 54 22 48 23 41 C30 42 36 38 40 31 C42 22 46 14 50 7Z",
    veins: "M50 103 C50 77 50 48 50 17 M50 55 C40 46 32 39 25 33 M50 64 C62 52 73 43 85 36 M50 77 C38 70 29 66 18 62 M50 82 C62 75 70 70 79 66",
  },
  {
    name: "oak",
    shape: "M50 7 C57 12 57 20 64 22 C70 16 79 20 78 29 C89 29 91 39 83 45 C94 52 88 62 79 63 C84 74 75 81 66 76 C62 88 52 88 49 78 C41 88 32 82 34 73 C23 78 15 70 22 60 C10 55 13 44 24 41 C17 31 24 23 35 28 C38 18 44 14 50 7Z",
    veins: "M50 101 C50 78 50 48 50 16 M50 48 C40 39 33 34 27 31 M50 58 C63 49 73 43 84 40 M50 70 C38 65 29 62 21 59 M50 78 C61 74 69 72 78 68",
  },
  {
    name: "beech",
    shape: "M50 5 C61 16 73 31 78 48 C84 69 68 91 50 108 C32 91 16 69 22 48 C27 31 39 16 50 5Z",
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
        .autumn-leaf{position:absolute;top:-12%;left:var(--x);width:var(--size);height:calc(var(--size)*1.18);opacity:0;transform-origin:50% 20%;animation:autumn-drop var(--duration) linear var(--delay) infinite;will-change:top,transform,opacity}
        .autumn-leaf svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(1px 2px 2px rgba(48,30,15,.18));transform-origin:50% 50%;animation:autumn-tumble var(--flutter) ease-in-out var(--delay) infinite}
        .autumn-leaf .leaf-body{fill:var(--fill);stroke:var(--edge);stroke-width:.8;stroke-linejoin:round}
        .autumn-leaf .leaf-veins{fill:none;stroke:var(--vein);stroke-width:.85;stroke-linecap:round;opacity:.58}
        @keyframes autumn-drop{
          0%{top:-12%;transform:translate3d(0,0,0) rotate(var(--start-rot));opacity:0}
          4%{opacity:var(--leaf-opacity)}
          13%{top:10%;transform:translate3d(var(--drift-a),0,0) rotate(calc(var(--start-rot) + var(--spin-a)))}
          29%{top:27%;transform:translate3d(var(--drift-b),0,0) rotate(calc(var(--start-rot) + var(--spin-b)))}
          46%{top:45%;transform:translate3d(var(--drift-c),0,0) rotate(calc(var(--start-rot) + var(--spin-c)))}
          63%{top:63%;transform:translate3d(var(--drift-d),0,0) rotate(calc(var(--start-rot) + var(--spin-d)))}
          81%{top:82%;transform:translate3d(var(--drift-e),0,0) rotate(calc(var(--start-rot) + var(--spin-e)));opacity:var(--leaf-opacity)}
          100%{top:105%;transform:translate3d(var(--drift-f),0,0) rotate(calc(var(--start-rot) + var(--spin-f)));opacity:0}
        }
        @keyframes autumn-tumble{
          0%,100%{transform:perspective(220px) rotateY(0deg) rotateZ(-8deg) scaleX(1)}
          22%{transform:perspective(220px) rotateY(58deg) rotateZ(10deg) scaleX(.72)}
          48%{transform:perspective(220px) rotateY(150deg) rotateZ(-5deg) scaleX(.96)}
          73%{transform:perspective(220px) rotateY(245deg) rotateZ(9deg) scaleX(.7)}
        }
        @media(max-width:700px){
          .autumn-leaf{width:var(--mobile-size);height:calc(var(--mobile-size)*1.18)}
          .autumn-leaf svg{filter:drop-shadow(1px 1px 1px rgba(48,30,15,.16))}
        }
        @media(prefers-reduced-motion:reduce){.autumn-leaf-layer{display:none!important}}
      `}</style>
      {Array.from({ length: 64 }, (_, index) => {
        // Seeded pseudo-random values keep the composition varied but stable between renders.
        const rand = (salt: number) => {
          const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
          return value - Math.floor(value);
        };
        const paletteItem = palette[Math.floor(rand(1) * palette.length)];
        // Favor oak and maple while keeping a few other leaf silhouettes for variety.
        const leaf = leaves[[0, 1, 1, 0, 2, 1, 0, 3][Math.floor(rand(2) * 8)]];
        const x = 2 + rand(3) * 96;
        const size = 27 + rand(4) * 27;
        const mobileSize = 20 + rand(5) * 19;
        const duration = 24 + rand(6) * 34;
        const flutter = 1.8 + rand(7) * 2.8;
        const delay = -(rand(8) * duration);
        const style = {
          "--x": `${x}%`,
          "--size": `${size}px`,
          "--mobile-size": `${mobileSize}px`,
          "--duration": `${duration}s`,
          "--flutter": `${flutter}s`,
          "--delay": `${delay}s`,
          "--drift-a": `${(rand(9) - 0.5) * 190}px`,
          "--drift-b": `${(rand(10) - 0.5) * 260}px`,
          "--drift-c": `${(rand(11) - 0.5) * 220}px`,
          "--drift-d": `${(rand(12) - 0.5) * 280}px`,
          "--drift-e": `${(rand(13) - 0.5) * 240}px`,
          "--drift-f": `${(rand(14) - 0.5) * 300}px`,
          "--start-rot": `${rand(15) * 360 - 180}deg`,
          "--spin-a": `${rand(16) * 240 - 120}deg`,
          "--spin-b": `${rand(17) * 520 - 260}deg`,
          "--spin-c": `${rand(18) * 760 - 380}deg`,
          "--spin-d": `${rand(19) * 980 - 490}deg`,
          "--spin-e": `${rand(20) * 1280 - 640}deg`,
          "--spin-f": `${rand(21) * 1600 - 800}deg`,
          "--leaf-opacity": `${0.58 + rand(22) * 0.36}`,
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
