"use client";

import {useEffect,useRef,useState} from "react";

type Props={imageUrl?:string;title:string;width:number;height:number;ru:boolean};

export default function ARWallPreview({imageUrl,title,width,height,ru}:Props){
  const rootRef=useRef<HTMLDivElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const artworkRef=useRef<HTMLDivElement>(null);
  const sessionRef=useRef<any>(null);
  const rafRef=useRef<number|null>(null);
  const [mode,setMode]=useState<"idle"|"camera"|"ar"|"unsupported">("idle");
  const [message,setMessage]=useState("");
  const [scale,setScale]=useState(1);
  const [drag,setDrag]=useState({x:50,y:45});
  const dragRef=useRef<{active:boolean;startX:number;startY:number;x:number;y:number}>({active:false,startX:0,startY:0,x:50,y:45});

  const stop=()=>{
    if(rafRef.current!==null)cancelAnimationFrame(rafRef.current);
    rafRef.current=null;
    const session=sessionRef.current;
    if(session){
      try{session.end();}catch{}
    }
    sessionRef.current=null;
    const stream=videoRef.current?.srcObject as MediaStream|null;
    stream?.getTracks().forEach(t=>t.stop());
    if(videoRef.current)videoRef.current.srcObject=null;
    setMode("idle");
  };

  useEffect(()=>()=>stop(),[]);

  const startCamera=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      if(!videoRef.current)return;
      videoRef.current.srcObject=stream;
      await videoRef.current.play();
      setMode("camera");
      setMessage("");
    }catch{
      setMessage(ru?"Нет доступа к камере.":"Camera access was denied.");
    }
  };

  const startAR=async()=>{
    const xr=(navigator as any).xr;
    if(!xr?.isSessionSupported){
      await startCamera();
      return;
    }
    try{
      const supported=await xr.isSessionSupported("immersive-ar");
      if(!supported){
        await startCamera();
        return;
      }

      const session=await xr.requestSession("immersive-ar",{
        requiredFeatures:["hit-test"],
        optionalFeatures:["dom-overlay"],
        domOverlay:{root:rootRef.current},
      });
      sessionRef.current=session;
      setMode("ar");
      setMessage(ru?"Наведите камеру на стену.":"Point the camera at a wall.");

      const viewerSpace=await session.requestReferenceSpace("viewer");
      const localSpace=await session.requestReferenceSpace("local");
      const hitSource=await session.requestHitTestSource({space:viewerSpace});

      session.addEventListener("end",()=>{sessionRef.current=null;setMode("idle")},{once:true});

      const loop=(time:number,frame:any)=>{
        if(!sessionRef.current)return;
        const pose=frame.getViewerPose(localSpace);
        const hits=hitSource?frame.getHitTestResults(hitSource):[];
        const hit=hits?.[0];
        if(pose&&hit){
          const hitPose=hit.getPose(localSpace);
          if(hitPose){
            const p=hitPose.transform.position;
            const view=pose.views[0];
            const m=view.transform.inverse.matrix;
            const pm=view.projectionMatrix;
            const x=m[0]*p.x+m[4]*p.y+m[8]*p.z+m[12];
            const y=m[1]*p.x+m[5]*p.y+m[9]*p.z+m[13];
            const z=m[2]*p.x+m[6]*p.y+m[10]*p.z+m[14];
            const cx=pm[0]*x+pm[4]*y+pm[8]*z+pm[12];
            const cy=pm[1]*x+pm[5]*y+pm[9]*z+pm[13];
            const cw=pm[3]*x+pm[7]*y+pm[11]*z+pm[15];
            if(cw>0){
              const sx=(cx/cw*.5+.5)*100;
              const sy=(-cy/cw*.5+.5)*100;
              const distance=Math.max(.25,Math.sqrt(x*x+y*y+z*z));
              const base=Math.min(46,Math.max(10,28/distance));
              const aspect=width>0&&height>0?width/height:1;
              if(artworkRef.current){
                artworkRef.current.style.left=sx+"%";
                artworkRef.current.style.top=sy+"%";
                artworkRef.current.style.width=base+"%";
                artworkRef.current.style.aspectRatio=String(aspect);
                artworkRef.current.style.transform="translate(-50%,-50%)";
                artworkRef.current.style.opacity="1";
              }
              setMessage(ru?"Стена найдена":"Wall detected");
            }
          }
        }
        rafRef.current=session.requestAnimationFrame(loop);
      };
      rafRef.current=session.requestAnimationFrame(loop);
    }catch(error:any){
      console.error(error);
      await startCamera();
    }
  };

  const onPointerDown=(e:React.PointerEvent)=>{
    if(mode!=="camera")return;
    dragRef.current={active:true,startX:e.clientX,startY:e.clientY,x:drag.x,y:drag.y};
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove=(e:React.PointerEvent)=>{
    if(!dragRef.current.active)return;
    const dx=(e.clientX-dragRef.current.startX)/window.innerWidth*100;
    const dy=(e.clientY-dragRef.current.startY)/window.innerHeight*100;
    setDrag({x:Math.max(8,Math.min(92,dragRef.current.x+dx)),y:Math.max(8,Math.min(92,dragRef.current.y+dy))});
  };
  const onPointerUp=()=>{dragRef.current.active=false};

  if(!imageUrl)return <p className="ar-empty">{ru?"У этой работы нет изображения.":"This work has no image."}</p>;

  return <div ref={rootRef} className="ar-preview">
    <video ref={videoRef} className="ar-camera" playsInline muted/>
    {mode!=="idle"&&<div className="ar-dim"/>}
    <div
      ref={artworkRef}
      className="ar-artwork"
      style={mode==="camera"?{left:drag.x+"%",top:drag.y+"%",width:(22*scale)+"%",aspectRatio:String(width>0&&height>0?width/height:1),transform:"translate(-50%,-50%)"}:undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <img src={imageUrl} alt={title}/>
    </div>
    <div className="ar-topbar">
      <span>{ru?"ПОСМОТРЕТЬ НА СТЕНЕ":"VIEW ON YOUR WALL"}</span>
      <button type="button" onClick={stop}>×</button>
    </div>
    {mode==="idle"&&<div className="ar-start">
      <p>{ru?"Наведите камеру на свою стену и разместите картину в реальном пространстве.":"Point your camera at your wall and place the artwork in your space."}</p>
      <button type="button" onClick={startAR}>{ru?"Открыть AR":"Open AR"}</button>
      <button type="button" className="ar-secondary" onClick={startCamera}>{ru?"Простой режим камеры":"Camera mode"}</button>
    </div>}
    {mode==="camera"&&<div className="ar-controls">
      <span>{message|| (ru?"Перемещайте картину пальцем":"Drag the artwork with your finger")}</span>
      <input aria-label={ru?"Размер":"Size"} type="range" min="0.5" max="1.8" step="0.01" value={scale} onChange={e=>setScale(Number(e.target.value))}/>
    </div>}
    {mode==="ar"&&<div className="ar-controls"><span>{message}</span></div>}
  </div>;
}
