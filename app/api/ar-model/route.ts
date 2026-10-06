import {NextRequest} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type Vec3=[number,number,number];
type Vec2=[number,number];

function align4(n:number){return (n+3)&~3;}

function pushFace(positions:number[],normals:number[],uvs:number[],indices:number[],corners:Vec3[],normal:Vec3,faceUvs:Vec2[]|null){
  const base=positions.length/3;
  for(let i=0;i<4;i++){positions.push(...corners[i]);normals.push(...normal);if(faceUvs)uvs.push(...faceUvs[i]);}
  indices.push(base,base+1,base+2,base,base+2,base+3);
}

function makeGlb(imageUrl:string,widthCm:number,heightCm:number){
  const w=Math.max(.01,widthCm/100),h=Math.max(.01,heightCm/100),t=Math.min(.06,Math.max(.012,Math.min(w,h)*.025));
  const fp:number[]=[],fn:number[]=[],fu:number[]=[],fi:number[]=[];
  pushFace(fp,fn,fu,fi,[[-w/2,-h/2,t/2],[w/2,-h/2,t/2],[w/2,h/2,t/2],[-w/2,h/2,t/2]],[0,0,1],[[0,1],[1,1],[1,0],[0,0]]);
  const sp:number[]=[],sn:number[]=[],si:number[]=[];
  const z=t/2,bz=-t/2;
  pushFace(sp,sn,[],si,[[-w/2,-h/2,bz],[-w/2,-h/2,z],[-w/2,h/2,z],[-w/2,h/2,bz]],[-1,0,0],null);
  pushFace(sp,sn,[],si,[[w/2,-h/2,z],[w/2,-h/2,bz],[w/2,h/2,bz],[w/2,h/2,z]],[1,0,0],null);
  pushFace(sp,sn,[],si,[[-w/2,h/2,z],[w/2,h/2,z],[w/2,h/2,bz],[-w/2,h/2,bz]],[0,1,0],null);
  pushFace(sp,sn,[],si,[[-w/2,-h/2,bz],[w/2,-h/2,bz],[w/2,-h/2,z],[-w/2,-h/2,z]],[0,-1,0],null);
  pushFace(sp,sn,[],si,[[w/2,-h/2,bz],[-w/2,-h/2,bz],[-w/2,h/2,bz],[w/2,h/2,bz]],[0,0,-1],null);

  const no=fp.length*4,uo=no+fn.length*4,fiOff=uo+fu.length*4,spOff=align4(fiOff+fi.length*2),snOff=spOff+sp.length*4,siOff=snOff+sn.length*4,binLength=align4(siOff+si.length*2);
  const bin=new ArrayBuffer(binLength);
  new Float32Array(bin,0,fp.length).set(fp);
  new Float32Array(bin,no,fn.length).set(fn);
  new Float32Array(bin,uo,fu.length).set(fu);
  new Uint16Array(bin,fiOff,fi.length).set(fi);
  new Float32Array(bin,spOff,sp.length).set(sp);
  new Float32Array(bin,snOff,sn.length).set(sn);
  new Uint16Array(bin,siOff,si.length).set(si);

  const json={
    asset:{version:"2.0",generator:"PETIT.SOT studio AR model"},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],
    meshes:[{primitives:[
      {attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0},
      {attributes:{POSITION:4,NORMAL:5},indices:6,material:1}
    ]}],
    materials:[
      {pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:.72}},
      {pbrMetallicRoughness:{baseColorFactor:[.055,.055,.055,1],metallicFactor:0,roughnessFactor:.5}}
    ],
    textures:[{sampler:0,source:0}],samplers:[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}],images:[{uri:imageUrl}],
    accessors:[
      {bufferView:0,componentType:5126,count:fp.length/3,type:"VEC3",min:[-w/2,-h/2,t/2],max:[w/2,h/2,t/2]},
      {bufferView:1,componentType:5126,count:fn.length/3,type:"VEC3"},
      {bufferView:2,componentType:5126,count:fu.length/2,type:"VEC2"},
      {bufferView:3,componentType:5123,count:fi.length,type:"SCALAR"},
      {bufferView:4,componentType:5126,count:sp.length/3,type:"VEC3",min:[-w/2,-h/2,-t/2],max:[w/2,h/2,t/2]},
      {bufferView:5,componentType:5126,count:sn.length/3,type:"VEC3"},
      {bufferView:6,componentType:5123,count:si.length,type:"SCALAR"}
    ],
    bufferViews:[
      {buffer:0,byteOffset:0,byteLength:fp.length*4,target:34962},
      {buffer:0,byteOffset:no,byteLength:fn.length*4,target:34962},
      {buffer:0,byteOffset:uo,byteLength:fu.length*4,target:34962},
      {buffer:0,byteOffset:fiOff,byteLength:fi.length*2,target:34963},
      {buffer:0,byteOffset:spOff,byteLength:sp.length*4,target:34962},
      {buffer:0,byteOffset:snOff,byteLength:sn.length*4,target:34962},
      {buffer:0,byteOffset:siOff,byteLength:si.length*2,target:34963}
    ],
    buffers:[{byteLength:binLength}]
  };

  const jb=new TextEncoder().encode(JSON.stringify(json)),jl=align4(jb.length),total=12+8+jl+8+binLength,out=new ArrayBuffer(total),dv=new DataView(out);
  dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,total,true);
  let off=12;dv.setUint32(off,jl,true);dv.setUint32(off+4,0x4e4f534a,true);off+=8;new Uint8Array(out,off,jl).set(jb);off+=jl;
  dv.setUint32(off,binLength,true);dv.setUint32(off+4,0x004e4942,true);off+=8;new Uint8Array(out,off,binLength).set(new Uint8Array(bin));
  return new Uint8Array(out);
}

export async function GET(request:NextRequest){
  const {searchParams}=new URL(request.url);
  const image=searchParams.get("image"),width=Number(searchParams.get("width")),height=Number(searchParams.get("height"));
  if(!image||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return new Response("Missing image, width or height",{status:400});
  if(!/^https:\/\//i.test(image))return new Response("Image URL must use HTTPS",{status:400});
  const bytes=makeGlb(image,width,height);
  return new Response(bytes,{status:200,headers:{"Content-Type":"model/gltf-binary","Content-Disposition":"inline; filename=\"petit-sot-artwork.glb\"","Cache-Control":"public, max-age=3600, s-maxage=86400","Access-Control-Allow-Origin":"*"}});
}
