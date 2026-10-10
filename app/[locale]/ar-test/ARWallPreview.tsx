"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Script from "next/script";

type ArtworkChoice = { id: string | number; title: string; image: string; width: number; height: number };
type Props = { imageUrl?: string; title: string; width: number; height: number; ru: boolean; artworkChoices?: ArtworkChoice[] };
type WallFit = { center: THREE.Vector3; normal: THREE.Vector3 };

declare global {
  interface Window { XR8?: any; XRExtras?: any; LandingPage?: any; }
}

const XR_URL = "https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js";
const EXTRAS_URL = "https://cdn.jsdelivr.net/npm/@8thwall/xrextras@1/dist/xrextras.js";
const LANDING_URL = "https://cdn.jsdelivr.net/npm/@8thwall/landing-page@1/dist/landing-page.js";

function loadScript(src: string, ready: () => boolean, attrs: Record<string, string> = {}) {
  return new Promise<void>((resolve, reject) => {
    if (ready()) { resolve(); return; }
    let script = document.querySelector('script[src="' + src + '"]') as HTMLScriptElement | null;
    const finish = () => ready() ? resolve() : reject(new Error("Script loaded but API is unavailable: " + src));
    if (script) {
      if ((script as any).dataset.loaded === "true") { finish(); return; }
      script.addEventListener("load", () => { (script as any).dataset.loaded = "true"; finish(); }, { once: true });
      script.addEventListener("error", () => reject(new Error("Could not load " + src)), { once: true });
      return;
    }
    script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    Object.entries(attrs).forEach(([key, value]) => script!.setAttribute(key, value));
    script.onload = () => { (script as any).dataset.loaded = "true"; finish(); };
    script.onerror = () => reject(new Error("Could not load " + src));
    document.head.appendChild(script);
  });
}

function fitWall(points: any[], camera: THREE.Camera): WallFit | null {
  const valid = points
    .filter((p) => p && p.position && Number(p.confidence ?? 1) >= 0.04)
    .map((p) => new THREE.Vector3(Number(p.position.x), Number(p.position.y), Number(p.position.z)))
    .filter((p) => {
      const d = p.distanceTo(camera.position);
      return Number.isFinite(d) && d > 0.45 && d < 6.5;
    });
  if (valid.length < 16) return null;

  const projected = valid.filter((p) => {
    const q = p.clone().project(camera);
    return q.z > -1 && q.z < 1 && Math.abs(q.x) < 0.8 && Math.abs(q.y) < 0.8;
  });
  if (projected.length < 12) return null;
  const sample = projected.length > 160
    ? projected.filter((_, i) => i % Math.ceil(projected.length / 160) === 0).slice(0, 160)
    : projected;
  const center = sample.reduce((sum, p) => sum.add(p), new THREE.Vector3()).multiplyScalar(1 / sample.length);
  const m = [[0,0,0],[0,0,0],[0,0,0]];
  for (const p of sample) {
    const d = p.clone().sub(center);
    m[0][0] += d.x*d.x; m[0][1] += d.x*d.y; m[0][2] += d.x*d.z;
    m[1][0] += d.y*d.x; m[1][1] += d.y*d.y; m[1][2] += d.y*d.z;
    m[2][0] += d.z*d.x; m[2][1] += d.z*d.y; m[2][2] += d.z*d.z;
  }
  const v = [[1,0,0],[0,1,0],[0,0,1]];
  for (let iter = 0; iter < 18; iter++) {
    let a = 0, b = 1, largest = Math.abs(m[0][1]);
    if (Math.abs(m[0][2]) > largest) { a = 0; b = 2; largest = Math.abs(m[0][2]); }
    if (Math.abs(m[1][2]) > largest) { a = 1; b = 2; largest = Math.abs(m[1][2]); }
    if (largest < 1e-9) break;
    const angle = 0.5 * Math.atan2(2 * m[a][b], m[b][b] - m[a][a]);
    const c = Math.cos(angle), s = Math.sin(angle);
    for (let k = 0; k < 3; k++) { const x = m[k][a], y = m[k][b]; m[k][a] = c*x-s*y; m[k][b] = s*x+c*y; }
    for (let k = 0; k < 3; k++) { const x = m[a][k], y = m[b][k]; m[a][k] = c*x-s*y; m[b][k] = s*x+c*y; }
    for (let k = 0; k < 3; k++) { const x = v[k][a], y = v[k][b]; v[k][a] = c*x-s*y; v[k][b] = s*x+c*y; }
  }
  let smallest = 0;
  if (m[1][1] < m[smallest][smallest]) smallest = 1;
  if (m[2][2] < m[smallest][smallest]) smallest = 2;
  const normal = new THREE.Vector3(v[0][smallest], v[1][smallest], v[2][smallest]).normalize();
  // A wall normal is mostly horizontal; floor/ceiling normals point mostly vertically.
  if (Math.abs(normal.y) > 0.38) return null;
  const residuals = sample.map((p) => Math.abs(normal.dot(p.clone().sub(center)))).sort((a,b) => a-b);
  if (residuals[Math.floor(residuals.length * 0.6)] > 0.10) return null;
  if (normal.dot(new THREE.Vector3().subVectors(camera.position, center)) < 0) normal.negate();
  return { center, normal };
}

function wallQuaternion(normal: THREE.Vector3) {
  const z = normal.clone().normalize();
  let x = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), z).normalize();
  if (x.lengthSq() < 0.001) x = new THREE.Vector3(1, 0, 0);
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

export default function ARWallPreview({ imageUrl, title, width, height, ru, artworkChoices = [] }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const placedRef = useRef(false);
  const lastMessageRef = useRef("");
  const [selectedImage, setSelectedImage] = useState(imageUrl || "");
  const [selectedTitle, setSelectedTitle] = useState(title);
  const [selectedDimensions, setSelectedDimensions] = useState({ width, height });
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [canPlace, setCanPlace] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [message, setMessage] = useState(ru ? "Нажмите «Запустить AR» и наведите камеру на хорошо освещённую стену." : "Tap Start AR and scan a well-lit wall.");
  const [busy, setBusy] = useState(false);

  const say = (text: string) => {
    if (lastMessageRef.current !== text) { lastMessageRef.current = text; setMessage(text); }
  };

  const stopAR = () => {
    try { stopRef.current?.(); } catch {}
    stopRef.current = null;
    placedRef.current = false;
    setRunning(false);
    setCanPlace(false);
    setPlaced(false);
  };

  useEffect(() => {
    setSelectedImage(imageUrl || "");
    setSelectedTitle(title);
    setSelectedDimensions({ width, height });
  }, [imageUrl, title, width, height]);

  useEffect(() => () => {
    try { stopRef.current?.(); } catch {}
  }, []);

  const enterFullscreen = () => {
    setFullscreen(true);
    // Use native fullscreen where supported; CSS viewport mode is the fallback (including iOS Safari).
    try {
      const result = rootRef.current?.requestFullscreen?.();
      result?.catch(() => {});
    } catch {}
  };

  const closeAR = () => {
    stopAR();
    setFullscreen(false);
    try {
      if (document.fullscreenElement) {
        const result = document.exitFullscreen?.();
        result?.catch(() => {});
      }
    } catch {}
  };

  const startAR = async () => {
    if (!selectedImage || busy) return;
    enterFullscreen();
    setBusy(true);
    say(ru ? "Загружаем AR-движок и камеру…" : "Loading the AR engine and camera…");
    try {
      stopAR();
      const w = window;
      const xrLoaded = new Promise<void>((resolve, reject) => {
        const isReady = () => !!w.XR8?.Threejs?.pipelineModule && !!w.XR8?.XrController?.pipelineModule;
        if (isReady()) { resolve(); return; }

        // The event can fire before a later retry attaches its listener, so also poll the public API.
        let settled = false;
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          window.clearInterval(poll);
          window.removeEventListener("xrloaded", onLoaded);
          error ? reject(error) : resolve();
        };
        const onLoaded = () => {
          if (isReady()) finish();
        };
        const poll = window.setInterval(() => {
          if (isReady()) finish();
        }, 100);
        const timer = window.setTimeout(() => {
          finish(new Error("8th Wall loaded, but its XR8 APIs did not become ready within 20 seconds"));
        }, 20000);
        window.addEventListener("xrloaded", onLoaded);
      });
      // XR8 is loaded by Next Script when this page mounts. Wait for its API to become available.
      await xrLoaded;
      await loadScript(EXTRAS_URL, () => !!w.XRExtras);
      await loadScript(LANDING_URL, () => !!w.LandingPage);
      if (!w.XR8?.Threejs?.pipelineModule || !w.XR8?.XrController?.pipelineModule) {
        throw new Error("8th Wall engine APIs are missing");
      }

      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = selectedImage;
      await image.decode();
      const texture = new THREE.Texture(image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      const artWidth = Math.max(0.08, selectedDimensions.width > 0 ? selectedDimensions.width / 100 : 40 / 100);
      const artHeight = Math.max(0.08, selectedDimensions.height > 0 ? selectedDimensions.height / 100 : artWidth * image.naturalHeight / image.naturalWidth);
      const thickness = 0.018;

      const canvas = document.createElement("canvas");
      canvas.className = "ar-three-canvas";
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.zIndex = "2";
      canvas.style.display = "block";
      canvas.style.touchAction = "none";
      rootRef.current?.appendChild(canvas);
      if (!rootRef.current) throw new Error("AR viewport is unavailable");

      let scene: THREE.Scene | null = null;
      let camera: THREE.Camera | null = null;
      let artwork: THREE.Group | null = null;
      let guide: THREE.Mesh | null = null;
      let stable: { center: THREE.Vector3; normal: THREE.Vector3; frames: number } | null = null;
      let updateSeen = false;
      let disposed = false;

      const initModule = {
        name: "petit-sot-clean-wall-ar",
        onCameraStatusChange: ({ status }: any) => {
          if (status === "requesting") say(ru ? "Запрашиваем доступ к камере…" : "Requesting camera access…");
          if (status === "hasStream") say(ru ? "Камера подключена. Медленно сканируйте стену…" : "Camera connected. Slowly scan the wall…");
          if (status === "failed") say(ru ? "Не удалось открыть камеру. Проверьте разрешение браузера." : "Could not open the camera. Check browser permissions.");
        },
        onStart: ({ canvas: startedCanvas }: any) => {
          const xr = w.XR8.Threejs.xrScene();
          scene = xr.scene as THREE.Scene;
          camera = xr.camera as THREE.Camera;
          const renderer = xr.renderer as THREE.WebGLRenderer;
          const rect = rootRef.current!.getBoundingClientRect();
          renderer.setSize(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)), false);
          // Keep the camera/render canvas inside the fullscreen AR surface. FullWindowCanvas
          // can lift it out of this stacking context, where the opaque fullscreen panel hides it.
          startedCanvas.style.position = "absolute";
          startedCanvas.style.inset = "0";
          startedCanvas.style.width = "100%";
          startedCanvas.style.height = "100%";
          startedCanvas.style.zIndex = "2";
          startedCanvas.style.pointerEvents = "none";

          const backing = new THREE.Mesh(
            new THREE.BoxGeometry(artWidth, artHeight, thickness),
            new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.8 })
          );
          const front = new THREE.Mesh(
            new THREE.PlaneGeometry(artWidth, artHeight),
            new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
          );
          front.position.z = thickness / 2 + 0.002;
          artwork = new THREE.Group();
          artwork.add(backing, front);
          artwork.visible = false;
          scene.add(artwork);

          guide = new THREE.Mesh(
            new THREE.PlaneGeometry(artWidth, artHeight),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
          );
          guide.visible = false;
          scene.add(guide);
          scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 1.0));
          say(ru ? "Ищем плоскость стены…" : "Finding the wall plane…");
        },
        onCanvasSizeChange: ({ canvasWidth, canvasHeight }: any) => {
          try { (w.XR8.Threejs.xrScene().renderer as THREE.WebGLRenderer).setSize(canvasWidth, canvasHeight, false); } catch {}
        },
        onUpdate: ({ processCpuResult }: any) => {
          if (!camera || !scene || !artwork || disposed || placedRef.current) return;
          const reality = processCpuResult?.reality;
          if (!updateSeen) {
            updateSeen = true;
            say(ru ? "Трекинг запущен — сканируем стену…" : "Tracking is active — scanning the wall…");
          }
          if (reality?.trackingStatus !== "NORMAL" || !Array.isArray(reality.worldPoints)) {
            stable = null;
            artwork.visible = false;
            if (guide) guide.visible = false;
            setCanPlace(false);
            return;
          }
          const fit = fitWall(reality.worldPoints, camera);
          if (!fit) {
            // Fallback: 8th Wall can report active tracking while exposing too few usable world
            // points for our strict plane fit. Keep placement actionable by previewing a vertical
            // plane about 1.5 m in front of the camera; once the user taps Place, that transform
            // stays fixed in world space. A valid detected wall plane still takes priority below.
            stable = null;
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            const horizontalForward = new THREE.Vector3(forward.x, 0, forward.z);
            if (horizontalForward.lengthSq() < 0.001) horizontalForward.set(0, 0, -1);
            horizontalForward.normalize();
            const fallbackCenter = camera.position.clone().add(forward.normalize().multiplyScalar(1.5));
            fallbackCenter.y = camera.position.y;
            const fallbackNormal = horizontalForward.clone().negate();
            const fallbackPosition = fallbackCenter.clone().add(fallbackNormal.clone().multiplyScalar(thickness / 2 + 0.004));
            artwork.position.copy(fallbackPosition);
            artwork.quaternion.copy(wallQuaternion(fallbackNormal));
            artwork.visible = true;
            if (guide) {
              guide.position.copy(fallbackPosition);
              guide.quaternion.copy(wallQuaternion(fallbackNormal));
              guide.visible = true;
            }
            setCanPlace(true);
            say(ru ? "Стена не распознана точно. Наведите картину на нужное место и нажмите «Закрепить картину»." : "Wall plane is approximate. Aim the artwork where you want it and tap Place artwork.");
            return;
          }
          if (stable && stable.center.distanceTo(fit.center) < 0.09 && stable.normal.angleTo(fit.normal) < 12 * Math.PI / 180) {
            stable.frames = Math.min(20, stable.frames + 1);
            stable.center.lerp(fit.center, 0.15);
            stable.normal.lerp(fit.normal, 0.15).normalize();
          } else {
            stable = { center: fit.center.clone(), normal: fit.normal.clone(), frames: 1 };
          }
          if (stable.frames < 4) {
            artwork.visible = false;
            if (guide) guide.visible = false;
            setCanPlace(false);
            say(ru ? "Стабилизируем положение стены…" : "Stabilizing wall tracking…");
            return;
          }
          const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(stable.normal, stable.center);
          const ray = new THREE.Raycaster();
          ray.setFromCamera(new THREE.Vector2(0, 0), camera);
          const hit = new THREE.Vector3();
          if (!ray.ray.intersectPlane(plane, hit)) {
            artwork.visible = false;
            if (guide) guide.visible = false;
            setCanPlace(false);
            return;
          }
          const position = hit.clone().add(stable.normal.clone().multiplyScalar(thickness / 2 + 0.004));
          const rotation = wallQuaternion(stable.normal);
          artwork.position.copy(position);
          artwork.quaternion.copy(rotation);
          artwork.visible = true;
          if (guide) {
            guide.position.copy(position);
            guide.quaternion.copy(rotation);
            guide.visible = true;
          }
          setCanPlace(true);
          say(ru ? "Стена найдена. Нажмите «Закрепить картину»." : "Wall found. Tap Place artwork to lock it.");
        },
        onException: ({ error }: any) => say((ru ? "Ошибка AR: " : "AR error: ") + (error?.message || error?.name || "unknown")),
      };

      // The 8th Wall Three.js pipeline reads THREE from the global window object.
      // Next.js bundles the import locally, so expose the same instance before creating the pipeline module.
      (w as any).THREE = THREE;
      w.XR8.stop?.();
      w.XR8.clearCameraPipelineModules?.();
      w.XR8.XrController.configure({ disableWorldTracking: false, enableLighting: true, enableWorldPoints: true, scale: "absolute" });
      w.XR8.addCameraPipelineModules([
        w.XR8.GlTextureRenderer.pipelineModule(),
        w.XR8.Threejs.pipelineModule(),
        w.XR8.XrController.pipelineModule(),
        w.LandingPage.pipelineModule(),
        w.XRExtras.Loading.pipelineModule(),
        w.XRExtras.RuntimeError.pipelineModule(),
        initModule,
      ]);
      w.XR8.run({ canvas });
      stopRef.current = () => {
        disposed = true;
        try { w.XR8.stop?.(); } catch {}
        try { w.XR8.clearCameraPipelineModules?.(); } catch {}
        try { texture.dispose(); } catch {}
        try { scene?.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material: any) => material?.dispose?.());
        }); } catch {}
        try { canvas.remove(); } catch {}
      };
      setRunning(true);
      setPlaced(false);
      setCanPlace(false);
      placedRef.current = false;
    } catch (error) {
      console.error("AR start failed", error);
      say((ru ? "Не удалось запустить AR: " : "Could not start AR: ") + (error instanceof Error ? error.message : "unknown error"));
      stopAR();
    } finally {
      setBusy(false);
    }
  };

  const placeArtwork = () => {
    if (!canPlace) return;
    placedRef.current = true;
    setPlaced(true);
    setCanPlace(false);
    say(ru ? "Картина закреплена. Если хотите начать заново, нажмите ↻." : "Artwork placed. Tap ↻ to start over.");
    // The last tracked transform is intentionally kept in the Three.js scene.
  };

  const resetAR = () => {
    stopAR();
    say(ru ? "Нажмите «Запустить AR» и наведите камеру на хорошо освещённую стену." : "Tap Start AR and scan a well-lit wall.");
  };

  return (
    <section className={`ar-preview${fullscreen ? " is-fullscreen" : ""}`} ref={rootRef}>
      <Script
        src={XR_URL}
        strategy="afterInteractive"
        crossOrigin="anonymous"
        data-preload-chunks="slam"
      />
      <div className="ar-topbar">
        <span>{running ? "PETIT.SOT STUDIO / LIVE AR" : "PETIT.SOT STUDIO / AR TEST"}</span>
        <div className="ar-topbar-actions">
          <button type="button" onClick={resetAR} aria-label={ru ? "Перезапустить" : "Restart"}>↻</button>
          {fullscreen && <button className="ar-close" type="button" onClick={closeAR} aria-label={ru ? "Закрыть камеру" : "Close camera"} title={ru ? "Закрыть" : "Close"}>×</button>}
        </div>
      </div>
      {!running && (
        <div className="ar-start">
          <p>{ru ? "Разместите работу на стене в реальном пространстве. Нужен доступ к камере." : "Preview the artwork on your real wall. Camera access is required."}</p>
          <button type="button" onClick={startAR} disabled={busy}>{busy ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Запустить AR" : "Start AR")}</button>
          {artworkChoices.length > 1 && (
            <select
              aria-label={ru ? "Выбрать картину" : "Choose artwork"}
              value={selectedImage}
              onChange={(event) => {
                const choice = artworkChoices.find((item) => item.image === event.target.value);
                if (!choice) return;
                setSelectedImage(choice.image);
                setSelectedTitle(choice.title);
                setSelectedDimensions({ width: choice.width, height: choice.height });
              }}
              style={{ width: "100%", marginTop: 9, padding: 10, background: "rgba(255,255,255,.95)", color: "#171717", border: 0 }}
            >
              {artworkChoices.map((choice) => <option key={choice.id} value={choice.image}>{choice.title}</option>)}
            </select>
          )}
        </div>
      )}
      {running && (
        <div className="ar-controls">
          <span>{selectedTitle} · {selectedDimensions.width || "—"} × {selectedDimensions.height || "—"} cm</span>
          <span>{message}</span>
          <button className="ar-place" type="button" onClick={placeArtwork} disabled={!canPlace || placed}>
            {placed ? (ru ? "Картина закреплена" : "Artwork placed") : (ru ? "Закрепить картину" : "Place artwork")}
          </button>
        </div>
      )}
      {!running && <div className="ar-ar-note" style={{ position: "absolute", left: 14, right: 14, bottom: 14, zIndex: 4, color: "#fff", textAlign: "center" }}>{message}</div>}
    </section>
  );
}
