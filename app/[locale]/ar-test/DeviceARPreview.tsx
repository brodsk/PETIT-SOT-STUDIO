"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AndroidSceneViewer from "./AndroidSceneViewer";

type ArtworkChoice = { id: string | number; title: string; image: string; width: number; height: number };

const ARWallPreview = dynamic(() => import("./ARWallPreview"), {
  ssr: false,
  loading: () => <section className="apple-quicklook"><p>Loading AR preview…</p></section>,
});
type Props = { ru: boolean; artworkChoices: ArtworkChoice[] };

export default function DeviceARPreview({ ru, artworkChoices }: Props) {
  const [device, setDevice] = useState<"checking" | "android" | "other">("checking");

  useEffect(() => {
    setDevice(/android/i.test(navigator.userAgent) ? "android" : "other");
  }, []);

  if (!artworkChoices.length) return null;
  if (device === "checking") {
    return <section className="apple-quicklook"><p>{ru ? "Определяем устройство…" : "Detecting device…"}</p></section>;
  }
  if (device === "android") {
    return <AndroidSceneViewer ru={ru} artworkChoices={artworkChoices} />;
  }

  const first = artworkChoices[0];
  return (
    <ARWallPreview
      imageUrl={first.image}
      title={first.title}
      width={first.width}
      height={first.height}
      ru={ru}
      artworkChoices={artworkChoices}
    />
  );
}
