"use client";

import {useEffect,useRef,useState} from "react";
import * as THREE from "three";

type ArtworkChoice={id:string|number;title:string;image:string;width:number;height:number};
type Props={imageUrl?:string;title:string;width:number;height:number;ru:boolean;artworkChoices?:ArtworkChoice[]};
type XRState={
  session:any; referenceSpace:any; hitSource:any; renderer:THREE.WebGLRenderer;
  scene:THREE.Scene; camera:THREE.PerspectiveCamera; artwork:THREE.Group;
  reticle:THREE.Mesh; placed:boolean; anchor?:any; pendingHit?:any;
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

function detectWallPlane(points:any[],camera:THREE.Camera,canvasWidth:number,canvasHeight:number){
  const projected=points.filter(p=>p?.position&&Number(p?.confidence??1)>=.08).map(p=>{
    const v=new THREE.Vector3(p.position.x,p.position.y,p.position.z),q=v.clone().project(camera);
    return {v,sx:(q.x*.5+.5)*canvasWidth,sy:(-q.y*.5+.5)*canvasHeight,depth:q.z};
  }).filter(p=>p.depth>-1&&p.depth<1&&p.sx>canvasWidth*.22&&p.sx<canvasWidth*.78&&p.sy>canvasHeight*.16&&p.sy<canvasHeight*.84&&p.v.distanceTo(camera.position)>.5&&p.v.distanceTo(camera.position)<6);
  if(projected.length<20)return null;
  const sample=projected.length>90?projected.filter((_,i)=>i%Math.ceil(projected.length/90)===0).slice(0,90):projected;
  const center=sample.reduce((v,p)=>v.add(p.v),new THREE.Vector3()).multiplyScalar(1/sample.length);
  const cov=[[0,0,0],[0,0,0],[0,0,0]];
  for(const p of sample){const d=p.v.clone().sub(center);cov[0][0]+=d.x*d.x;cov[0][1]+=d.x*d.y;cov[0][2]+=d.x*d.z;cov[1][0]+=d.y*d.x;cov[1][1]+=d.y*d.y;cov[1][2]+=d.y*d.z;cov[2][0]+=d.z*d.x;cov[2][1]+=d.z*d.y;cov[2][2]+=d.z*d.z;}
  const m=cov.map(row=>row.slice()),v=[[1,0,0],[0,1,0],[0,0,1]];
  for(let iter=0;iter<12;iter++){
    let p=0,q=1,max=Math.abs(m[0][1]);
    if(Math.abs(m[0][2])>max){p=0;q=2;max=Math.abs(m[0][2]);}
    if(Math.abs(m[1][2])>max){p=1;q=2;max=Math.abs(m[1][2]);}
    if(max<1e-8)break;
    const phi=.5*Math.atan2(2*m[p][q],m[q][q]-m[p][p]),cs=Math.cos(phi),sn=Math.sin(phi);
    for(let k=0;k<3;k++){const ap=m[k][p],aq=m[k][q];m[k][p]=cs*ap-sn*aq;m[k][q]=sn*ap+cs*aq;}
    for(let k=0;k<3;k++){const ap=m[p][k],aq=m[q][k];m[p][k]=cs*ap-sn*aq;m[q][k]=sn*ap+cs*aq;}
    for(let k=0;k<3;k++){const ap=v[k][p],aq=v[k][q];v[k][p]=cs*ap-sn*aq;v[k][q]=sn*ap+cs*aq;}
  }
  let smallest=0;if(m[1][1]<m[smallest][smallest])smallest=1;if(m[2][2]<m[smallest][smallest])smallest=2;
  const normal=new THREE.Vector3(v[0][smallest],v[1][smallest],v[2][smallest]).normalize();
  if(Math.abs(normal.y)>.32)return null;
  const distances=sample.map(p=>Math.abs(normal.dot(p.v.clone().sub(center)))).sort((x,y)=>x-y);
  if((distances[Math.floor(distances.length/2)]||Infinity)>.045)return null;
  if(normal.dot(new THREE.Vector3().subVectors(camera.position,center))<0)normal.negate();
  return {normal,center};
}

function makeWallQuaternion(normal:THREE.Vector3){
  const y=new THREE.Vector3(0,1,0);
  const z=normal.clone().normalize();
  const x=new THREE.Vector3().crossVectors(y,z).normalize();
  y.copy(new THREE.Vector3().crossVectors(z,x).normalize());
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));
}

function isAndroidDevice(){
  return /Android/i.test(navigator.userAgent);
}

function buildSceneViewerIntent(modelUrl:string,fallbackUrl:string){
  const params = new URLSearchParams({file:modelUrl,mode:"ar_preferred"});
  return "intent://arvr.google.com/scene-viewer/1.0?"+params.toString()+"#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url="+encodeURIComponent(fallbackUrl)+";end;";
}
function makeArtworkTextureCanvas(image:HTMLImageElement,targetAspect:number){
  const maxSide=1800;
  const scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
  const sourceW=Math.max(1,Math.round(image.naturalWidth*scale));
  const sourceH=Math.max(1,Math.round(image.naturalHeight*scale));
  const source=document.createElement("canvas");
  source.width=sourceW;source.height=sourceH;
  const sctx=source.getContext("2d");
  if(!sctx)return image;
  sctx.drawImage(image,0,0,sourceW,sourceH);

  const sourceAspect=sourceW/sourceH;
  let sx=0,sy=0,sw=sourceW,sh=sourceH;
  if(targetAspect>0&&Math.abs(sourceAspect-targetAspect)>.002){
    if(sourceAspect>targetAspect){
      sw=Math.max(1,Math.round(sourceH*targetAspect));
      sx=Math.round((sourceW-sw)/2);
    }else{
      sh=Math.max(1,Math.round(sourceW/targetAspect));
      sy=Math.round((sourceH-sh)/2);
    }
  }
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(sw));
  canvas.height=Math.max(1,Math.round(sh));
  const ctx=canvas.getContext("2d");
  if(!ctx)return image;
  ctx.drawImage(source,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  return canvas;
}

function solve8(a:number[][],b:number[]){
  for(let i=0;i<8;i++){
    let pivot=i;for(let r=i+1;r<8;r++)if(Math.abs(a[r][i])>Math.abs(a[pivot][i]))pivot=r;
    if(Math.abs(a[pivot][i])<1e-9)return null;
    [a[i],a[pivot]]=[a[pivot],a[i]];[b[i],b[pivot]]=[b[pivot],b[i]];
    const d=a[i][i];for(let j=i;j<8;j++)a[i][j]/=d;b[i]/=d;
    for(let r=0;r<8;r++)if(r!==i){const f=a[r][i];if(!f)continue;for(let j=i;j<8;j++)a[r][j]-=f*a[i][j];b[r]-=f*b[i];}
  }return b;
}

function createArtworkCutout(image:HTMLImageElement,quad:ArtworkQuad,targetAspect:number){
  const w=image.naturalWidth,h=image.naturalHeight,maxSide=1600,scale=Math.min(1,maxSide/Math.max(w,h)),srcW=Math.max(1,Math.round(w*scale)),srcH=Math.max(1,Math.round(h*scale));
  const source=document.createElement("canvas");source.width=srcW;source.height=srcH;const sctx=source.getContext("2d");if(!sctx)return image.src;sctx.drawImage(image,0,0,srcW,srcH);
  const p=quad.points.map(q=>({x:q.x*srcW,y:q.y*srcH})),aspect=Math.max(.2,Math.min(5,targetAspect||srcW/srcH));
  let outW=1200,outH=Math.max(1,Math.round(outW/aspect));if(outH>1200){outH=1200;outW=Math.max(1,Math.round(outH*aspect));}
  const dst=[{x:0,y:0},{x:outW,y:0},{x:outW,y:outH},{x:0,y:outH}],rows:number[][]=[],rhs:number[]=[];
  for(let i=0;i<4;i++){const s=p[i],d=dst[i],x=s.x,y=s.y,u=d.x,v=d.y;rows.push([x,y,1,0,0,0,-u*x,-u*y]);rhs.push(u);rows.push([0,0,0,x,y,1,-v*x,-v*y]);rhs.push(v);}
  const solution=solve8(rows,rhs);if(!solution){const fallback=document.createElement("canvas");fallback.width=outW;fallback.height=outH;const f=fallback.getContext("2d");if(!f)return image.src;f.drawImage(source,0,0,srcW,srcH,0,0,outW,outH);return fallback.toDataURL("image/png");}
  const [a,b,c,d,e,f,g,hh]=solution,out=document.createElement("canvas");out.width=outW;out.height=outH;const ctx=out.getContext("2d");if(!ctx)return image.src;
  const src=sctx.getImageData(0,0,srcW,srcH).data,pix=ctx.createImageData(outW,outH),data=pix.data;
  for(let y=0;y<outH;y++)for(let x=0;x<outW;x++){
    const den=g*x+hh*y+1,sx=(a*x+b*y+c)/den,sy=(d*x+e*y+f)/den,oi=(y*outW+x)*4;
    if(sx<0||sy<0||sx>=srcW-1||sy>=srcH-1){data[oi+3]=0;continue;}
    const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0,i00=(y0*srcW+x0)*4,i10=i00+4,i01=i00+srcW*4,i11=i01+4;
    for(let ch=0;ch<4;ch++)data[oi+ch]=Math.round(src[i00+ch]*(1-fx)*(1-fy)+src[i10+ch]*fx*(1-fy)+src[i01+ch]*(1-fx)*fy+src[i11+ch]*fx*fy);
  }
  ctx.putImageData(pix,0,0);return out.toDataURL("image/png");
}

export default function ARWallPreview({imageUrl,title,width,height,ru,artworkChoices=[]}:Props){
  const rootRef=useRef<HTMLDivElement>(null),videoRef=useRef<HTMLVideoElement>(null);
  const stateRef=useRef<XRState|null>(null),imageQuadRef=useRef<ArtworkQuad>({points:[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],confidence:0}),imageBoundsRef=useRef<ArtworkBounds>({x:0,y:0,width:1,height:1}),cutoutUrlRef=useRef<string|null>(null);
  const [mode,setMode]=useState<"idle"|"camera"|"ar">("idle"),[message,setMessage]=useState("");
  const [analysis,setAnalysis]=useState(false),[placed,setPlaced]=useState(false),[canPlace,setCanPlace]=useState(false),[cameraScale,setCameraScale]=useState(1),[xrAvailable,setXrAvailable]=useState<boolean|null>(null),[sceneViewerAvailable,setSceneViewerAvailable]=useState(false),[photoUrl,setPhotoUrl]=useState<string|null>(null);
  const [selectedImage,setSelectedImage]=useState(imageUrl||"");
  const [selectedDimensions,setSelectedDimensions]=useState({width,height});
  const [selectedTitle,setSelectedTitle]=useState(title);
  const [drag,setDrag]=useState({x:50,y:45});
  const dragRef=useRef({active:false,startX:0,startY:0,x:50,y:45});
  const eightWallRef=useRef<{stop:()=>void}|null>(null);
  const eightWallArtworkRef=useRef<THREE.Group|null>(null);
  const eightWallCanvasRef=useRef<HTMLCanvasElement|null>(null);
  const wallCandidateRef=useRef<{position:THREE.Vector3;quaternion:THREE.Quaternion}|null>(null);
  const wallStableRef=useRef<{position:THREE.Vector3;normal:THREE.Vector3;frames:number}|null>(null);

  const cleanup=()=>{
    try{eightWallRef.current?.stop();}catch{}
    eightWallRef.current=null;
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
    setMode("idle");setPlaced(false);setCanPlace(false);wallCandidateRef.current=null;wallStableRef.current=null;
  };

  useEffect(()=>()=>cleanup(),[]);

  const analyzeSource=async()=>{
    if(!selectedImage)return;
    setAnalysis(true);
    try{
      const img=new Image();img.crossOrigin="anonymous";img.src=selectedImage;await img.decode();
      imageQuadRef.current=detectArtworkQuad(img,aspect);
      imageBoundsRef.current=quadToBounds(imageQuadRef.current);
      cutoutUrlRef.current=createArtworkCutout(img,imageQuadRef.current,aspect);
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

  useEffect(()=>{
    setSceneViewerAvailable(isAndroidDevice());
    const onResize=()=>fitCameraVideo();
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  useEffect(()=>{
    setSelectedImage(imageUrl||"");
    setSelectedDimensions({width,height});
    setSelectedTitle(title);
    preload8thWall();
  },[imageUrl,width,height,title]);

  const preload8thWall=()=>{
    if(typeof window==="undefined")return;
    const w=window as any;
    if(w.XR8||document.querySelector('script[data-preload-petit-sot-8th-wall]'))return;
    const script=document.createElement("script");
    script.src="https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js";
    script.async=true;script.crossOrigin="anonymous";
    script.dataset.preloadPetitSot8thWall="true";
    script.setAttribute("data-preload-chunks","slam");
    document.head.appendChild(script);
  };

  const openSceneViewer=async()=>{
    if(!selectedImage||!isAndroidDevice())return;
    try{
      const modelUrl=new URL("/api/ar-model",window.location.origin);
      modelUrl.searchParams.set("image",selectedImage);
      modelUrl.searchParams.set("width",String(activeWidth));
      modelUrl.searchParams.set("height",String(activeHeight));
      const fallback=new URL(window.location.href);
      fallback.hash="ar-camera";
      window.location.href=buildSceneViewerIntent(modelUrl.toString(),fallback.toString());
    }catch(error){
      console.error("Scene Viewer launch failed",error);
      setMessage(ru?"Не удалось открыть Android AR.":"Could not open Android AR.");
    }
  };

  const fitCameraVideo=()=>{
    const video=videoRef.current;
    if(!video)return;
    video.style.left="0";
    video.style.top="0";
    video.style.right="0";
    video.style.bottom="0";
    video.style.width="100%";
    video.style.height="100%";
    video.style.transform="none";
  };

  const startCamera=async()=>{
    try{
      cleanup();
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
      if(!videoRef.current)return;
      videoRef.current.srcObject=stream;
      await videoRef.current.play();
      fitCameraVideo();
      await analyzeSource();
      setMode("camera");
      requestAnimationFrame(fitCameraVideo);
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

      const ua=navigator.userAgent;
      const browser=/Chrome\//.test(ua)?"Chrome":/Edg\//.test(ua)?"Edge":/Firefox\//.test(ua)?"Firefox":/SamsungBrowser\//.test(ua)?"Samsung Browser":/MiuiBrowser\//.test(ua)?"Mi Browser":"other";
      const attempts:Record<string,string>={};
      const configs:Record<string,XRSessionInit>={
        "plain":{},
        "hit-test":{optionalFeatures:["hit-test"]},
        "local-floor":{optionalFeatures:["local-floor"]},
        "hit-test + local-floor":{optionalFeatures:["hit-test","local-floor"]}
      };
      for(const [label,config] of Object.entries(configs)){
        try{
          const testSession=await xr.requestSession("immersive-ar",config);
          attempts[label]="OK";
          await testSession.end();
          break;
        }catch(error){
          const e=error as any;
          attempts[label]=[e?.name,e?.message].filter(Boolean).join(": ")||"failed";
        }
      }
      const firstSuccess=Object.entries(attempts).find(([,value])=>value==="OK");
      if(firstSuccess){
        setXrAvailable(true);
        setMessage(ru
          ? `✓ WebXR AR реально запускается через «${firstSuccess[0]}». Браузер: ${browser}.`
          : `✓ WebXR AR actually starts with “${firstSuccess[0]}”. Browser: ${browser}.`);
      }else{
        setXrAvailable(false);
        const summary=Object.entries(attempts).map(([k,v])=>`${k}: ${v}`).join(" · ");
        setMessage(ru
          ? `WebXR заявлен как поддерживаемый, но ни одна AR-сессия не запускается. Браузер: ${browser}. ${summary}`
          : `WebXR reports support, but no AR session can start. Browser: ${browser}. ${summary}`);
      }
    }catch(error){
      console.error("WebXR diagnostic failed",error);
      setXrAvailable(false);
      setMessage(ru?"Ошибка проверки WebXR. Откройте консоль браузера для деталей.":"WebXR diagnostic failed. Check the browser console for details.");
    }
  };

  const start8thWall=async()=>{
    if(!selectedImage)return;
    setMessage(ru?"Запускаем AR…":"Starting AR…");
    try{
      cleanup();
      setMessage(ru?'Загружаем 8th Wall WebAR…':'Loading 8th Wall WebAR…');
      const w=window as any;
      w.THREE=THREE;
      if(!w.XR8){
        await new Promise<void>((resolve,reject)=>{
          const existing=document.querySelector('script[data-petit-sot-8th-wall],script[data-preload-petit-sot-8th-wall]') as HTMLScriptElement|null;
          if(existing){
            if(w.XR8)resolve(); else window.addEventListener('xrloaded',()=>resolve(),{once:true});
            setTimeout(()=>w.XR8?resolve():reject(new Error('8th Wall engine timeout')),12000);
            return;
          }
          const script=document.createElement('script');
          script.src='https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js';
          script.async=true;
          script.crossOrigin='anonymous';
          script.dataset.petitSot8thWall='true';
          script.setAttribute('data-preload-chunks','slam');
          script.onload=()=>w.XR8?resolve():reject(new Error('8th Wall engine did not initialize'));
          script.onerror=()=>reject(new Error('Could not load 8th Wall engine'));
          document.head.appendChild(script);
          window.addEventListener('xrloaded',()=>resolve(),{once:true});
        });
      }
      if(!w.XR8)throw new Error('XR8 unavailable');
      const canvas=document.createElement('canvas');
      eightWallCanvasRef.current=canvas;
      canvas.className='ar-three-canvas';
      canvas.style.position='absolute';canvas.style.inset='0';canvas.style.width='100%';canvas.style.height='100%';canvas.style.zIndex='2';
      canvas.style.objectFit='contain';
      rootRef.current?.appendChild(canvas);

      // Keep the WebAR drawing buffer in the exact aspect ratio of the preview.
      // Otherwise the camera texture can be stretched when the preview is not 16:9.
      const syncEightWallViewport=()=>{
        const root=rootRef.current;
        if(!root)return;
        const rect=root.getBoundingClientRect();
        const dpr=Math.min(window.devicePixelRatio||1,2);
        const width=Math.max(1,Math.round(rect.width));
        const height=Math.max(1,Math.round(rect.height));
        canvas.width=Math.max(1,Math.round(width*dpr));
        canvas.height=Math.max(1,Math.round(height*dpr));
        canvas.style.width=width+'px';
        canvas.style.height=height+'px';
        const xrScene=w.XR8?.Threejs?.xrScene?.();
        const renderer=xrScene?.renderer as THREE.WebGLRenderer|undefined;
        if(renderer){
          renderer.setPixelRatio(dpr);
          renderer.setSize(width,height,false);
        }
      };
      syncEightWallViewport();
      const resizeObserver=new ResizeObserver(syncEightWallViewport);
      if(rootRef.current)resizeObserver.observe(rootRef.current);
      const image=new Image();image.crossOrigin='anonymous';image.src=selectedImage;await image.decode();
      // AR receives the artwork exactly as supplied. The selected test images are already
      // front-facing and contain only the artwork, so no edge detection, crop or homography is needed.
      const texture=new THREE.Texture(image);texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;
      const artW=Math.max(.01,activeWidth/100),artH=Math.max(.01,activeHeight/100),thickness=.018;
      let trackedCamera:THREE.Camera|null=null;
      let trackedCanvas:HTMLCanvasElement|null=null;
      let trackedArtwork:THREE.Group|null=null;
      let trackedWallGuide:THREE.Mesh|null=null;
      const initModule={
        name:'petitsot-eightwall-scene',
        onStart:({canvas:startedCanvas}:any)=>{
          trackedCanvas=startedCanvas;
          const xrScene=w.XR8.Threejs.xrScene();
          const scene=xrScene.scene as THREE.Scene;
          const camera=xrScene.camera as THREE.Camera;
          trackedCamera=camera;
          const renderer=xrScene.renderer as THREE.WebGLRenderer;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
          const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.FrontSide});
          const sideMaterial=new THREE.MeshStandardMaterial({color:0x171717,roughness:.62});
          // BoxGeometry material order: right, left, top, bottom, front, back.
          const geometry=new THREE.BoxGeometry(artW,artH,thickness);
          // Physical dimensions are authoritative: width/height come from the artwork metadata.
          geometry.scale(1,1,1);
          // Keep the artwork's physical aspect ratio independent of the source photo.
          geometry.computeBoundingBox();
          const mesh=new THREE.Mesh(geometry,[sideMaterial,sideMaterial,sideMaterial,sideMaterial,material,sideMaterial]);
          const artwork=new THREE.Group();artwork.add(mesh);
          trackedArtwork=artwork;
          eightWallArtworkRef.current=artwork;
          artwork.position.set(0,1.45,-2.2);
          scene.add(artwork);
          const wallGuide=new THREE.Mesh(
            new THREE.PlaneGeometry(artW,artH),
            new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false})
          );
          wallGuide.visible=false;
          trackedWallGuide=wallGuide;
          scene.add(wallGuide);
          scene.add(new THREE.HemisphereLight(0xffffff,0x333333,1.15));
          w.XR8.XrController.updateCameraProjectionMatrix({origin:camera.position,facing:camera.quaternion});
          // Placement is controlled only by the Place button. Touching the camera view
          // must never recenter or move an already placed artwork.
          setMessage(ru?'8th Wall запущен. Картина закреплена в пространстве — двигайтесь вокруг неё.':'8th Wall is running. The artwork is anchored in space — walk around it.');
        },
        onUpdate:({processCpuResult}:any)=>{
          const reality=processCpuResult?.reality;
          if(reality?.intrinsics&&trackedCamera){
            // Keep Three.js projection identical to 8th Wall's camera intrinsics.
            // This is important inside our non-fullscreen AR viewport: otherwise a
            // physically 12×24 cm artwork can appear with the wrong screen aspect.
            const projection=Array.from(reality.intrinsics) as number[];
            trackedCamera.projectionMatrix.fromArray(projection);
            trackedCamera.projectionMatrixInverse.copy(trackedCamera.projectionMatrix).invert();
          }
          if(reality?.trackingStatus==='NORMAL'&&Array.isArray(reality.worldPoints)){
            const plane=detectWallPlane(reality.worldPoints,trackedCamera||new THREE.PerspectiveCamera(),trackedCanvas?.clientWidth||window.innerWidth,trackedCanvas?.clientHeight||window.innerHeight);
            if(plane&&!trackedArtwork?.userData.locked&&trackedWallGuide){
              const previous=wallStableRef.current;
              const same=previous&&previous.position.distanceTo(plane.center)<.035&&previous.normal.angleTo(plane.normal)<(4*Math.PI/180);
              if(same){
                previous!.frames=Math.min(previous!.frames+1,30);
                previous!.position.lerp(plane.center,.12);
                previous!.normal.lerp(plane.normal,.12).normalize();
              }else{
                wallStableRef.current={position:plane.center.clone(),normal:plane.normal.clone(),frames:1};
              }
              const stable=wallStableRef.current;
              if(stable&&stable.frames>=8){
                const q=makeWallQuaternion(stable.normal);
                trackedWallGuide.position.copy(stable.position);
                trackedWallGuide.quaternion.copy(q);
                trackedWallGuide.visible=true;
                const wallClearance=Math.max(thickness/2+.012,.095);
                // Aim at the centre of the screen, intersecting the fitted wall plane there.
                // This prevents the artwork from appearing at the arbitrary centroid of the point cloud.
                const ray=new THREE.Raycaster();
                ray.setFromCamera(new THREE.Vector2(0,0),trackedCamera||new THREE.PerspectiveCamera());
                const plane3=new THREE.Plane().setFromNormalAndCoplanarPoint(stable.normal,stable.position);
                const hitPoint=new THREE.Vector3();
                const hit=ray.ray.intersectPlane(plane3,hitPoint);
                const target=hit?hitPoint:stable.position.clone();
                const candidate={position:target.add(stable.normal.clone().multiplyScalar(wallClearance)),quaternion:q.clone()};
                trackedWallGuide.userData.candidate=candidate;
                wallCandidateRef.current=candidate;
                setCanPlace(true);
                setMessage(ru?'Стена найдена — нажмите «Разместить картину».':'Wall found — tap Place artwork.');
              }else{
                trackedWallGuide.visible=true;
                wallCandidateRef.current=null;
                setCanPlace(false);
                setMessage(ru?'Стабилизируем стену…':'Stabilizing the wall…');
              }
            }else if(!trackedArtwork?.userData.locked){
              if(trackedWallGuide)trackedWallGuide.visible=false;
              wallCandidateRef.current=null;wallStableRef.current=null;
              setCanPlace(false);
              setMessage(ru?'Медленно наведите камеру на фактурную стену.':'Slowly point the camera at a textured wall.');
            }
          }
        },
        onException:({error}:any)=>console.error('8th Wall exception',error),
      };
      w.XR8.XrController.configure({disableWorldTracking:false,enableLighting:true,enableWorldPoints:true,scale:'absolute'});
      w.XR8.addCameraPipelineModules([w.XR8.GlTextureRenderer.pipelineModule(),w.XR8.Threejs.pipelineModule(),w.XR8.XrController.pipelineModule(),initModule]);
      w.XR8.run({canvas,allowedDevices:w.XR8.XrConfig.device().MOBILE});
      setMode('ar');setPlaced(false);setCanPlace(false);
      eightWallRef.current={stop:()=>{try{resizeObserver.disconnect();}catch{}try{w.XR8.stop?.();}catch{}try{texture.dispose();}catch{}try{canvas.remove();}catch{}wallCandidateRef.current=null;trackedCamera=null;trackedCanvas=null;trackedArtwork=null;trackedWallGuide=null;eightWallArtworkRef.current=null;eightWallCanvasRef.current=null;}};
    }catch(error){
      console.error('8th Wall start failed',error);
      setMessage(ru?'8th Wall не запустился: '+(error instanceof Error?error.message:'неизвестная ошибка'):'8th Wall failed to start: '+(error instanceof Error?error.message:'unknown error'));
      setMode('idle');
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

      cleanup();

      // Do NOT require hit-test at session creation. Some Android WebXR
      // implementations support immersive-ar but reject any session that
      // declares hit-test as required. Start the AR session first, then ask
      // for hit-test and degrade gracefully if it is unavailable.
      let session:any=null;
      let lastError:any=null;
      const sessionConfigs:any[]=[
        {},
        {optionalFeatures:["hit-test"]},
        {optionalFeatures:["local-floor"]},
        {optionalFeatures:["hit-test","local-floor"]}
      ];
      for(const config of sessionConfigs){
        try{
          session=await xr.requestSession("immersive-ar",config);
          break;
        }catch(error){
          lastError=error;
        }
      }
      if(!session){
        throw lastError||new DOMException("immersive-ar session could not be created","NotSupportedError");
      }

      const renderer=new THREE.WebGLRenderer({
        antialias:true,
        alpha:true,
        powerPreference:"high-performance"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
      renderer.setSize(window.innerWidth,window.innerHeight);
      renderer.xr.enabled=true;
      renderer.xr.setReferenceSpaceType("local");
      await renderer.xr.setSession(session);
      renderer.domElement.className="ar-three-canvas";
      renderer.domElement.style.position="absolute";
      renderer.domElement.style.inset="0";
      renderer.domElement.style.width="100%";
      renderer.domElement.style.height="100%";
      renderer.domElement.style.zIndex="1";
      rootRef.current?.appendChild(renderer.domElement);

      const scene=new THREE.Scene();
      const camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.01,30);

      const artW=Math.max(.01,activeWidth/100);
      const artH=Math.max(.01,activeHeight/100);
      const thickness=.018;

      const image=new Image();
      image.crossOrigin="anonymous";
      image.src=selectedImage;
      await image.decode();

      // A real 3D object: metadata dimensions are in centimetres, so the mesh
      // is exactly the physical size requested by the artwork.
      const texture=new THREE.Texture(image);
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.needsUpdate=true;
      texture.anisotropy=renderer.capabilities.getMaxAnisotropy();

      const front=new THREE.MeshStandardMaterial({
        map:texture,
        roughness:.82,
        metalness:0,
        side:THREE.FrontSide
      });
      const side=new THREE.MeshStandardMaterial({
        color:0x171717,
        roughness:.55,
        metalness:0
      });
      const geometry=new THREE.BoxGeometry(artW,artH,thickness);
      // BoxGeometry: right, left, top, bottom, front, back.
      const artworkMesh=new THREE.Mesh(geometry,[side,side,side,side,front,side]);
      const group=new THREE.Group();
      group.add(artworkMesh);
      group.visible=false;
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
      try{
        hitSource=await session.requestHitTestSource({space:viewerSpace});
      }catch(error){
        console.warn("WebXR hit-test unavailable; immersive AR remains active",error);
      }

      const state:XRState={
        session,
        referenceSpace,
        hitSource,
        renderer,
        scene,
        camera,
        artwork:group,
        reticle:ring,
        placed:false
      };
      stateRef.current=state;

      setMode("ar");
      setPlaced(false);
      setCanPlace(false);
      setMessage(ru
        ?"Наведите камеру на стену и медленно двигайте телефон."
        :"Point the camera at a wall and move the phone slowly.");

      // On devices with XR hit-test, a screen tap is the most reliable
      // placement control inside immersive AR. Keep the DOM button as well.
      session.addEventListener("select",()=>{
        const s=stateRef.current;
        if(s?.lastHit&&!s.placed){
          s.artwork.position.copy(s.lastHit.position);
          s.artwork.quaternion.copy(s.lastHit.quaternion);
          s.artwork.visible=true;
          s.placed=true;
          s.reticle.visible=false;
          setPlaced(true);
          setCanPlace(false);
          setMessage(ru
            ?"Готово. Картина закреплена в пространстве."
            :"Done. The artwork is fixed in space.");
        }
      });
      
      session.addEventListener("end",()=>{
        if(stateRef.current===state){
          try{renderer.setAnimationLoop(null);}catch{}
          try{renderer.dispose();}catch{}
          try{texture.dispose();}catch{}
          try{geometry.dispose();}catch{}
          try{front.dispose();}catch{}
          try{side.dispose();}catch{}
          renderer.domElement.remove();
          stateRef.current=null;
          setMode("idle");
          setPlaced(false);
          setCanPlace(false);
        }
      },{once:true});

      renderer.setAnimationLoop((_time,frame)=>{
        if(!frame||stateRef.current!==state)return;

        // After placement we stop following the live gaze hit. The object stays
        // at its world pose; if anchors are available, the AR system refines it.
        if(state.anchor){
          const anchorPose=frame.getPose(state.anchor.anchorSpace,referenceSpace);
          if(anchorPose){
            group.matrix.fromArray(anchorPose.transform.matrix);
            group.matrixAutoUpdate=false;
            group.visible=true;
          }
        }

        const hit=hitSource?frame.getHitTestResults(hitSource)[0]:null;

        if(hit&&!state.placed){
          const pose=hit.getPose(referenceSpace);
          if(pose){
            const matrix=new THREE.Matrix4().fromArray(pose.transform.matrix);
            const position=new THREE.Vector3().setFromMatrixPosition(matrix);

            // WebXR hit-test poses define the local +Y axis as the physical
            // surface normal. A wall therefore has a nearly horizontal normal.
            const normal=new THREE.Vector3(
              matrix.elements[4],
              matrix.elements[5],
              matrix.elements[6]
            ).normalize();

            const wall=Math.abs(normal.y)<.22;
            if(wall){
              const wallNormal=normal.clone();
              wallNormal.y=0;
              wallNormal.normalize();

              // Always face the artwork toward the camera.
              if(wallNormal.dot(new THREE.Vector3().subVectors(camera.position,position))<0){
                wallNormal.negate();
              }

              // Build an upright wall basis: X = horizontal tangent,
              // Y = world-up, Z = outward wall normal.
              const up=new THREE.Vector3(0,1,0);
              const tangent=new THREE.Vector3().crossVectors(up,wallNormal).normalize();
              const upright=new THREE.Vector3().crossVectors(wallNormal,tangent).normalize();
              const wallQuaternion=new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().makeBasis(tangent,upright,wallNormal)
              );

              // Only a few millimetres in front of the wall: no artificial 10 cm
              // floating gap and no z-fighting with the physical surface.
              const clearance=thickness/2+.003;
              const candidatePosition=position.clone().add(wallNormal.clone().multiplyScalar(clearance));

              ring.position.copy(candidatePosition);
              ring.quaternion.copy(wallQuaternion);
              ring.visible=true;

              group.position.copy(candidatePosition);
              group.quaternion.copy(wallQuaternion);
              group.matrixAutoUpdate=true;
              group.visible=false;

              state.lastHit={
                position:candidatePosition.clone(),
                quaternion:wallQuaternion.clone()
              };
              state.pendingHit=hit;

              setCanPlace(true);
              setMessage(ru
                ?"Стена найдена — нажмите «Разместить картину»."
                :"Wall found — tap Place artwork.");
            }else{
              ring.visible=false;
              state.lastHit=undefined;
              state.pendingHit=undefined;
              setCanPlace(false);
              setMessage(ru
                ?"Это не стена. Наведите камеру на вертикальную поверхность."
                :"That is not a wall. Point at a vertical surface.");
            }
          }
        }else if(!state.placed){
          ring.visible=false;
          state.lastHit=undefined;
          state.pendingHit=undefined;
          setCanPlace(false);
          setMessage(ru
            ?"Наведите камеру на стену и медленно двигайте телефон."
            :"Point at a wall and move the phone slowly.");
        }

        renderer.render(scene,camera);
      });
    }catch(error){
      console.error("WebXR wall AR start failed",error);
      setXrAvailable(false);
      const e=error as any;
      const details=[e?.name,e?.message].filter(Boolean).join(": ");
      setMessage(ru
        ? `Настоящий Wall AR недоступен на этом устройстве${details?": "+details:""}.`
        : `Real Wall AR is unavailable on this device${details?": "+details:""}.`);
    }
  };

  const placeArtwork=async()=>{
    const s=stateRef.current;
    if(!s?.lastHit)return;

    const candidate=s.lastHit;
    s.artwork.position.copy(candidate.position);
    s.artwork.quaternion.copy(candidate.quaternion);
    s.artwork.matrixAutoUpdate=true;
    s.artwork.visible=true;
    s.placed=true;
    s.reticle.visible=false;
    setPlaced(true);
    setCanPlace(false);

    // If the browser exposes WebXR Anchors, bind the painting to the exact
    // hit-test result. Otherwise the frozen pose remains in the local XR world.
    const hit=s.pendingHit;
    if(hit&&s.session.enabledFeatures?.includes?.("anchors")){
      try{
        s.anchor=await hit.createAnchor();
        s.pendingHit=undefined;
      }catch(error){
        console.warn("WebXR anchor creation failed; using local world pose",error);
      }
    }
    s.pendingHit=undefined;

    setMessage(ru
      ?"Готово. Картина закреплена в пространстве — теперь подойдите к ней, отойдите и обойдите её."
      :"Done. The artwork is fixed in space — walk closer, farther away, and around it.");
  };

  const captureArPhoto=async()=>{
    const canvas=eightWallCanvasRef.current;
    if(!canvas||mode!=="ar"||!placed)return;
    try{
      const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",.94));
      if(!blob)return;
      const url=URL.createObjectURL(blob);
      setPhotoUrl(prev=>{if(prev)URL.revokeObjectURL(prev);return url;});
      const file=new File([blob],"petit-sot-ar.jpg",{type:"image/jpeg"});
      if((navigator as any).share&&((navigator as any).canShare?.({files:[file]})??false)){
        await (navigator as any).share({files:[file],title:selectedTitle,text:ru?"PETIT.SOT — картина в интерьере":"PETIT.SOT — artwork in interior"});
      }else{
        const a=document.createElement("a");a.href=url;a.download="petit-sot-ar.jpg";a.click();
      }
    }catch(error){console.error("AR photo capture failed",error);}
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
  const activeWidth=selectedDimensions.width||width,activeHeight=selectedDimensions.height||height;
  const aspect=activeWidth>0&&activeHeight>0?activeWidth/activeHeight:1;

  return <div ref={rootRef} className="ar-preview">
    <video ref={videoRef} className="ar-camera" playsInline muted style={{background:"#000",display:"block",position:"absolute",inset:0,width:"100%",height:"100%",minWidth:0,minHeight:0,maxWidth:"100%",maxHeight:"100%",transform:"none",objectFit:"contain"}}/>
    <div className="ar-topbar"><span>{ru?"ПОСМОТРЕТЬ НА СТЕНЕ":"VIEW ON YOUR WALL"}</span><button type="button" onClick={cleanup}>×</button></div>
    {mode==="idle"&&<div className="ar-start">
      {artworkChoices.length>0&&<div className="ar-artwork-picker" style={{position:"relative",zIndex:20,width:"100%",maxWidth:720,padding:"10px 12px",boxSizing:"border-box",pointerEvents:"auto"}}><span style={{display:"block",fontSize:12,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>{ru?"Выберите картину":"Choose artwork"}</span><div className="ar-artwork-options" style={{display:"flex",gap:8,overflowX:"auto",overflowY:"hidden",width:"100%",paddingBottom:4,pointerEvents:"auto",WebkitOverflowScrolling:"touch"}}>{artworkChoices.map(a=><button key={a.id} type="button" className={selectedImage===a.image?"selected":""} style={{flex:"0 0 72px",width:72,minWidth:72,height:92,padding:4,margin:0,boxSizing:"border-box",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",overflow:"hidden",cursor:"pointer",pointerEvents:"auto",touchAction:"manipulation",border:"1px solid rgba(255,255,255,.28)",background:"rgba(0,0,0,.45)",color:"inherit"}} onClick={()=>{setSelectedImage(a.image);setSelectedDimensions({width:a.width||width,height:a.height||height});setSelectedTitle(a.title);setMessage(ru?"Картина выбрана.":"Artwork selected.");}}><img src={a.image} alt={a.title} style={{display:"block",width:"100%",height:66,maxWidth:"100%",objectFit:"contain",flex:"0 0 66px"}}/><small style={{display:"block",width:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:9,lineHeight:"12px"}}>{a.title}</small></button>)}</div></div>}
      <p>{message|| (ru?"Настоящий AR: найдём физическую вертикальную стену, закрепим картину в 3D и сохраним её в пространстве.":"True AR: detect a physical vertical wall, place the artwork in 3D, and keep it fixed in space.")}</p>
      <button type="button" onClick={startAR}>{ru?"Открыть Wall AR":"Open Wall AR"}</button>
      {sceneViewerAvailable&&<button type="button" className="ar-secondary" onClick={openSceneViewer}>{ru?"Android AR / Google":"Android AR / Google"}</button>}
      <button type="button" className="ar-secondary" onClick={runXRDiagnostic}>{ru?"Проверить WebXR":"Check WebXR"}</button>
      <button type="button" className="ar-secondary" onClick={startCamera}>{ru?"Режим камеры":"Camera mode"}</button>
    </div>}
    {mode==="camera"&&<div className="ar-artwork" style={{left:drag.x+"%",top:drag.y+"%",width:(22*cameraScale)+"%",aspectRatio:String(aspect),transform:"translate(-50%,-50%)"}} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><img src={cutoutUrlRef.current||selectedImage} alt={selectedTitle}/></div>}
    {mode==="camera"&&<div className="ar-controls"><span>{analysis?(ru?"Определяем границы картины…":"Detecting artwork edges…"):message||(ru?"Перемещайте картину пальцем":"Drag the artwork with your finger")}</span><input aria-label={ru?"Размер":"Size"} type="range" min=".5" max="1.8" step=".01" value={cameraScale} onChange={e=>setCameraScale(Number(e.target.value))}/></div>}
    {mode==="ar"&&<div className="ar-controls"><span>{message}</span>{canPlace&&!placed&&<button type="button" className="ar-place" onClick={placeArtwork}>{ru?"Разместить картину":"Place artwork"}</button>}{placed&&<><span className="ar-ar-note">{activeWidth+" × "+activeHeight+" "+(ru?"см · толщина 1,8 см":"cm · 1.8 cm thick")}</span><button type="button" className="ar-place" onClick={captureArPhoto}>{ru?"Сделать фото":"Take photo"}</button></>}</div>}
  </div>;
}
