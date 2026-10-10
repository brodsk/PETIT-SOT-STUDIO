"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { USDZExporter } from "three/addons/exporters/USDZExporter.js";

type ArtworkChoice = { id: string | number; title: string; image: string; width: number; height: number };

export default function AppleQuickLook({ ru, artworkChoices }: { ru: boolean; artworkChoices: ArtworkChoice[] }) {
  const [selected, setSelected] = useState(artworkChoices[0]?.image || "");
  const [usdzUrl, setUsdzUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const artwork = useMemo(() => artworkChoices.find((item) => item.image === selected) || artworkChoices[0], [artworkChoices, selected]);

  useEffect(() => {
    const anchor = document.createElement("a");
    setSupported(Boolean(anchor.relList && anchor.relList.supports("ar")));
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  }, []);

  useEffect(() => {
    setUsdzUrl("");
    setError("");
  }, [selected]);

  const createUSDZ = async () => {
    if (!artwork) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(artwork.image, { mode: "cors", cache: "force-cache" });
      if (!response.ok) throw new Error("Image download failed");
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = true;
      texture.needsUpdate = true;
      const widthMeters = Math.max(0.05, (artwork.width || 30) / 100);
      const heightMeters = Math.max(0.05, (artwork.height || 30) / 100);
      const geometry = new THREE.PlaneGeometry(widthMeters, heightMeters);
      const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.92, metalness: 0 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "PETIT_SOT_Artwork";
      // Keep the artwork upright and flip its facing direction for Quick Look wall placement.
      mesh.rotation.y = -Math.PI / 2;
      const scene = new THREE.Scene();
      scene.add(mesh);

      const exporter = new USDZExporter();
      const bytes = await exporter.parseAsync(scene, { quickLookCompatible: true, ar: { anchoring: { type: "plane" }, planeAnchoring: { alignment: "vertical" } } });
      const usdzBlob = new Blob([bytes], { type: "model/vnd.usdz+zip" });
      const uploadResponse = await fetch("/api/ar-usdz", {
        method: "POST",
        headers: { "Content-Type": "model/vnd.usdz+zip" },
        body: usdzBlob,
      });
      const uploadResult = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploadResult.url) {
        throw new Error(uploadResult.error || "Could not save the USDZ model");
      }
      setUsdzUrl(uploadResult.url);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    } catch (e) {
      console.error("AR Quick Look USDZ generation failed", e);
      setError(e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY")
        ? (ru
          ? "Хранилище AR не настроено: добавьте SUPABASE_SERVICE_ROLE_KEY в переменные окружения Vercel и создайте публичный bucket ar-models в Supabase Storage."
          : "AR storage is not configured: add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables and create a public ar-models bucket in Supabase Storage.")
        : (ru
          ? "Не удалось подготовить или сохранить AR-модель. Проверьте подключение и настройки хранилища, затем попробуйте ещё раз."
          : "Could not prepare or save the AR model. Check the connection and storage setup, then try again."));
    } finally {
      setBusy(false);
    }
  };

  if (!artworkChoices.length) return null;

  return (
    <section className="apple-quicklook">
      <div className="apple-quicklook-copy">
        <span className="eyebrow">APPLE AR QUICK LOOK</span>
        <h2>{ru ? "Примерить картину на стене" : "Place the artwork on your wall"}</h2>
        <p>{ru
          ? "Для iPhone: создаём AR-модель в реальном размере и открываем системный просмотрщик Apple. Лучше всего работает в Safari."
          : "For iPhone: create a real-scale AR model and open Apple's built-in viewer. Safari is recommended."}</p>
      </div>
      <label className="apple-quicklook-select">
        <span>{ru ? "Выберите работу" : "Choose artwork"}</span>
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          {artworkChoices.map((item) => <option key={item.id} value={item.image}>{item.title}</option>)}
        </select>
      </label>
      {!usdzUrl ? (
        <button className="apple-quicklook-button" type="button" onClick={createUSDZ} disabled={busy || !artwork}>
          {busy ? (ru ? "ГОТОВИМ AR-МОДЕЛЬ…" : "PREPARING AR MODEL…") : (ru ? "ПОДГОТОВИТЬ AR ДЛЯ IPHONE ↗" : "PREPARE IPHONE AR ↗")}
        </button>
      ) : (
        <div className="apple-quicklook-ready">
          {(supported || isIOS) ? (
            <>
              <a rel="ar" href={usdzUrl} className="apple-quicklook-image-link" aria-label={ru ? "Открыть картину в AR Quick Look" : "Open artwork in AR Quick Look"}>
                <img src={artwork.image} alt={artwork.title} />
              </a>
              <span className="apple-quicklook-link-label">{ru ? "ОТКРЫТЬ В AR QUICK LOOK ↗" : "OPEN IN AR QUICK LOOK ↗"}</span>
            </>
          ) : (
            <a className="apple-quicklook-link" href={usdzUrl} download="petit-sot-artwork.usdz">
              <img src={artwork.image} alt={artwork.title} />
              <span>{ru ? "СКАЧАТЬ AR-МОДЕЛЬ (.USDZ)" : "DOWNLOAD AR MODEL (.USDZ)"}</span>
            </a>
          )}
          {!(supported || isIOS) && <p>{ru ? "Откройте эту страницу в Safari на iPhone, чтобы запустить AR Quick Look. На других устройствах можно скачать USDZ." : "Open this page in Safari on iPhone to launch AR Quick Look. On other devices you can download the USDZ file."}</p>}
          {isIOS && !supported && <p>{ru ? "Если вы уже в Safari, обновите страницу и попробуйте снова." : "If you're already in Safari, reload the page and try again."}</p>}
          <button type="button" className="apple-quicklook-reset" onClick={() => setUsdzUrl("")}>{ru ? "Выбрать другую работу" : "Choose another artwork"}</button>
        </div>
      )}
      {error && <p className="apple-quicklook-error" role="alert">{error}</p>}
      <p className="apple-quicklook-footnote">{ru
        ? `Размер модели: ${Math.max(1, artwork.width || 30)} × ${Math.max(1, artwork.height || 30)} см. В Quick Look можно двигать и масштабировать объект жестами.`
        : `Model size: ${Math.max(1, artwork.width || 30)} × ${Math.max(1, artwork.height || 30)} cm. Quick Look lets you move and scale the object with gestures.`}</p>
    </section>
  );
}
