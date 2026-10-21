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
  const cameraRef = useRef<HTMLInputElement>(null);
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
      const stageBounds = stage.getBoundingClientRect();
      const roomScale = Math.min(stage.clientWidth / room.naturalWidth, stage.clientHeight / room.naturalHeight);
      const renderedWidth = room.naturalWidth * roomScale;
      const renderedHeight = room.naturalHeight * roomScale;
      const offsetX = (stage.clientWidth - renderedWidth) / 2;
      const offsetY = (stage.clientHeight - renderedHeight) / 2;
      const scale = output.width / renderedWidth;
      const artWidthCss = stage.clientWidth * size / 100;
      const artHeightCss = artWidthCss * (art.naturalHeight / Math.max(1, art.naturalWidth));
      const centerX = ((stage.clientWidth * position.x / 100) - offsetX) / renderedWidth * output.width;
      const centerY = ((stage.clientHeight * position.y / 100) - offsetY) / renderedHeight * output.height;
      const w = artWidthCss * scale, h = artHeightCss * scale;
      const rx = rotateX * Math.PI / 180, ry = rotateY * Math.PI / 180, rz = rotateZ * Math.PI / 180;
      const camera = 900 * scale;
      const project = (x: number, y: number, z = 0) => {
        const x1=x*Math.cos(rz)-y*Math.sin(rz), y1=x*Math.sin(rz)+y*Math.cos(rz);
        const x2=x1*Math.cos(ry)+z*Math.sin(ry), z2=-x1*Math.sin(ry)+z*Math.cos(ry);
        const y3=y1*Math.cos(rx)-z2*Math.sin(rx), z3=y1*Math.sin(rx)+z2*Math.cos(rx);
        const p=camera/Math.max(1,camera-z3);
        return {x:centerX+x2*p,y:centerY+y3*p};
      };
      const point=(u:number,v:number)=>project((u-.5)*w,(v-.5)*h);
      const triangle=(p0:any,p1:any,p2:any,s0:any,s1:any,s2:any)=>{
        const den=s0.x*(s1.y-s2.y)+s1.x*(s2.y-s0.y)+s2.x*(s0.y-s1.y);
        if(Math.abs(den)<.0001)return;
        const a=(p0.x*(s1.y-s2.y)+p1.x*(s2.y-s0.y)+p2.x*(s0.y-s1.y))/den;
        const c1=(p0.x*(s2.x-s1.x)+p1.x*(s0.x-s2.x)+p2.x*(s1.x-s0.x))/den;
        const e=(p0.x*(s1.x*s2.y-s2.x*s1.y)+p1.x*(s2.x*s0.y-s0.x*s2.y)+p2.x*(s0.x*s1.y-s1.x*s0.y))/den;
        const b=(p0.y*(s1.y-s2.y)+p1.y*(s2.y-s0.y)+p2.y*(s0.y-s1.y))/den;
        const d=(p0.y*(s2.x-s1.x)+p1.y*(s0.x-s2.x)+p2.y*(s1.x-s0.x))/den;
        const f=(p0.y*(s1.x*s2.y-s2.x*s1.y)+p1.y*(s2.x*s0.y-s0.x*s2.y)+p2.y*(s0.x*s1.y-s1.x*s0.y))/den;
        // Expand each clipped triangle slightly to cover anti-aliased seams between mesh cells.
        const cx=(p0.x+p1.x+p2.x)/3, cy=(p0.y+p1.y+p2.y)/3;
        const expand=(p:any)=>{const dx=p.x-cx,dy=p.y-cy,len=Math.hypot(dx,dy)||1;return{x:p.x+dx/len*1.25,y:p.y+dy/len*1.25};};
        const q0=expand(p0),q1=expand(p1),q2=expand(p2);
        ctx.save();ctx.beginPath();ctx.moveTo(q0.x,q0.y);ctx.lineTo(q1.x,q1.y);ctx.lineTo(q2.x,q2.y);ctx.closePath();ctx.clip();
        ctx.transform(a,b,c1,d,e,f);ctx.drawImage(art,0,0);ctx.restore();
      };
      const corners=[point(0,0),point(1,0),point(1,1),point(0,1)];
      ctx.save();
      const grid=12;
      for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){
        const u0=x/grid,v0=y/grid,u1=(x+1)/grid,v1=(y+1)/grid;
        const p00=point(u0,v0),p10=point(u1,v0),p01=point(u0,v1),p11=point(u1,v1);
        const s00={x:u0*art.naturalWidth,y:v0*art.naturalHeight},s10={x:u1*art.naturalWidth,y:v0*art.naturalHeight},s01={x:u0*art.naturalWidth,y:v1*art.naturalHeight},s11={x:u1*art.naturalWidth,y:v1*art.naturalHeight};
        triangle(p00,p10,p11,s00,s10,s11);triangle(p00,p11,p01,s00,s11,s01);
      }
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
                  boxShadow: "0 5px 12px rgba(0,0,0,.18)",
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
          <div className="photo-wall-upload-actions">
            <button className="photo-wall-upload" type="button" onClick={() => uploadRef.current?.click()}>
              {ru ? "Выбрать из галереи" : "Choose from gallery"}
            </button>
            <input ref={uploadRef} className="photo-wall-hidden-input" type="file" accept="image/*" onChange={(event) => { loadRoom(event.target.files?.[0]); event.currentTarget.value = ""; }} />
            <button className="photo-wall-upload" type="button" onClick={() => cameraRef.current?.click()}>
              {ru ? "Сделать фото" : "Take a photo"}
            </button>
            <input ref={cameraRef} className="photo-wall-hidden-input" type="file" accept="image/*" capture="environment" onChange={(event) => { loadRoom(event.target.files?.[0]); event.currentTarget.value = ""; }} />
            {roomImage && (
              <button className="photo-wall-upload photo-wall-camera" type="button" onClick={capturePreview}>
                {ru ? "Сохранить результат" : "Save result"}
              </button>
            )}
          </div>

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
            {roomImage && <button type="button" onClick={capturePreview}>{ru ? "Сохранить результат" : "Save result"}</button>}
            <button type="button" onClick={reset}>{ru ? "Сбросить положение и угол" : "Reset position and angles"}</button>
            {roomImage && <button type="button" onClick={() => setRoomImage("")}>{ru ? "Удалить фото" : "Remove photo"}</button>}
          </div>
          <p>{ru ? "Перетаскивайте картину пальцем. Три ползунка позволяют повернуть её вокруг всех осей." : "Drag the artwork with your finger. The three angle controls rotate it on all axes."}</p>
        </div>
      </div>
    </section>
  );
}
