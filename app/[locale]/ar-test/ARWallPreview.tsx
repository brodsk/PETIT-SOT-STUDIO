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
  if(projected.length<8)return null;
  const sample=projected.length>140?projected.filter((_,i)=>i%Math.ceil(projected.length/140)===0).slice(0,140):projected;
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
  if((distances[Math.floor(distances.length/2)]||Infinity)>.11)return null;
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
    if(typeof window==='undefined')return;
    const w=window as any;
    if(w.XR8||document.querySelector('script[data-preload-petit-sot-8th-wall]'))return;
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js';script.async=true;script.crossOrigin='anonymous';
    script.dataset.preloadPetitSot8thWall='true';script.setAttribute('data-preload-chunks','slam');
    document.head.appendChild(script);
    const extras=document.createElement('script');
    extras.src='https://cdn.jsdelivr.net/npm/@8thwall/xrextras@1/dist/xrextras.js';extras.async=false;extras.crossOrigin='anonymous';
    document.head.appendChild(extras);
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
    setMessage(ru?"Запускаем WebAR…":"Starting WebAR…");
    try{
      cleanup();
      const w=window as any;
      w.THREE=THREE;

      const loadScript=(src:string,ready:()=>boolean)=>new Promise<void>((resolve,reject)=>{
        if(ready()){resolve();return;}
        const existing=document.querySelector('script[src="'+src+'"]') as HTMLScriptElement|null;
        const finish=()=>ready()?resolve():reject(new Error('Script loaded but API is unavailable: '+src));
        if(existing){existing.addEventListener('load',finish,{once:true});setTimeout(finish,12000);return;}
        const script=document.createElement('script');
        script.src=src;script.async=true;script.crossOrigin='anonymous';
        script.onload=finish;script.onerror=()=>reject(new Error('Could not load '+src));
        document.head.appendChild(script);
      });

      await loadScript('https://cdn.jsdelivr.net/npm/@8thwall/engine-binary@1/dist/xr.js',()=>!!w.XR8);
      await loadScript('https://cdn.jsdelivr.net/npm/@8thwall/xrextras@1/dist/xrextras.js',()=>!!w.XRExtras);
      if(!w.XR8)throw new Error('8th Wall engine unavailable');

      const canvas=document.createElement('canvas');
      canvas.className='ar-three-canvas';
      canvas.style.position='absolute';canvas.style.inset='0';canvas.style.width='100%';canvas.style.height='100%';
      canvas.style.display='block';canvas.style.zIndex='2';canvas.style.touchAction='none';
      eightWallCanvasRef.current=canvas;
      rootRef.current?.appendChild(canvas);

      const image=new Image();image.crossOrigin='anonymous';image.src=selectedImage;await image.decode();
      const texture=new THREE.Texture(image);texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;
      const artW=Math.max(.01,activeWidth/100),artH=Math.max(.01,activeHeight/100),thickness=.018;
      let trackedCamera:THREE.Camera|null=null;
      let trackedArtwork:THREE.Group|null=null;
      let trackedGuide:THREE.Mesh|null=null;
      let lastCandidate:{position:THREE.Vector3;quaternion:THREE.Quaternion}|null=null;
      let stable:{center:THREE.Vector3;normal:THREE.Vector3;frames:number}|null=null;

      const fitWorldPlane=(points:any[],camera:THREE.Camera)=>{
        const valid=points.filter(p=>p?.position&&Number(p?.confidence??1)>=.05)
          .map(p=>new THREE.Vector3(Number(p.position.x),Number(p.position.y),Number(p.position.z)))
          .filter(p=>p.distanceTo(camera.position)>.35&&p.distanceTo(camera.position)<8);
        if(valid.length<12)return null;
        const sample=valid.length>180?valid.filter((_,i)=>i%Math.ceil(valid.length/180)===0).slice(0,180):valid;
        const center=sample.reduce((v,p)=>v.add(p),new THREE.Vector3()).multiplyScalar(1/sample.length);
        const cov=[[0,0,0],[0,0,0],[0,0,0]];
        for(const p of sample){const d=p.clone().sub(center);cov[0][0]+=d.x*d.x;cov[0][1]+=d.x*d.y;cov[0][2]+=d.x*d.z;cov[1][0]+=d.y*d.x;cov[1][1]+=d.y*d.y;cov[1][2]+=d.y*d.z;cov[2][0]+=d.z*d.x;cov[2][1]+=d.z*d.y;cov[2][2]+=d.z*d.z;}
        const m=cov.map(r=>r.slice()),v=[[1,0,0],[0,1,0],[0,0,1]];
        for(let iter=0;iter<16;iter++){
          let p=0,q=1,max=Math.abs(m[0][1]);
          if(Math.abs(m[0][2])>max){p=0;q=2;max=Math.abs(m[0][2]);}
          if(Math.abs(m[1][2])>max){p=1;q=2;max=Math.abs(m[1][2]);}
          if(max<1e-9)break;
          const phi=.5*Math.atan2(2*m[p][q],m[q][q]-m[p][p]),c=Math.cos(phi),ss=Math.sin(phi);
          for(let k=0;k<3;k++){const ap=m[k][p],aq=m[k][q];m[k][p]=c*ap-ss*aq;m[k][q]=ss*ap+c*aq;}
          for(let k=0;k<3;k++){const ap=m[p][k],aq=m[q][k];m[p][k]=c*ap-ss*aq;m[q][k]=ss*ap+c*aq;}
          for(let k=0;k<3;k++){const ap=v[k][p],aq=v[k][q];v[k][p]=c*ap-ss*aq;v[k][q]=ss*ap+c*aq;}
        }
        let si=0;if(m[1][1]<m[si][si])si=1;if(m[2][2]<m[si][si])si=2;
        const normal=new THREE.Vector3(v[0][si],v[1][si],v[2][si]).normalize();
        if(Math.abs(normal.y)>.34)return null;
        const residual=sample.map(p=>Math.abs(normal.dot(p.clone().sub(center)))).sort((a,b)=>a-b);
        if((residual[Math.floor(residual.length*.5)]||1)>.13)return null;
        if(normal.dot(new THREE.Vector3().subVectors(camera.position,center))<0)normal.negate();
        return {center,normal};
      };

      const initModule={
        name:'petitsot-wall-ar',
        onCameraStatusChange:({status}:any)=>{
          if(status==='requesting')setMessage(ru?'Запрашиваем камеру…':'Requesting camera…');
          else if(status==='hasStream')setMessage(ru?'Камера подключена…':'Camera connected…');
          else if(status==='hasVideo')setMessage(ru?'Медленно наведите телефон на стену…':'Slowly point the phone at a wall…');
          else if(status==='failed')setMessage(ru?'Не удалось получить камеру.':'Could not access the camera.');
        },
        onStart:({canvas:startedCanvas}:any)=>{
          const xr=w.XR8.Threejs.xrScene();
          const rootRect=rootRef.current?.getBoundingClientRect();
          const canvasWidth=Math.max(1,Math.round(rootRect?.width||startedCanvas.clientWidth||window.innerWidth));
          const canvasHeight=Math.max(1,Math.round(rootRect?.height||startedCanvas.clientHeight||window.innerHeight));
          startedCanvas.style.width=`${canvasWidth}px`;
          startedCanvas.style.height=`${canvasHeight}px`;
          const xrRenderer=xr.renderer as THREE.WebGLRenderer;
          xrRenderer.setSize(canvasWidth,canvasHeight,false);
          trackedCamera=xr.camera as THREE.Camera;
          const scene=xr.scene as THREE.Scene;
          const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:false});
          const front=new THREE.Mesh(new THREE.PlaneGeometry(artW,artH),material);
          const side=new THREE.MeshStandardMaterial({color:0x171717,roughness:.65});
          const backing=new THREE.Mesh(new THREE.BoxGeometry(artW,artH,thickness),side);
          front.position.z=thickness/2+.003;
          backing.position.z=-thickness/2-.003;
          const artwork=new THREE.Group();artwork.add(backing);artwork.add(front);artwork.visible=false;
          artwork.userData.locked=false;scene.add(artwork);
          trackedArtwork=artwork;eightWallArtworkRef.current=artwork;
          const guide=new THREE.Mesh(new THREE.PlaneGeometry(artW,artH),new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));
          guide.visible=false;scene.add(guide);trackedGuide=guide;
          scene.add(new THREE.HemisphereLight(0xffffff,0x333333,1.15));
          eightWallCanvasRef.current=startedCanvas;
          setMessage(ru?'Наведите камеру на стену и медленно двигайте телефон.':'Point at a wall and move the phone slowly.');
        },
        onCanvasSizeChange:({canvasWidth,canvasHeight}:any)=>{
          const xr=w.XR8.Threejs.xrScene();
          try{(xr.renderer as THREE.WebGLRenderer).setSize(canvasWidth,canvasHeight,false);}catch{}
        },
        onUpdate:({processCpuResult}:any)=>{
          if(!trackedCamera||trackedArtwork?.userData.locked)return;
          // Always put the artwork into the tracked 3D world immediately. Wall detection
          // refines this pose later; this prevents a blank camera while SLAM is warming up.
          if(trackedArtwork&&!wallCandidateRef.current){
            const cp=trackedCamera.position.clone();
            const forward=new THREE.Vector3(0,0,-1).applyQuaternion(trackedCamera.quaternion).normalize();
            const fallbackNormal=forward.clone().negate();
            fallbackNormal.y=0;
            if(fallbackNormal.lengthSq()>.01){
              fallbackNormal.normalize();
              const fallbackPos=cp.clone().add(forward.multiplyScalar(1.35));
              const fallbackQ=makeWallQuaternion(fallbackNormal);
              trackedArtwork.position.copy(fallbackPos);
              trackedArtwork.quaternion.copy(fallbackQ);
              trackedArtwork.visible=true;
            }
          }
          const reality=processCpuResult?.reality;
          if(reality?.trackingStatus!=='NORMAL'||!Array.isArray(reality.worldPoints))return;
          const plane=fitWorldPlane(reality.worldPoints,trackedCamera);
          if(!plane){stable=null;if(trackedGuide)trackedGuide.visible=false;setCanPlace(false);return;}
          if(stable&&stable.center.distanceTo(plane.center)<.06&&stable.normal.angleTo(plane.normal)<8*Math.PI/180){
            stable.frames=Math.min(30,stable.frames+1);stable.center.lerp(plane.center,.18);stable.normal.lerp(plane.normal,.18).normalize();
          }else stable={center:plane.center.clone(),normal:plane.normal.clone(),frames:1};
          if(stable.frames<5){setCanPlace(false);setMessage(ru?'Стабилизируем стену…':'Stabilizing the wall…');return;}
          const wallPlane=new THREE.Plane().setFromNormalAndCoplanarPoint(stable.normal,stable.center);
          const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),trackedCamera);
          const hit=new THREE.Vector3();const hitOk=ray.ray.intersectPlane(wallPlane,hit);
          const pos=(hitOk?hit:stable.center.clone()).add(stable.normal.clone().multiplyScalar(thickness/2+.006));
          const q=makeWallQuaternion(stable.normal);
          lastCandidate={position:pos,quaternion:q};wallCandidateRef.current=lastCandidate;
          if(trackedGuide){trackedGuide.position.copy(pos);trackedGuide.quaternion.copy(q);trackedGuide.visible=true;}
          if(trackedArtwork){trackedArtwork.position.copy(pos);trackedArtwork.quaternion.copy(q);trackedArtwork.visible=true;}
          setCanPlace(true);setMessage(ru?'Стена найдена — нажмите «Разместить картину».':'Wall found — tap Place artwork.');
        },
        onException:({error}:any)=>setMessage((ru?'Ошибка WebAR: ':'WebAR error: ')+(error?.message||error?.name||'unknown')),
      };

      w.XR8.stop?.();w.XR8.clearCameraPipelineModules?.();
      w.XR8.XrController.configure({disableWorldTracking:false,enableLighting:true,enableWorldPoints:true,scale:'absolute'});
      const modules=[w.XR8.GlTextureRenderer.pipelineModule(),w.XR8.Threejs.pipelineModule(),w.XR8.XrController.pipelineModule(),initModule];
      w.XR8.addCameraPipelineModules(modules);
      w.XR8.run({canvas,allowedDevices:w.XR8.XrConfig.device().MOBILE,cameraConfig:{direction:w.XR8.XrConfig.camera().BACK},glContextConfig:{antialias:true,alpha:true}});
      setMode('ar');setPlaced(false);setCanPlace(false);
      eightWallRef.current={stop:()=>{try{w.XR8.stop?.()}catch{}try{w.XR8.clearCameraPipelineModules?.()}catch{}try{texture.dispose()}catch{}try{canvas.remove()}catch{}eightWallArtworkRef.current=null;eightWallCanvasRef.current=null;wallCandidateRef.current=null;}};
    }catch(error){
      console.error('8th Wall start failed',error);
      setMessage(ru?'WebAR не запустился: '+(error instanceof Error?error.message:'неизвестная ошибка'):'WebAR failed: '+(error instanceof Error?error.message:'unknown error'));
      setMode('idle');
    }
  };
  const startAR=async()=>{
    // 8th Wall is the primary browser AR engine for this experience.
    // It provides its own SLAM/world tracking and does not depend on WebXR/ARCore.
    // WebXR and Google Scene Viewer are intentionally not used as the primary path:
    // the goal is one consistent browser experience on Android and iOS.
    await start8thWall();
    return;

    /* Native WebXR fallback is kept below for reference during development. */
    const xr=(navigator as any).xr;

    if(!xr?.requestSession){
      setXrAvailable(false);
      setMessage(ru
        ? "Настоящий WebXR AR недоступен — переключаемся в 8th Wall."
        : "Native WebXR AR is unavailable — using 8th Wall.");
      await start8thWall();
      return;
    }

    let session:any=null;

    try{
      session=await xr.requestSession("immersive-ar",{
        optionalFeatures:["hit-test","anchors","local-floor"]
      });
      setXrAvailable(true);
      cleanup();

      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
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
      const texture=new THREE.Texture(image);
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.needsUpdate=true;
      texture.anisotropy=renderer.capabilities.getMaxAnisotropy();

      const front=new THREE.MeshStandardMaterial({map:texture,roughness:.82,metalness:0,side:THREE.FrontSide});
      const side=new THREE.MeshStandardMaterial({color:0x171717,roughness:.55,metalness:0});
      const geometry=new THREE.BoxGeometry(artW,artH,thickness);
      const artworkMesh=new THREE.Mesh(geometry,[side,side,side,side,front,side]);
      const group=new THREE.Group();
      group.add(artworkMesh);
      group.visible=false;
      scene.add(group);

      const ring=new THREE.Mesh(new THREE.RingGeometry(.045,.06,32),new THREE.MeshBasicMaterial({color:0xeeeae3,side:THREE.DoubleSide}));
      ring.visible=false;
      scene.add(ring);
      scene.add(new THREE.HemisphereLight(0xffffff,0x333333,1.2));

      const referenceSpace=await session.requestReferenceSpace("local");
      const viewerSpace=await session.requestReferenceSpace("viewer");
      let hitSource:any=null;
      try{
        hitSource=await session.requestHitTestSource({space:viewerSpace,entityTypes:["plane"]});
      }catch(error){
        console.warn("WebXR hit-test unavailable; native AR remains available",error);
      }

      const state:XRState={session,referenceSpace,hitSource,renderer,scene,camera,artwork:group,reticle:ring,placed:false};
      stateRef.current=state;
      setMode("ar");
      setPlaced(false);
      setCanPlace(false);
      setMessage(ru
        ? "Наведите камеру на вертикальную стену и медленно двигайте телефон."
        : "Point the camera at a vertical wall and move the phone slowly.");

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
          setMessage(ru?"Готово. Картина закреплена в пространстве.":"Done. The artwork is fixed in space.");
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
            const normal=new THREE.Vector3(matrix.elements[4],matrix.elements[5],matrix.elements[6]).normalize();
            if(Math.abs(normal.y)<.22){
              const wallNormal=normal.clone();
              wallNormal.y=0;
              wallNormal.normalize();
              if(wallNormal.dot(new THREE.Vector3().subVectors(camera.position,position))<0)wallNormal.negate();
              const up=new THREE.Vector3(0,1,0);
              const tangent=new THREE.Vector3().crossVectors(up,wallNormal).normalize();
              const upright=new THREE.Vector3().crossVectors(wallNormal,tangent).normalize();
              const wallQuaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent,upright,wallNormal));
              const clearance=thickness/2+.003;
              const candidatePosition=position.clone().add(wallNormal.clone().multiplyScalar(clearance));
              ring.position.copy(candidatePosition);
              ring.quaternion.copy(wallQuaternion);
              ring.visible=true;
              group.position.copy(candidatePosition);
              group.quaternion.copy(wallQuaternion);
              group.matrixAutoUpdate=true;
              group.visible=false;
              state.lastHit={position:candidatePosition.clone(),quaternion:wallQuaternion.clone()};
              state.pendingHit=hit;
              setCanPlace(true);
              setMessage(ru?"Стена найдена — нажмите «Разместить картину».":"Wall found — tap Place artwork.");
            }else{
              ring.visible=false;
              state.lastHit=undefined;
              state.pendingHit=undefined;
              setCanPlace(false);
              setMessage(ru?"Наведите камеру на вертикальную поверхность.":"Point at a vertical surface.");
            }
          }
        }else if(!state.placed){
          ring.visible=false;
          state.lastHit=undefined;
          state.pendingHit=undefined;
          setCanPlace(false);
        }
        renderer.render(scene,camera);
      });
    }catch(error){
      console.error("Native WebXR AR unavailable; using fallback",error);
      try{session?.end?.();}catch{}
      stateRef.current=null;
      setXrAvailable(false);
      const details=[(error as any)?.name,(error as any)?.message].filter(Boolean).join(": ");
      setMessage(ru
        ? "WebXR AR недоступен"+(details?" ("+details+")":"")+". Переключаемся в совместимый режим камеры."
        : "WebXR AR is unavailable"+(details?" ("+details+")":"")+". Switching to the compatible camera mode.");
      // Android fallback: use Google's native Scene Viewer instead of
      // pretending that a 2D camera overlay is AR. Scene Viewer performs
      // world tracking, surface placement and perspective in native ARCore.
      if(isAndroidDevice()){
        try{
          const modelUrl=new URL("/api/ar-model",window.location.origin);
          modelUrl.searchParams.set("image",selectedImage);
          modelUrl.searchParams.set("width",String(activeWidth));
          modelUrl.searchParams.set("height",String(activeHeight));
          const fallback=new URL(window.location.href);
          fallback.hash="ar-camera";
          window.location.href=buildSceneViewerIntent(modelUrl.toString(),fallback.toString());
          return;
        }catch(sceneError){
          console.warn("Scene Viewer fallback failed; using camera fallback",sceneError);
        }
      }
      await startCamera();
    }
  };
  const placeArtwork=async()=>{
    // 8th Wall path: the artwork is placed from the tracked wall candidate,
    // then remains in the XR world coordinate system while SLAM updates the camera.
    const eightArtwork=eightWallArtworkRef.current;
    const eightCandidate=wallCandidateRef.current;
    if(mode==="ar"&&eightArtwork&&eightCandidate){
      eightArtwork.position.copy(eightCandidate.position);
      eightArtwork.quaternion.copy(eightCandidate.quaternion);
      eightArtwork.matrixAutoUpdate=true;
      eightArtwork.visible=true;
      eightArtwork.userData.locked=true;
      if(eightWallCanvasRef.current){
        eightWallCanvasRef.current.style.zIndex="2";
      }
      if(eightWallArtworkRef.current) eightWallArtworkRef.current.userData.locked=true;
      setPlaced(true);
      setCanPlace(false);
      setMessage(ru
        ?"Готово. Картина закреплена в пространстве — подойдите, отойдите и обойдите её."
        :"Done. The artwork is fixed in space — walk closer, farther away, and around it.");
      return;
    }

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
      <p>{message|| (ru?"Наведите камеру на стену — картина будет размещена в реальном пространстве и останется на месте при движении телефона.":"Point the camera at a wall — the artwork will be placed in real space and stay fixed as you move.")}</p>
      <button type="button" onClick={startAR}>{ru?"Открыть Wall AR":"Open Wall AR"}</button>
    </div>}
    {mode==="camera"&&<div className="ar-artwork" style={{left:drag.x+"%",top:drag.y+"%",width:(22*cameraScale)+"%",aspectRatio:String(aspect),transform:"translate(-50%,-50%)"}} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><img src={cutoutUrlRef.current||selectedImage} alt={selectedTitle}/></div>}
    {mode==="camera"&&<div className="ar-controls"><span>{analysis?(ru?"Определяем границы картины…":"Detecting artwork edges…"):message||(ru?"Перемещайте картину пальцем":"Drag the artwork with your finger")}</span><input aria-label={ru?"Размер":"Size"} type="range" min=".5" max="1.8" step=".01" value={cameraScale} onChange={e=>setCameraScale(Number(e.target.value))}/></div>}
    {mode==="ar"&&<div className="ar-controls"><span>{message}</span>{canPlace&&!placed&&<button type="button" className="ar-place" onClick={placeArtwork}>{ru?"Разместить картину":"Place artwork"}</button>}{placed&&<><span className="ar-ar-note">{activeWidth+" × "+activeHeight+" "+(ru?"см · толщина 1,8 см":"cm · 1.8 cm thick")}</span><button type="button" className="ar-place" onClick={captureArPhoto}>{ru?"Сделать фото":"Take photo"}</button></>}</div>}
  </div>;
}
