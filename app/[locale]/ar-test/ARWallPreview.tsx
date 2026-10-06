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

type ArtworkBounds={x:number;y:number;width:number;height:number};

function detectArtworkBounds(image:HTMLImageElement):ArtworkBounds{
  const w=image.naturalWidth,h=image.naturalHeight;
  if(!w||!h)return {x:0,y:0,width:1,height:1};
  const size=320,scale=Math.min(size/w,size/h);
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(w*scale)); canvas.height=Math.max(1,Math.round(h*scale));
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx)return {x:0,y:0,width:1,height:1};
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const samples:number[][]=[],edge=Math.max(3,Math.round(Math.min(canvas.width,canvas.height)*.04));
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    if(x<edge||y<edge||x>=canvas.width-edge||y>=canvas.height-edge){
      const i=(y*canvas.width+x)*4;samples.push([data[i],data[i+1],data[i+2]]);
    }
  }
  if(!samples.length)return {x:0,y:0,width:1,height:1};
  const bg=samples.reduce((a,p)=>[a[0]+p[0],a[1]+p[1],a[2]+p[2]],[0,0,0]).map(v=>v/samples.length);
  let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4;
    const d=Math.abs(data[i]-bg[0])+Math.abs(data[i+1]-bg[1])+Math.abs(data[i+2]-bg[2]);
    if(d>34){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  if(maxX<0)return {x:0,y:0,width:1,height:1};
  const pad=2,x=Math.max(0,minX-pad)/canvas.width,y=Math.max(0,minY-pad)/canvas.height;
  const right=Math.min(canvas.width,maxX+1+pad)/canvas.width,bottom=Math.min(canvas.height,maxY+1+pad)/canvas.height;
  const bw=right-x,bh=bottom-y;
  if(bw<.55||bh<.55||(bw>.995&&bh>.995))return {x:0,y:0,width:1,height:1};
  return {x,y,width:bw,height:bh};
}

/* Turn the detected artwork into a real transparent cutout.
   The border color is used as the background seed and a flood-fill removes
   connected pixels that look like that background. */
function createArtworkCutout(image:HTMLImageElement,bounds:ArtworkBounds){
  const w=image.naturalWidth,h=image.naturalHeight;
  const maxSide=1400,scale=Math.min(1,maxSide/Math.max(w,h));
  const full=document.createElement("canvas");
  full.width=Math.max(1,Math.round(w*scale));full.height=Math.max(1,Math.round(h*scale));
  const ctx=full.getContext("2d",{willReadFrequently:true});
  if(!ctx)return image.src;
  ctx.drawImage(image,0,0,full.width,full.height);
  const pixels=ctx.getImageData(0,0,full.width,full.height);
  const d=pixels.data,fw=full.width,fh=full.height;
  const edge=Math.max(2,Math.round(Math.min(fw,fh)*.025));
  const bgSamples:number[][]=[];
  for(let y=0;y<fh;y+=Math.max(1,Math.floor(fh/40)))for(let x=0;x<fw;x+=Math.max(1,Math.floor(fw/40))){
    if(x<edge||y<edge||x>=fw-edge||y>=fh-edge){
      const i=(y*fw+x)*4;bgSamples.push([d[i],d[i+1],d[i+2]]);
    }
  }
  const bg=bgSamples.reduce((a,p)=>[a[0]+p[0],a[1]+p[1],a[2]+p[2]],[0,0,0]).map(v=>v/Math.max(1,bgSamples.length));
  const seen=new Uint8Array(fw*fh),queue:number[]=[];
  const push=(x:number,y:number)=>{const n=y*fw+x;if(seen[n])return;seen[n]=1;queue.push(n)};
  for(let x=0;x<fw;x++){push(x,0);push(x,fh-1)}
  for(let y=0;y<fh;y++){push(0,y);push(fw-1,y)}
  const threshold=58;
  let head=0;
  while(head<queue.length){
    const n=queue[head++],x=n%fw,y=Math.floor(n/fw),i=n*4;
    const dist=Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2]);
    if(dist>threshold)continue;
    d[i+3]=0;
    if(x>0&&!seen[n-1])push(x-1,y);
    if(x<fw-1&&!seen[n+1])push(x+1,y);
    if(y>0&&!seen[n-fw])push(x,y-1);
    if(y<fh-1&&!seen[n+fw])push(x,y+1);
  }
  ctx.putImageData(pixels,0,0);
  const sx=Math.max(0,Math.floor(bounds.x*fw)),sy=Math.max(0,Math.floor(bounds.y*fh));
  const sw=Math.max(1,Math.min(fw-sx,Math.ceil(bounds.width*fw)));
  const sh=Math.max(1,Math.min(fh-sy,Math.ceil(bounds.height*fh)));
  const crop=document.createElement("canvas");crop.width=sw;crop.height=sh;
  const cropCtx=crop.getContext("2d");
  if(!cropCtx)return full.toDataURL("image/png");
  cropCtx.drawImage(full,sx,sy,sw,sh,0,0,sw,sh);
  return crop.toDataURL("image/png");
}

export default function ARWallPreview({imageUrl,title,width,height,ru}:Props){
  const rootRef=useRef<HTMLDivElement>(null),videoRef=useRef<HTMLVideoElement>(null);
  const stateRef=useRef<XRState|null>(null),imageBoundsRef=useRef<ArtworkBounds>({x:0,y:0,width:1,height:1}),cutoutUrlRef=useRef<string|null>(null);
  const [mode,setMode]=useState<"idle"|"camera"|"ar">("idle"),[message,setMessage]=useState("");
  const [analysis,setAnalysis]=useState(false),[placed,setPlaced]=useState(false),[canPlace,setCanPlace]=useState(false),[cameraScale,setCameraScale]=useState(1);
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
      imageBoundsRef.current=detectArtworkBounds(img);
      cutoutUrlRef.current=createArtworkCutout(img,imageBoundsRef.current);
      setMessage(ru?"Картина вырезана из фона.":"Artwork cut out from its background.");
    }catch{
      imageBoundsRef.current={x:0,y:0,width:1,height:1};
      setMessage(ru?"Использован исходный кадр.":"Using the original image bounds.");
    }finally{setAnalysis(false);}
  };

  const startCamera=async()=>{
    try{
      cleanup();
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      if(!videoRef.current)return;
      videoRef.current.srcObject=stream;await videoRef.current.play();await analyzeSource();setMode("camera");
    }catch{setMessage(ru?"Нет доступа к камере.":"Camera access was denied.");}
  };

  const startAR=async()=>{
    const xr=(navigator as any).xr;
    if(!xr?.isSessionSupported){await startCamera();return;}
    try{
      if(!(await xr.isSessionSupported("immersive-ar"))){await startCamera();return;}
      await analyzeSource();
      const session=await xr.requestSession("immersive-ar",{
        requiredFeatures:["hit-test"],optionalFeatures:["dom-overlay","local-floor","anchors"],
        domOverlay:{root:rootRef.current}
      });
      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      renderer.setSize(window.innerWidth,window.innerHeight);
      renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType("local");await renderer.xr.setSession(session);
      renderer.domElement.className="ar-three-canvas";rootRef.current?.appendChild(renderer.domElement);

      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.01,30);
      const texture=new THREE.TextureLoader().load(cutoutUrlRef.current||imageUrl!);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;const bounds=imageBoundsRef.current;texture.repeat.set(1,1);texture.offset.set(0,0);
      const artW=Math.max(.01,width/100),artH=Math.max(.01,height/100),thickness=.018;
      const group=new THREE.Group();group.visible=false;
      const front=new THREE.MeshStandardMaterial({map:texture,roughness:.72,metalness:0});
      const side=new THREE.MeshStandardMaterial({color:0x171717,roughness:.48,metalness:.08});
      const geometry=new THREE.BoxGeometry(artW,artH,thickness);
      const artwork=new THREE.Mesh(geometry,[side,side,front,side,side,side]);artwork.castShadow=true;group.add(artwork);scene.add(group);
      const ring=new THREE.Mesh(new THREE.RingGeometry(.045,.06,32),new THREE.MeshBasicMaterial({color:0xeeeae3,side:THREE.DoubleSide}));
      ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
      scene.add(new THREE.HemisphereLight(0xffffff,0x333333,1.2));

      const ref=await session.requestReferenceSpace("local"),viewer=await session.requestReferenceSpace("viewer");
      const hitSource=await session.requestHitTestSource({space:viewer});
      const state:XRState={session,referenceSpace:ref,hitSource,renderer,scene,camera,artwork:group,reticle:ring,placed:false};
      stateRef.current=state;setMode("ar");setMessage(ru?"Наведите камеру на стену.":"Point the camera at a wall.");

      session.addEventListener("end",()=>{
        if(stateRef.current===state){
          try{renderer.setAnimationLoop(null);renderer.dispose();}catch{}
          renderer.domElement.remove();stateRef.current=null;setMode("idle");setPlaced(false);
        }
      },{once:true});

      renderer.setAnimationLoop((_time,frame)=>{
        if(!frame||stateRef.current!==state)return;
        const hit=frame.getHitTestResults(hitSource)[0];
        if(hit){
          const pose=hit.getPose(ref);
          if(pose){
            const m=pose.transform.matrix,position=new THREE.Vector3(m[12],m[13],m[14]);
            const xAxis=new THREE.Vector3(m[0],m[1],m[2]).normalize();
            const normal=new THREE.Vector3(m[4],m[5],m[6]).normalize();
            const zAxis=new THREE.Vector3().crossVectors(xAxis,normal).normalize();
            const quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis,zAxis,normal));
            ring.position.copy(position);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);ring.visible=!state.placed;
            if(!state.placed){group.position.copy(position);group.quaternion.copy(quaternion);group.visible=false;}
            state.lastHit={position,quaternion};
            if(!state.placed){setCanPlace(true);setMessage(ru?"Стена найдена — нажмите «Разместить».":"Wall found — tap Place artwork.");}
          }
        }else if(!state.placed){
          ring.visible=false;setCanPlace(false);setMessage(ru?"Медленно наведите камеру на стену.":"Move the camera slowly over the wall.");
        }
        renderer.render(scene,camera);
      });
    }catch(error){console.error(error);await startCamera();}
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
      <p>{ru?"Настоящий AR: камера, определение стены и 3D-картина с реальным размером.":"True AR: camera, wall detection and a 3D artwork at its real size."}</p>
      <button type="button" onClick={startAR}>{ru?"Открыть AR":"Open AR"}</button>
      <button type="button" className="ar-secondary" onClick={startCamera}>{ru?"Режим камеры":"Camera mode"}</button>
    </div>}
    {mode==="camera"&&<div className="ar-artwork" style={{left:drag.x+"%",top:drag.y+"%",width:(22*cameraScale)+"%",aspectRatio:String(aspect),transform:"translate(-50%,-50%)"}} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><img src={cutoutUrlRef.current||imageUrl} alt={title}/></div>}
    {mode==="camera"&&<div className="ar-controls"><span>{analysis?(ru?"Определяем границы картины…":"Detecting artwork edges…"):message||(ru?"Перемещайте картину пальцем":"Drag the artwork with your finger")}</span><input aria-label={ru?"Размер":"Size"} type="range" min=".5" max="1.8" step=".01" value={cameraScale} onChange={e=>setCameraScale(Number(e.target.value))}/></div>}
    {mode==="ar"&&<div className="ar-controls"><span>{message}</span>{canPlace&&!placed&&<button type="button" className="ar-place" onClick={placeArtwork}>{ru?"Разместить картину":"Place artwork"}</button>}{placed&&<span className="ar-ar-note">{width+" × "+height+" "+(ru?"см · толщина 1,8 см":"cm · 1.8 cm thick")}</span>}</div>}
  </div>;
}
