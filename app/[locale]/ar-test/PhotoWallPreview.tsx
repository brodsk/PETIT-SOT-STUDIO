"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  ru: boolean;
  artworkChoices: { id: string | number; title: string; image: string; width: number; height: number }[];
};

export default function PhotoWallPreview({ ru, artworkChoices }: Props) {
  const [roomImage, setRoomImage] = useState("");
  const [selected, setSelected] = useState(artworkChoices[0]?.image || "");
  const [size, setSize] = useState(34);
  const [position, setPosition] = useState({ x: 50, y: 48 });
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const choice = useMemo(() => artworkChoices.find((item) => item.image === selected) || artworkChoices[0], [artworkChoices, selected]);

  const loadRoom = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setRoomImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    dragOffset.current = {
      x: (event.clientX - bounds.left) / bounds.width * 100 - position.x,
      y: (event.clientY - bounds.top) / bounds.height * 100 - position.y,
    };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setPosition({
      x: Math.max(5, Math.min(95, (event.clientX - bounds.left) / bounds.width * 100 - dragOffset.current.x)),
      y: Math.max(5, Math.min(95, (event.clientY - bounds.top) / bounds.height * 100 - dragOffset.current.y)),
    });
  };

  return (
    <section className="photo-wall-tool">
      <div className="photo-wall-heading">
        <span className="eyebrow">{ru ? "АЛЬТЕРНАТИВА AR" : "AR ALTERNATIVE"}</span>
        <h2>{ru ? "Примерьте картину на фото стены" : "Preview artwork on your wall photo"}</h2>
        <p>{ru ? "Работает на Android и iPhone без ARCore и специальных AR-функций. Загрузите фото комнаты, затем перетащите картину на стену." : "Works on Android and iPhone without ARCore or special AR support. Upload a room photo, then drag the artwork onto the wall."}</p>
      </div>
      <div className="photo-wall-layout">
        <div className="photo-wall-stage-wrap">
          <div
            className={`photo-wall-stage${roomImage ? " has-room" : ""}`}
            ref={stageRef}
            onPointerMove={onPointerMove}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
          >
            {roomImage ? (
              <img className="photo-wall-room" src={roomImage} alt={ru ? "Фото комнаты" : "Room photo"} />
            ) : (
              <div className="photo-wall-empty">
                <span>+</span>
                <strong>{ru ? "Загрузите фото комнаты" : "Upload a room photo"}</strong>
                <small>{ru ? "Лучше всего — фото стены прямо спереди" : "A straight-on photo of the wall works best"}</small>
              </div>
            )}
            {roomImage && selected && (
              <div
                className="photo-wall-art"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${size}%`,
                  aspectRatio: `${Math.max(1, choice?.width || 1)} / ${Math.max(1, choice?.height || 1)}`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
                onPointerDown={onPointerDown}
                role="slider"
                aria-label={ru ? "Переместить картину" : "Move artwork"}
                aria-valuemin={5}
                aria-valuemax={95}
                aria-valuenow={Math.round(position.x)}
                tabIndex={0}
              >
                <img src={selected} alt={choice?.title || "Artwork"} draggable={false} />
              </div>
            )}
          </div>
          <label className="photo-wall-upload">
            <span>{ru ? "Выбрать фото комнаты" : "Choose room photo"}</span>
            <input type="file" accept="image/*" onChange={(event) => loadRoom(event.target.files?.[0])} />
          </label>
        </div>
        <div className="photo-wall-controls">
          <label>
            <span>{ru ? "Картина" : "Artwork"}</span>
            <select value={selected} onChange={(event) => setSelected(event.target.value)}>
              {artworkChoices.map((item) => <option key={item.id} value={item.image}>{item.title}</option>)}
            </select>
          </label>
          <label>
            <span>{ru ? "Размер на фото" : "Size on photo"}</span>
            <input type="range" min="8" max="72" value={size} onChange={(event) => setSize(Number(event.target.value))} />
          </label>
          <label>
            <span>{ru ? "Наклон" : "Rotation"}</span>
            <input type="range" min="-12" max="12" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} />
          </label>
          <div className="photo-wall-actions">
            <button type="button" onClick={() => { setPosition({ x: 50, y: 48 }); setSize(34); setRotation(0); }}>{ru ? "Сбросить положение" : "Reset placement"}</button>
            {roomImage && <button type="button" onClick={() => setRoomImage("")}>{ru ? "Удалить фото" : "Remove photo"}</button>}
          </div>
          <p>{ru ? "Перетаскивайте картину пальцем. Размер сохраняет пропорции оригинала, но масштаб на фотографии подбирается вручную." : "Drag the artwork with your finger. Its proportions are preserved; match the scale to your room photo manually."}</p>
        </div>
      </div>
    </section>
  );
}
