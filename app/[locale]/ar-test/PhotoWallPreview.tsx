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
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
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

  const capturePreview = async () => {
    if (!roomImage || !choice) return;
    try {
      const room = new Image();
      room.src = roomImage;
      await new Promise<void>((resolve, reject) => {
        room.onload = () => resolve();
        room.onerror = () => reject(new Error("Could not load room photo"));
      });
      const output = document.createElement("canvas");
      output.width = room.naturalWidth;
      output.height = room.naturalHeight;
      const ctx = output.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(room, 0, 0);
      const art = new Image();
      art.crossOrigin = "anonymous";
      art.src = selected;
      await new Promise<void>((resolve, reject) => {
        art.onload = () => resolve();
        art.onerror = () => reject(new Error("Could not load artwork"));
      });
      const stage = stageRef.current;
      if (!stage) return;
      const scaleX = output.width / stage.clientWidth;
      const scaleY = output.height / stage.clientHeight;
      const artWidth = stage.clientWidth * size / 100;
      const artHeight = artWidth * (choice.height / Math.max(1, choice.width));
      const centerX = output.width * position.x / 100;
      const centerY = output.height * position.y / 100;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotateZ * Math.PI / 180);
      ctx.scale(scaleX, scaleY);
      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 5;
      ctx.drawImage(art, -artWidth / 2, -artHeight / 2, artWidth, artHeight);
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(25, 22, 18, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-artWidth / 2, -artHeight / 2, artWidth, artHeight);
      ctx.restore();
      const link = document.createElement("a");
      link.download = "petitsot-room-preview.png";
      link.href = output.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Could not capture room preview:", error);
      window.alert(ru ? "Не удалось сохранить фото. Попробуйте другое изображение." : "Could not save the photo. Please try another image.");
    }
  };

  const reset = () => {
    setPosition({ x: 50, y: 48 });
    setSize(34);
    setRotateX(0);
    setRotateY(0);
    setRotateZ(0);
  };

  return (
    <section className="photo-wall-tool">
      <div className="photo-wall-heading">
        <span className="eyebrow">{ru ? "АЛЬТЕРНАТИВА AR" : "AR ALTERNATIVE"}</span>
        <h2>{ru ? "Примерьте картину на фото стены" : "Preview artwork on your wall photo"}</h2>
        <p>{ru ? "Загрузите фото комнаты, затем перетащите картину на стену и настройте её угол." : "Upload a room photo, then drag the artwork onto the wall and adjust its angle."}</p>
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
              <button
                className="photo-wall-empty"
                type="button"
                onClick={() => uploadRef.current?.click()}
                aria-label={ru ? "Загрузить фото комнаты" : "Upload a room photo"}
              >
                <span>+</span>
                <strong>{ru ? "Загрузить фото комнаты" : "Upload a room photo"}</strong>
                <small>{ru ? "Нажмите здесь или выберите фото ниже" : "Tap here or use the button below"}</small>
              </button>
            )}
            {roomImage && selected && (
              <div
                className="photo-wall-art"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  width: `${size}%`,
                  aspectRatio: `${Math.max(1, choice?.width || 1)} / ${Math.max(1, choice?.height || 1)}`,
                  transform: `translate(-50%, -50%) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                  transformStyle: "preserve-3d",
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
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                loadRoom(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
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
            <span>{ru ? "Наклон влево / вправо" : "Tilt left / right"} · {rotateZ}°</span>
            <input type="range" min="-180" max="180" value={rotateZ} onChange={(event) => setRotateZ(Number(event.target.value))} />
          </label>
          <label>
            <span>{ru ? "Перспектива по горизонтали" : "Horizontal perspective"} · {rotateY}°</span>
            <input type="range" min="-75" max="75" value={rotateY} onChange={(event) => setRotateY(Number(event.target.value))} />
          </label>
          <label>
            <span>{ru ? "Перспектива по вертикали" : "Vertical perspective"} · {rotateX}°</span>
            <input type="range" min="-75" max="75" value={rotateX} onChange={(event) => setRotateX(Number(event.target.value))} />
          </label>
          <div className="photo-wall-actions">
            <button type="button" onClick={reset}>{ru ? "Сбросить положение и угол" : "Reset position and angles"}</button>
            {roomImage && <button type="button" onClick={() => setRoomImage("")}>{ru ? "Удалить фото" : "Remove photo"}</button>}
          </div>
          <p>{ru ? "Перетаскивайте картину пальцем. Три ползунка позволяют повернуть её вокруг всех осей." : "Drag the artwork with your finger. The three angle controls rotate it on all axes."}</p>
        </div>
      </div>
    </section>
  );
}
