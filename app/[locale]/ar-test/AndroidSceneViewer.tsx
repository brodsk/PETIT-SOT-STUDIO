"use client";

import { useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const ModelViewer = "model-viewer" as any;

type ArtworkChoice = { id: string | number; title: string; image: string; width: number; height: number };

export default function AndroidSceneViewer({ ru, artworkChoices }: { ru: boolean; artworkChoices: ArtworkChoice[] }) {
  const [selected, setSelected] = useState(artworkChoices[0]?.image || "");
  const [modelUrl, setModelUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const artwork = useMemo(() => artworkChoices.find((item) => item.image === selected) || artworkChoices[0], [artworkChoices, selected]);

  const prepareModel = async () => {
    if (!artwork || busy) return;
    setBusy(true);
    setError("");
    setModelUrl("");
    try {
      const response = await fetch(artwork.image, { mode: "cors", cache: "force-cache" });
      if (!response.ok) throw new Error("Could not load the artwork image.");
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = true;
      texture.needsUpdate = true;
      const width = Math.max(0.08, (artwork.width || 30) / 100);
      const height = Math.max(0.08, (artwork.height || 30) / 100);
      const depth = 0.018;
      const scene = new THREE.Scene();

      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({ color: 0x191919, roughness: 0.85, metalness: 0 }),
      );
      backing.position.z = -depth / 2;
      const front = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide }),
      );
      front.position.z = 0.001;
      scene.add(backing, front);

      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(scene, { binary: true, onlyVisible: true });
      if (!(result instanceof ArrayBuffer)) throw new Error("Could not create the GLB model.");
      const upload = await fetch("/api/ar-glb", {
        method: "POST",
        headers: { "Content-Type": "model/gltf-binary" },
        body: result,
      });
      const uploaded = await upload.json().catch(() => ({}));
      if (!upload.ok || !uploaded.url) throw new Error(uploaded.error || "Could not save the AR model.");
      setModelUrl(uploaded.url);
      texture.dispose();
      backing.geometry.dispose();
      front.geometry.dispose();
      backing.material.dispose();
      front.material.dispose();
    } catch (e) {
      console.error("Android Scene Viewer model preparation failed:", e);
      setError(ru
        ? "Не удалось подготовить AR-модель. Проверьте подключение и настройки AR-хранилища."
        : "Could not prepare the AR model. Check your connection and AR storage configuration.");
    } finally {
      setBusy(false);
    }
  };

  if (!artworkChoices.length) return null;

  return (
    <section className="apple-quicklook android-scene-viewer">
      <div className="apple-quicklook-copy">
        <span className="eyebrow">ANDROID / GOOGLE SCENE VIEWER</span>
        <h2>{ru ? "Разместить картину на стене" : "Place the artwork on your wall"}</h2>
        <p>{ru
          ? "Стандартный AR-режим Android: картина открывается в просмотрщике Google и размещается на вертикальной поверхности в реальном размере."
          : "Native Android AR: open the artwork in Google's viewer and place it on a vertical surface at its real-world size."}</p>
      </div>
      <label className="apple-quicklook-select">
        <span>{ru ? "Выберите картину" : "Choose artwork"}</span>
        <select value={selected} onChange={(event) => { setSelected(event.target.value); setModelUrl(""); setError(""); }}>
          {artworkChoices.map((item) => <option key={item.id} value={item.image}>{item.title}</option>)}
        </select>
      </label>
      {!modelUrl ? (
        <button className="apple-quicklook-button" type="button" onClick={prepareModel} disabled={busy || !artwork}>
          {busy ? (ru ? "ГОТОВИМ МОДЕЛЬ…" : "PREPARING MODEL…") : (ru ? "ПОДГОТОВИТЬ AR ↗" : "PREPARE AR ↗")}
        </button>
      ) : (
        <div className="apple-quicklook-ready">
          <ModelViewer
            src={modelUrl}
            alt={artwork.title}
            ar
            ar-modes="scene-viewer"
            ar-placement="wall"
            ar-scale="fixed"
            camera-controls
            touch-action="pan-y"
            style={{ width: "100%", height: "320px", background: "transparent" }}
          >
            <button slot="ar-button" className="apple-quicklook-button" type="button">
              {ru ? "РАЗМЕСТИТЬ НА СТЕНЕ ↗" : "PLACE ON WALL ↗"}
            </button>
          </ModelViewer>
          <button type="button" className="apple-quicklook-reset" onClick={() => setModelUrl("")}>
            {ru ? "Выбрать другую работу" : "Choose another artwork"}
          </button>
        </div>
      )}
      {error && <p className="apple-quicklook-error" role="alert">{error}</p>}
      <p className="apple-quicklook-note">{ru
        ? "Нужен совместимый Android с ARCore и актуальными сервисами Google. Если AR недоступен, можно посмотреть модель в 3D."
        : "Requires an ARCore-compatible Android device with up-to-date Google services. If AR is unavailable, the model can still be viewed in 3D."}</p>
    </section>
  );
}
