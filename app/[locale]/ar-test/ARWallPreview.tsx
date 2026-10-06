"use client";

import {useEffect,useRef,useState} from "react";
import * as THREE from "three";

type Props={imageUrl?:string;title:string;width:number;height:number;ru:boolean};
type XRState={
  session:any; referenceSpace:any; hitSource:any; renderer:THREE.WebGLRenderer;
  scene:THREE.Scene; camera:THREE.PerspectiveCamera; artwork:THREE.Group;
  reticle:THREE.Mesh; placed:boolean;
  lastHit?:{position:THREE.Vector3;quaternion:THREE.Quaternion};
};

type ArtworkQuad={points:[{x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}];confidence:number};
type ArtworkBounds={x:number;y:number;width:number;height:number};

function detectArtworkQuad(image:HTMLImageElement,targetAspect:number):ArtworkQuad{
  const w=image.naturalWidth,h=image.naturalHeight;
  const fallback:ArtworkQuad={points:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],confidence:0};
  if(!w||!h)return fallback;
  const size=640,scale=Math.min(size/w,size/h),canvas=document.createElement("canvas");
  canvas.width=Math.max(120,Math.round(w*scale));canvas.height=Math.max(120,Math.round(h*scale));
  const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)return fallback;
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,cw=canvas.width,ch=canvas.height;
  const gray=new Float32Array(cw*ch),edge=new Uint8Array(cw*ch);let maxEdge=0;
  for(let y=1;y<ch-1;y++)for(let x=1;x<cw-1;x++){const i=(y*cw+x)*4;gray[y*cw+x]=.299*data[i]+.587*data[i+1]+.114*data[i+2]}
  for(let y=1;y<ch-1;y++)for(let x=1;x<cw-1;x++){const n=y*cw+x,gx=gray[n+1]-gray[n-1],gy=gray[n+cw]-gray[n-cw],v=Math.min(255,Math.round(Math.hypot(gx,gy)));edge[n]=v;if(v>maxEdge)maxEdge=v}
  const threshold=Math.max(18,maxEdge*.16),points:{x:number;y:number;v:number}[]=[];
  for(let y=Math.round(ch*.04);y<Math.round(ch*.96);y+=2)for(let x=Math.round(cw*.04);x<Math.round(cw*.96);x+=2){const v=edge[y*cw+x];if(v>=threshold)points.push({x,y,v})}
  if(points.length<80)return fallback;
  const angles:number[]=[];for(let a=-55;a<=55;a+=5)angles.push(a*Math.PI/180);for(let a=35;a<=145;a+=5)if(!angles.some(v=>Math.abs(v-a*Math.PI/180)<.001))angles.push(a*Math.PI/180);
  const diag=Math.hypot(cw,ch),rhoBins=Math.ceil(diag*2)+1,peaks:{theta:number;rho:number;score:number}[]=[];
  for(const theta of angles){const cos=Math.cos(theta),sin=Math.sin(theta),votes=new Float32Array(rhoBins);for(const p of points){const rho=Math.round(p.x*cos+p.y*sin+diag);votes[rho]+=p.v}for(let r=2;r<rhoBins-2;r++){const v=votes[r];if(v>votes[r-1]&&v>=votes[r+1]&&v>points.length*.7)peaks.push({theta,rho:r-diag,score:v})}}
  peaks.sort((a,b)=>b.score-a.score);const lines:{theta:number;rho:number;score:number}[]=[];
  for(const p of peaks)if(lines.every(l=>{const da=Math.abs(Math.atan2(Math.sin(p.theta-l.theta),Math.cos(p.theta-l.theta)));return da>5*Math.PI/180||Math.abs(p.rho-l.rho)>Math.min(cw,ch)*.06})){lines.push(p);if(lines.length>=28)break}
  if(lines.length<4)return fallback;
  const intersection=(a:{theta:number;rho:number},b:{theta:number;rho:number})=>{const det=Math.cos(a.theta)*Math.sin(b.theta)-Math.sin(a.theta)*Math.cos(b.theta);if(Math.abs(det)<.08)return null;return{x:(a.rho*Math.sin(b.theta)-b.rho*Math.sin(a.theta))/det,y:(Math.cos(a.theta)*b.rho-Math.cos(b.theta)*a.rho)/det}};
  const angleDiff=(a:number,b:number)=>{let d=Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));if(d>Math.PI/2)d=Math.PI-d;return d};
  const area=(p:{x:number;y:number}[])=>Math.abs(p.reduce((s,q,i)=>s+q.x*p[(i+1)%p.length].y-q.y*p[(i+1)%p.length].x,0))/2;
  const inside=(p:{x:number;y:number})=>p.x>cw*.015&&p.x<cw*.985&&p.y>ch*.015&&p.y<ch*.985;
  const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
  let best:ArtworkQuad|null=null,bestScore=-Infinity;
  for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){if(angleDiff(lines[i].theta,lines[j].theta)>18*Math.PI/180||Math.abs(lines[i].rho-lines[j].rho)<Math.min(cw,ch)*.22)continue;
    for(let k=0;k<lines.length;k++)for(let l=k+1;l<lines.length;l++){if(k===i||k===j||l===i||l===j||angleDiff(lines[k].theta,lines[l].theta)>18*Math.PI/180)continue;
      if(Math.abs(angleDiff((lines[i].theta+lines[j].theta)/2,(lines[k].theta+lines[l].theta)/2)-Math.PI/2)>24*Math.PI/180)continue;
      const p1=intersection(lines[i],lines[k]),p2=intersection(lines[i],lines[l]),p3=intersection(lines[j],lines[l]),p4=intersection(lines[j],lines[k]);if(!p1||!p2||!p3||!p4)continue;
      const pts=[p1,p2,p3,p4];if(!pts.every(inside))continue;const a=area(pts);if(a<cw*ch*.18||a>cw*ch*.94)continue;
      const ww=(dist(p1,p2)+dist(p4,p3))/2,hh=(dist(p1,p4)+dist(p2,p3))/2;if(ww<Math.min(cw,ch)*.22||hh<Math.min(cw,ch)*.22)continue;
      const observed=ww/Math.max(1,hh),aspect=Math.max(.2,Math.min(5,targetAspect||observed)),aspectPenalty=Math.abs(Math.log(observed/aspect)),parallelPenalty=angleDiff(lines[i].theta,lines[j].theta)+angleDiff(lines[k].theta,lines[l].theta);
      const raw=lines[i].score+lines[j].score+lines[k].score+lines[l].score,score=raw-aspectPenalty*Math.max(lines[i].score,1)*.9-parallelPenalty*20;
      if(score>bestScore){bestScore=score;best={points:[{x:p1.x/cw,y:p1.y/ch},{x:p2.x/cw,y:p2.y/ch},{x:p3.x/cw,y:p3.y/ch},{x:p4.x/cw,y:p4.y/ch}],confidence:Math.min(1,Math.max(0,score/(raw+.0001)))}}
    }
  }
  if(!best)return fallback;
  const bx=best.points.reduce((s,p)=>s+p.x,0)/4;
  const by=best.points.reduce((s,p)=>s+p.y,0)/4;
  const centered=best.points.every(p=>p.x>0.03&&p.x<0.97&&p.y>0.03&&p.y<0.97);
  const plausible=best.confidence>.5&&centered&&bx>.12&&bx<.88&&by>.12&&by<.88;
  return plausible?best:fallback;
}

function quadToBounds(quad:ArtworkQuad):ArtworkBounds{
  const xs=quad.points.map(p=>p.x),ys=quad.points.map(p=>p.y),x=Math.max(0,Math.min(...xs)),y=Math.max(0,Math.min(...ys)),r=Math.min(1,Math.max(...xs)),b=Math.min(1,Math.max(...ys));
  return{x,y,width:Math.max(.01,r-x),height:Math.max(.01,b-y)};
}

function createArtworkCutout(image:HTMLImageElement,quad:ArtworkQuad){
  const w=image.naturalWidth,h=image.naturalHeight,maxSide=1800,scale=Math.min(1,maxSide/Math.max(w,h)),full=document.createElement("canvas");
  full.width=Math.max(1,Math.round(w*scale));full.height=Math.max(1,Math.round(h*scale));const ctx=full.getContext("2d",{willReadFrequently:true});if(!ctx)return image.src;ctx.drawImage(image,0,0,full.width,full.height);
  const pts=quad.points.map(p=>({x:p.x*full.width,y:p.y*full.height})),pixels=ctx.getImageData(0,0,full.width,full.height),d=pixels.data;
  const sign=(a:{x:number;y:number},b:{x:number;y:number},p:{x:number;y:number})=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x),orient=sign(pts[0],pts[1],pts[2])>=0?1:-1,feather=Math.max(2,Math.round(Math.min(full.width,full.height)*.004));
  const minX=Math.max(0,Math.floor(Math.min(...pts.map(p=>p.x))-feather)),maxX=Math.min(full.width-1,Math.ceil(Math.max(...pts.map(p=>p.x))+feather)),minY=Math.max(0,Math.floor(Math.min(...pts.map(p=>p.y))-feather)),maxY=Math.min(full.height-1,Math.ceil(Math.max(...pts.map(p=>p.y))+feather));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const p={x,y},inside=pts.every((a,i)=>orient*sign(a,pts[(i+1)%4],p)>=-1);if(!inside){d[(y*full.width+x)*4+3]=0;continue}const ds=pts.map((a,i)=>Math.abs(sign(a,pts[(i+1)%4],p))/Math.max(1,Math.hypot(pts[(i+1)%4].x-a.x,pts[(i+1)%4].y-a.y))),edge=Math.min(...ds);d[(y*full.width+x)*4+3]=Math.min(255,Math.round(255*Math.min(1,edge/feather)))}
  ctx.putImageData(pixels,0,0);return full.toDataURL("image/png");
}

export default function ARWallPreview({imageUrl,title,width,height,ru}:Props){
  const rootRef=useRef<HTMLDivElement>(null),videoRef=useRef<HTMLVideoElement>(null);
  const stateRef=useRef<XRState|null>(null),imageQuadRef=useRef<ArtworkQuad>({points:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],confidence:0}),imageBoundsRef=useRef<ArtworkBounds>({x:0,y:0,width:1,height:1}),cutoutUrlRef=useRef<string|null>(null);
  const [mode,setMode]=useState<"idle"|"camera"|"ar">("idle"),[message,setMessage]=useState("");
  const [analysis,setAnalysis]=useState(false),[placed,setPlaced]=useState(false),[canPlace,setCanPlace]=useState(false),[cameraScale,setCameraScale]=useState(1),[xrAvailable,setXrAvailable]=useState<boolean|null>(null);
  const [drag,setDrag]=useState({x:50,y:45});
  const dragRef=useRef({active:false,startX:0,startY:0,x:50,y:45});

  const cleanup=()=>{
    const s=stateRef.current;
    if(s){
      try{s.session.end();}catch{}
      try{s.renderer.setAnimationLoop(null);}catch{}
      try{s.renderer.dispose();}catch{}
      s.renderer.domElement.remove();
      s.scene.traverse(o=>{
        const m=o as THREE.Mesh;
        if(m.geometry)m.geometry.dispose();
        const ms=Array.isArray(m.material)?m.material:[m.material];
        ms.forEach((x:any)=>x?.dispose?.());
      });
      stateRef.current=null;
    }
    const stream=videoRef.current?.srcObject as MediaStream|null;
    stream?.getTracks().forEach(t=>t.stop());
    if(videoRef.current)videoRef.current.srcObject=null;
    setMode("idle");setPlaced(false);setCanPlace(false);
  };

  useEffect(()=>()=>cleanup(),[]);

  const analyzeSource=async()=>{
    if(!imageUrl)return;
    setAnalysis(true);
    try{
      const img=new Image();img.crossOrigin="anonymous";img.src=imageUrl;await img.decode();
      imageQuadRef.current=detectArtworkQuad(img,aspect);
      imageBoundsRef.current=quadToBounds(imageQuadRef.current);
      cutoutUrlRef.current=createArtworkCutout(img,imageQuadRef.current);
      setMessage(ru?"Картина вырезана из фона.":"Artwork cut out from its background.");
    }catch{
      imageBoundsRef.current={x:0,y:0,width:1,height:1};
      setMessage(ru?"Использован исходный кадр.":"Using the original image bounds.");
    }finally{setAnalysis(false);}
  };

  const checkXR=async()=>{
    try{
      const xr=(navigator as any).xr;
      if(!xr?.isSessionSupported){setXrAvailable(false);return false}
      const ok=await xr.isSessionSupported("immersive-ar");
      setXrAvailable(ok);
      return ok;
    }catch{
      setXrAvailable(false);
      return false;
    }
  };

  const startCamera=async()=>{
    try{
      cleanup();
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      if(!videoRef.current)return;
      videoRef.current.srcObject=stream;await videoRef.current.play();await analyzeSource();setMode("camera");
    }catch{setMessage(ru?"Нет доступа к камере.":"Camera access was denied.");}
  };

  const runXRDiagnostic=async()=>{
    try{
      const xr=(navigator as any).xr;
      if(!xr){
        setXrAvailable(false);
        setMessage(ru?"WebXR API не найден.":"WebXR API not found.");
        return;
      }
      if(!xr.isSessionSupported){
        setXrAvailable(false);
        setMessage(ru?"WebXR есть, но проверка immersive-ar недоступна.":"WebXR exists, but immersive-ar support check is unavailable.");
        return;
      }
      const supported=await xr.isSessionSupported("immersive-ar");
      setXrAvailable(supported);
      setMessage(supported
        ? (ru?"✓ immersive-ar поддерживается этим браузером и устройством.":"✓ immersive-ar is supported by this browser and device.")
        : (ru?"✕ immersive-ar НЕ поддерживается этим браузером/устройством.":"✕ immersive-ar is NOT supported by this browser/device."));
    }catch(error){
      console.error("WebXR diagnostic failed",error);
      setXrAvailable(false);
      setMessage(ru?"Ошибка проверки WebXR. Откройте консоль браузера для деталей.":"WebXR diagnostic failed. Check the browser console for details.");
    }
  };

  const startAR=async()=>{
    const xr=(navigator as any).xr;
    if(!xr?.isSessionSupported){
      setXrAvailable(false);
      setMessage(ru?"WebXR недоступен.":"WebXR is unavailable.");
      return;
    }
    try{
      const supported=await xr.isSessionSupported("immersive-ar");
      setXrAvailable(supported);
      if(!supported){
        setMessage(ru?"immersive-ar не поддерживается.":"immersive-ar is not supported.");
        return;
      }

      const session=await xr.requestSession("immersive-ar");

      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      renderer.setSize(window.innerWidth,window.innerHeight);
      renderer.xr.enabled=true;
      renderer.xr.setReferenceSpaceType("local");
      await renderer.xr.setSession(session);
      renderer.domElement.className="ar-three-canvas";
      rootRef.current?.appendChild(renderer.domElement);

      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.01,30);

      // Temporary diagnostic object: a plain 3D panel.
      // Artwork analysis is deliberately excluded until hit-test placement is confirmed.
      const artW=Math.max(.01,width/100),artH=Math.max(.01,height/100),thickness=.018;
      const geometry=new THREE.BoxGeometry(artW,artH,thickness);
      const front=new THREE.MeshStandardMaterial({color:0xf0ece4,roughness:.8});
      const side=new THREE.MeshStandardMaterial({color:0x171717,roughness:.5});
      const artwork=new THREE.Mesh(geometry,[side,side,front,side,side,side]);
      artwork.visible=false;
      const group=new THREE.Group();
      group.add(artwork);
      scene.add(group);

      const ring=new THREE.Mesh(
        new THREE.RingGeometry(.045,.06,32),
        new THREE.MeshBasicMaterial({color:0xeeeae3,side:THREE.DoubleSide})
      );
      ring.visible=false;
      scene.add(ring);
      scene.add(new THREE.HemisphereLight(0xffffff,0x333333,1.2));

      const referenceSpace=await session.requestReferenceSpace("local");
      const viewerSpace=await session.requestReferenceSpace("viewer");
      let hitSource:any=null;
      try{hitSource=await session.requestHitTestSource({space:viewerSpace});}catch(error){console.warn("WebXR hit-test unavailable",error);}

      const state:XRState={
        session,referenceSpace,hitSource,renderer,scene,camera,
        artwork:group,reticle:ring,placed:false
      };
      stateRef.current=state;
      setMode("ar");
      setPlaced(false);
      setCanPlace(false);
      setMessage(ru?"AR запущен. Наведите камеру на стену.":"AR started. Point the camera at a wall.");

      session.addEventListener("end",()=>{
        if(stateRef.current===state){
          try{renderer.setAnimationLoop(null);renderer.dispose();}catch{}
          renderer.domElement.remove();
          stateRef.current=null;
          setMode("idle");
          setPlaced(false);
          setCanPlace(false);
        }
      },{once:true});

      renderer.setAnimationLoop((_time,frame)=>{
        if(!frame||stateRef.current!==state)return;
        const hit=hitSource?frame.getHitTestResults(hitSource)[0]:null;

        if(hit){
          const pose=hit.getPose(referenceSpace);
          if(pose){
            const matrix=new THREE.Matrix4().fromArray(pose.transform.matrix);
            const position=new THREE.Vector3().setFromMatrixPosition(matrix);
            const normal=new THREE.Vector3(0,0,1).applyMatrix4(
              new THREE.Matrix4().extractRotation(matrix)
            ).normalize();

            ring.position.copy(position);
            ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
            ring.visible=!state.placed;

            if(!state.placed){
              group.position.copy(position);
              group.quaternion.copy(ring.quaternion);
              group.visible=false;
              setCanPlace(true);
              setMessage(ru?"Поверхность найдена — нажмите «Разместить картину».":"Surface found — tap Place artwork.");
            }

            state.lastHit={
              position:position.clone(),
              quaternion:ring.quaternion.clone()
            };
          }
        }else if(!state.placed){
          ring.visible=false;
          setCanPlace(false);
          setMessage(hitSource
            ? (ru?"Наведите камеру на стену и медленно двигайте телефон.":"Point at a wall and move the phone slowly.")
            : (ru?"AR запущен, но hit-test недоступен на этом устройстве.":"AR started, but hit-test is unavailable on this device."));
        }

        renderer.render(scene,camera);
      });
    }catch(error){
      console.error("WebXR AR start failed",error);
      setXrAvailable(false);
      const e=error as any;
      const details=[e?.name,e?.message].filter(Boolean).join(": ");
      setMessage(ru
        ? `AR недоступен на этом устройстве${details?": "+details:""} — включаем режим камеры.`
        : `AR is unavailable on this device${details?": "+details:""} — switching to camera mode.`);
      try{
        await startCamera();
        if(videoRef.current?.srcObject){
          setMessage(ru?"AR недоступен — используется режим камеры.":"AR unavailable — camera mode is active.");
        }
      }catch{}
    }
  };

  const placeArtwork=()=>{
    const s=stateRef.current;if(!s?.lastHit)return;
    s.artwork.position.copy(s.lastHit.position);s.artwork.quaternion.copy(s.lastHit.quaternion);
    s.artwork.visible=true;s.placed=true;s.reticle.visible=false;setPlaced(true);setCanPlace(false);
    setMessage(ru?"Готово — теперь обойдите картину.":"Placed — now walk around the artwork.");
  };

  const onPointerDown=(e:React.PointerEvent)=>{
    if(mode!=="camera")return;
    dragRef.current={active:true,startX:e.clientX,startY:e.clientY,x:drag.x,y:drag.y};
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove=(e:React.PointerEvent)=>{
    if(!dragRef.current.active)return;
    const dx=(e.clientX-dragRef.current.startX)/window.innerWidth*100,dy=(e.clientY-dragRef.current.startY)/window.innerHeight*100;
    setDrag({x:Math.max(8,Math.min(92,dragRef.current.x+dx)),y:Math.max(8,Math.min(92,dragRef.current.y+dy))});
  };
  const onPointerUp=()=>{dragRef.current.active=false};

  if(!imageUrl)return <p className="ar-empty">{ru?"У этой работы нет изображения.":"This work has no image."}</p>;
  const aspect=width>0&&height>0?width/height:1;

  return <div ref={rootRef} className="ar-preview">
    <video ref={videoRef} className="ar-camera" playsInline muted/>
    <div className="ar-topbar"><span>{ru?"ПОСМОТРЕТЬ НА СТЕНЕ":"VIEW ON YOUR WALL"}</span><button type="button" onClick={cleanup}>×</button></div>
    {mode==="idle"&&<div className="ar-start">
      <p>{message|| (ru?"Настоящий AR: камера, определение стены и 3D-картина с реальным размером.":"True AR: camera, wall detection and a 3D artwork at its real size.")}</p>
      <button type="button" onClick={startAR}>{ru?"Открыть AR":"Open AR"}</button>
      <button type="button" className="ar-secondary" onClick={runXRDiagnostic}>{ru?"Проверить WebXR":"Check WebXR"}</button>
      <button type="button" className="ar-secondary" onClick={startCamera}>{ru?"Режим камеры":"Camera mode"}</button>
    </div>}
    {mode==="camera"&&<div className="ar-artwork" style={{left:drag.x+"%",top:drag.y+"%",width:(22*cameraScale)+"%",aspectRatio:String(aspect),transform:"translate(-50%,-50%)"}} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><img src={cutoutUrlRef.current||imageUrl} alt={title}/></div>}
    {mode==="camera"&&<div className="ar-controls"><span>{analysis?(ru?"Определяем границы картины…":"Detecting artwork edges…"):message||(ru?"Перемещайте картину пальцем":"Drag the artwork with your finger")}</span><input aria-label={ru?"Размер":"Size"} type="range" min=".5" max="1.8" step=".01" value={cameraScale} onChange={e=>setCameraScale(Number(e.target.value))}/></div>}
    {mode==="ar"&&<div className="ar-controls"><span>{message}</span>{canPlace&&!placed&&<button type="button" className="ar-place" onClick={placeArtwork}>{ru?"Разместить картину":"Place artwork"}</button>}{placed&&<span className="ar-ar-note">{width+" × "+height+" "+(ru?"см · толщина 1,8 см":"cm · 1.8 cm thick")}</span>}</div>}
  </div>;
}
