import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { groundHeight, PARK_OUTLINE } from './skate-physics';
export const SPOTS=[
 {name:'Sobre mim',subtitle:'O começo da linha',x:-18.2,z:10.2,color:0xebe989,zone:'ENTRADA'},
 {name:'Experiência',subtitle:'A trajetória na transição',x:-14.7,z:-7.4,color:0xe6a98a,zone:'TRANSIÇÃO'},
 {name:'Formação',subtitle:'Aprendizado e educação',x:2.9,z:-11.1,color:0x9bcbd6,zone:'FORMAÇÃO'},
 {name:'Projetos',subtitle:'FinCore · Nerya / Grow Journeys',x:10.8,z:3.8,color:0xb9cad8,zone:'PROJETOS'},
 {name:'GitHub Shop',subtitle:'Repositórios, código e experimentos',x:-9.6,z:12.8,color:0xb9d3bd,zone:'DEV SHOP'},
 {name:'Contato',subtitle:'A próxima conexão',x:13.8,z:12.1,color:0xf5b59b,zone:'SAÍDA'},
];
export const PROJECT_STATIONS=[
 {name:'FinCore',subtitle:'BACKEND / ARQUITETURA',x:13.25,z:-2.9,labelX:12.05,labelZ:-1.65},
 {name:'Nerya / Grow',subtitle:'EDUCAÇÃO / DIGITAL',x:17.85,z:-2.05,labelX:19.2,labelZ:-3.4},
];
export function createPark(){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x17252a);scene.fog=new THREE.Fog(0x17252a,78,165);
 const world=new THREE.Group();scene.add(world);
 const background=new THREE.Group();background.name='park-horizon';scene.add(background);
 const materials:THREE.Material[]=[];const textures:THREE.Texture[]=[];
 const mat=(color:number,roughness=.9)=>{const m=new THREE.MeshStandardMaterial({color,roughness});materials.push(m);return m};
 const concrete=mat(0xc5c5b8),edge=mat(0x676f68),line=mat(0x9b9f92),rampMat=mat(0xb8c9c7),orange=mat(0xeb8963),metal=mat(0x353f40,.4),dark=mat(0x202a2f),yellow=mat(0xebe989),white=mat(0xe9e7de),green=mat(0x5a8474),skin=mat(0xbe8c70),pants=mat(0x4b6070),tech=mat(0x769f9d),project=mat(0x96bbc3),wood=mat(0x8d6049),screen=mat(0x9bd6ce,.35);
 const mesh=(geometry:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Object3D=world)=>{const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
 const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=world)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
 const cylinder=(r:number,h:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=world)=>mesh(new THREE.CylinderGeometry(r,r,h,10),m,x,y,z,parent);
 const leafLight=mat(0x789986),soil=mat(0x47534b);
 const plazaDetails=new THREE.Group();plazaDetails.name='plaza-architecture';world.add(plazaDetails);
 // Only new, immobile scenery is baked by material. Ordinary meshes keep the
 // existing CPU renderer compatible; no per-prop draw calls or extra lights.
 function bakeScenery(group:THREE.Group,castShadows=true){
  const batches=new Map<THREE.Material,THREE.Mesh[]>();
  for(const child of group.children){if(child instanceof THREE.Mesh&&!Array.isArray(child.material)){
   const batch=batches.get(child.material)??[];batch.push(child);batches.set(child.material,batch);
  }}
  for(const [material,objects] of batches){
   const geometries=objects.map(object=>{object.updateMatrix();const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();return geometry.applyMatrix4(object.matrix)});
   const geometry=mergeGeometries(geometries);geometries.forEach(item=>item.dispose());
   if(!geometry)continue;
   for(const object of objects){group.remove(object);object.geometry.dispose()}
   const baked=mesh(geometry,material,0,0,0,group);baked.name=`${group.name}-batch`;baked.renderOrder=objects[0].renderOrder;baked.userData.staticScenery=true;baked.castShadow=castShadows;baked.receiveShadow=castShadows;
  }
 }
 const coastDetails=new THREE.Group();coastDetails.name='island-coast';world.add(coastDetails);
 const outlineArea=PARK_OUTLINE.reduce((sum,[x,z],i)=>{const [nx,nz]=PARK_OUTLINE[(i+1)%PARK_OUTLINE.length];return sum+x*nz-nx*z},0);
 const outwardSign=outlineArea>=0?1:-1;
 // Numeric offsets preserve the exact placement used by existing palms.
 // Densified, per-vertex offsets below are reserved for the coast silhouette.
 function offsetPoints(points:readonly (readonly [number,number])[],distance:number|readonly number[]):[number,number][]{
  return points.map(([x,z],i)=>{
   const [px,pz]=points[(i+points.length-1)%points.length];
   const [nx,nz]=points[(i+1)%points.length];
   const prevLength=Math.hypot(x-px,z-pz),nextLength=Math.hypot(nx-x,nz-z);
   const prevNormal=[outwardSign*(z-pz)/prevLength,-outwardSign*(x-px)/prevLength];
   const nextNormal=[outwardSign*(nz-z)/nextLength,-outwardSign*(nx-x)/nextLength];
   let bx=prevNormal[0]+nextNormal[0],bz=prevNormal[1]+nextNormal[1],length=Math.hypot(bx,bz);
   if(length<1e-5){bx=nextNormal[0];bz=nextNormal[1];length=1}
   bx/=length;bz/=length;
   const localDistance=typeof distance==='number'?distance:distance[i];
   const denominator=Math.max(.35,bx*nextNormal[0]+bz*nextNormal[1]);
   const miter=Math.min(localDistance/denominator,localDistance*2.5);
   return [x+bx*miter,z+bz*miter];
  });
 }
 const offsetOutline=(distance:number)=>offsetPoints(PARK_OUTLINE,distance);
 function subdivideOutline(points:readonly (readonly [number,number])[],maxSegmentLength:number){
  const result:[number,number][]=[];
  for(let i=0;i<points.length;i++){
   const [x,z]=points[i],[nx,nz]=points[(i+1)%points.length];
   const steps=Math.max(1,Math.ceil(Math.hypot(nx-x,nz-z)/maxSegmentLength));
   for(let step=0;step<steps;step++){const t=step/steps;result.push([x+(nx-x)*t,z+(nz-z)*t])}
  }
  return result;
 }
 function flatCoast(points:readonly (readonly [number,number])[],y:number,material:THREE.Material){
  const shape=new THREE.Shape();shape.moveTo(points[0][0],-points[0][1]);
  for(const [x,z] of points.slice(1))shape.lineTo(x,-z);
  shape.closePath();const surface=mesh(new THREE.ShapeGeometry(shape),material,0,y,0,coastDetails);surface.rotation.x=-Math.PI/2;return surface;
 }
 function coastBand(inner:readonly (readonly [number,number])[],outer:readonly (readonly [number,number])[],innerY:number,outerY:number,palette:readonly THREE.Material[]){
  for(let i=0;i<inner.length;i++){
   const next=(i+1)%inner.length,[ix,iz]=inner[i],[inx,inz]=inner[next],[ox,oz]=outer[i],[onx,onz]=outer[next];
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    ix,innerY,iz,inx,innerY,inz,onx,outerY,onz,ox,outerY,oz,
   ],3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
   mesh(geometry,palette[Math.floor(i/4)%palette.length],0,0,0,coastDetails);
  }
 }
 const hemi=new THREE.HemisphereLight(0xe3eef6,0x4a5b52,2.3);scene.add(hemi);
 const sunlight=new THREE.DirectionalLight(0xffe3bc,3);sunlight.position.set(-18,29,21);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1536,1536);Object.assign(sunlight.shadow.camera,{left:-31,right:31,top:25,bottom:-25,near:.5,far:90});sunlight.shadow.normalBias=.03;scene.add(sunlight);
 const fill=new THREE.DirectionalLight(0x9ebcca,1.4);fill.position.set(15,10,-18);scene.add(fill);
 // Build the slab from the same outline used by movement limits. Separate
 // side bands retain the existing dark edge and concrete cap thickness.
 const outlineShape=new THREE.Shape();
 outlineShape.moveTo(PARK_OUTLINE[0][0],-PARK_OUTLINE[0][1]);
 for(const [x,z] of PARK_OUTLINE.slice(1))outlineShape.lineTo(x,-z);
 outlineShape.closePath();
 const slabTopGeometry=new THREE.ShapeGeometry(outlineShape);
 const slabTop=mesh(slabTopGeometry,concrete,0,-.015,0);slabTop.rotation.x=-Math.PI/2;slabTop.renderOrder=-100;
 function sideBand(bottom:number,top:number,material:THREE.Material){
  const positions:number[]=[],indices:number[]=[];
  for(let i=0;i<PARK_OUTLINE.length;i++){
   const [x1,z1]=PARK_OUTLINE[i],[x2,z2]=PARK_OUTLINE[(i+1)%PARK_OUTLINE.length],start=positions.length/3;
   positions.push(x1,bottom,z1,x2,bottom,z2,x2,top,z2,x1,top,z1);
   indices.push(start,start+2,start+1,start,start+3,start+2);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const wall=mesh(geometry,material);wall.renderOrder=-101;return wall;
 }
 sideBand(-.765,-.115,edge);sideBand(-.115,-.015,concrete);

 const perimeterDetails=new THREE.Group();perimeterDetails.name='map-perimeter-details';world.add(perimeterDetails);
 const gridDetails=new THREE.Group();gridDetails.name='map-grid-details';world.add(gridDetails);
 const crossingsAtX=(x:number)=>{
  const hits:number[]=[];
  for(let i=0;i<PARK_OUTLINE.length;i++){
   const [x1,z1]=PARK_OUTLINE[i],[x2,z2]=PARK_OUTLINE[(i+1)%PARK_OUTLINE.length];
   if((x1<=x&&x<x2)||(x2<=x&&x<x1))hits.push(z1+(z2-z1)*(x-x1)/(x2-x1));
  }
  hits.sort((a,b)=>a-b);return hits;
 };
 const crossingsAtZ=(z:number)=>{
  const hits:number[]=[];
  for(let i=0;i<PARK_OUTLINE.length;i++){
   const [x1,z1]=PARK_OUTLINE[i],[x2,z2]=PARK_OUTLINE[(i+1)%PARK_OUTLINE.length];
   if((z1<=z&&z<z2)||(z2<=z&&z<z1))hits.push(x1+(x2-x1)*(z-z1)/(z2-z1));
  }
  hits.sort((a,b)=>a-b);return hits;
 };
 const intervals=(hits:number[])=>Array.from({length:Math.floor(hits.length/2)},(_,i)=>[hits[i*2],hits[i*2+1]] as const);
 const edgeInset=.12;
 for(let i=0;i<PARK_OUTLINE.length;i++){
  const [x1,z1]=PARK_OUTLINE[i],[x2,z2]=PARK_OUTLINE[(i+1)%PARK_OUTLINE.length];
  const dx=x2-x1,dz=z2-z1,length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
  const strip=box(length,.12,.16,orange,(x1+x2)/2+nx*edgeInset,0,(z1+z2)/2+nz*edgeInset,perimeterDetails);
  strip.rotation.y=Math.atan2(-dz,dx);
 }
 for(let x=-26.5;x<=26.5;x+=2.5)for(const [start,end] of intervals(crossingsAtX(x))){
  const mark=box(.018,.005,end-start,line,x,.001,(start+end)/2,gridDetails);mark.renderOrder=-90;
 }
 for(let z=-16.5;z<=16.5;z+=2.5)for(const [start,end] of intervals(crossingsAtZ(z))){
  const mark=box(end-start,.005,.018,line,(start+end)/2,.001,z,gridDetails);mark.renderOrder=-90;
 }
 // Keep the sparse edge paint on the portions of both end runs that remain
 // after the silhouette's insets and attached plazas are formed.
 for(const z of [-17.2,17.2])for(const [start,end] of intervals(crossingsAtZ(z)))
  for(let x=start+.38;x<end-.25;x+=1.8)box(.75,.012,.1,white,x,.021,z,perimeterDetails);
 bakeScenery(perimeterDetails);bakeScenery(gridDetails);
 // Six distinct districts surround a central plaza. Their open edges form
 // broad circulation loops instead of a single compressed corridor.
 box(7.2,.008,5.8,orange,-18.2,.009,10.2).renderOrder=-89;
 box(6.35,.01,4.9,white,-18.2,.016,10.2).renderOrder=-88;
 box(9.4,.008,6.6,project,2.9,.009,-11.1).renderOrder=-89;
 box(8.2,.008,4.5,green,-9.6,.009,12.4).renderOrder=-89;
 box(7.6,.008,4.4,orange,13.8,.009,12.1).renderOrder=-89;
 box(6.7,.01,3.55,white,13.8,.016,12.1).renderOrder=-88;
 // The plaza floor reads as one civic surface, with a quiet inset that keeps
 // the circulation lanes visible even when the island fills the foreground.
 box(9,.08,7,white,0,.005,2).renderOrder=-89;
 box(8.25,.018,6.25,concrete,0,.054,2).renderOrder=-88;
 const route=[SPOTS[0],SPOTS[1],SPOTS[2],SPOTS[3],{x:4.5,z:6.1},{x:-3.5,z:7.1},SPOTS[4],SPOTS[5]];
 for(let i=0;i<route.length-1;i++){const a=route[i],b=route[i+1];
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);
  for(let t=1.5;t<length-1.5;t+=1.5){const mark=box(.08,.01,.65,yellow,a.x+dx*t/length,.025,a.z+dz*t/length);mark.rotation.y=angle}
 }
 function surface(x0:number,x1:number,z0:number,z1:number,m:THREE.Material,nx:number,nz:number){
  const pos:number[]=[],idx:number[]=[];for(let iz=0;iz<=nz;iz++){for(let ix=0;ix<=nx;ix++){const x=x0+(x1-x0)*ix/nx,z=z0+(z1-z0)*iz/nz;pos.push(x,groundHeight(x,z),z)}}
  for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){const a=iz*(nx+1)+ix;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,m);
 }
 surface(-19.5,-10,-12.6,-2.2,rampMat,2,40);
 // Side panels follow the ramp profile, closing the geometry.
 for(const x of [-19.5,-10]){const pos:number[]=[],idx:number[]=[];for(let i=0;i<=40;i++){const z=-12.6+i*10.4/40;pos.push(x,0,z,x,groundHeight(x,z),z)}for(let i=0;i<40;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const m=orange.clone();m.side=THREE.DoubleSide;materials.push(m);mesh(geo,m)}
 for(const z of [-12.6,-2.2]){box(9.5,.12,.12,metal,-14.75,2.7,z);box(9.5,2.6,.1,edge,-14.75,1.3,z)}
 surface(-1.8,7.6,-14.1,-7.5,project,30,22);
 surface(9.4,21.6,-9.8,4.8,tech,30,30);
 surface(-26.4,-21.1,-7.8,2.2,rampMat,18,24);
 surface(21.7,26.4,-8.5,3.1,rampMat,18,26);
 // West line: bank -> low curb -> manual pad -> rail toward Experiência.
 box(3.5,.22,.5,white,-24.4,.13,4.15);
 box(4.2,.28,1.45,dark,-19.9,.14,3.55);box(4,.06,1.3,white,-19.9,.31,3.55);
 box(4.2,.08,.08,metal,-13.7,.64,2.7);
 for(const rx of [-15.65,-11.75])cylinder(.055,.62,metal,rx,.31,2.7);
 // East line: project bowl exit -> bank -> rail -> small stair set.
 const exitRail=box(4.1,.08,.08,metal,23.3,.66,5.45);exitRail.rotation.y=-.18;
 for(const rx of [21.4,25.2])cylinder(.055,.64,metal,rx,.32,5.45);
 for(let i=0;i<4;i++)box(3.2,.12,.75,concrete,24.1,.06+i*.12,8+i*.76);
 // Formation line: short stepped platform and a clear banked runout.
 for(let i=0;i<3;i++)box(1.3,.12+i*.12,1.35,i===2?project:white,-5.2+i*1.45,.06+i*.06,-10.7);
 box(3.6,.22,1.3,dark,8.4,.11,-12.8);box(3.4,.06,1.15,white,8.4,.25,-12.8);
 // Features are recognizable from the overview and leave broad routes open.
 const rail=box(5.5,.08,.08,metal,-5.2,.64,3.2);for(const x of [-7.7,-2.7])cylinder(.055,.62,metal,x,.31,3.2);
 for(let i=0;i<4;i++)box(3.6,.14,.75,concrete,20.3,.07+i*.14,10.2+i*.68);
 for(let i=0;i<25;i++)box(.07,1,.07,metal,-26.3+i*2.1,.5,-17.55);box(51,.07,.07,metal,-.8,1,-17.55);
 for(const x of [-26,26]){cylinder(.07,5,metal,x,2.5,-16.1);box(.7,.12,.25,white,x,5,-16.1)}
 // Sobre mim: an open-sided arrival plaza uses a small offset canopy rather
 // than a full-width portal, keeping the beginner route calm and legible.
 const entryX=-18.2,entryZ=10.2;
 const entryInset=mesh(new THREE.CircleGeometry(1.48,32),concrete,entryX,.025,entryZ);entryInset.rotation.x=-Math.PI/2;
 const entryRing=mesh(new THREE.TorusGeometry(1.48,.026,4,32),yellow,entryX,.045,entryZ);entryRing.rotation.x=-Math.PI/2;
 // Three short floor bars draw a quiet "start here" line toward the spot.
 for(let i=0;i<3;i++)box(1.35+i*.28,.014,.045,i===0?yellow:white,entryX,.025,12.2+i*.48);
 // The left-side canopy and its single offset post make a sheltered threshold
 // without closing the width of the park or reading as a monumental gateway.
 box(.12,2.15,.12,metal,-21.35,1.075,7.9);
 box(2.25,.14,.92,dark,-20.35,2.12,7.9);
 box(2.1,.045,.86,yellow,-20.35,2.2125,7.9);
 box(.34,.22,.3,orange,-21.35,2.31,7.9);
 box(.12,1.5,.12,metal,-15.2,.75,8.25);
 box(.36,.1,.3,white,-15.2,1.55,8.25);
 // Low paired curbs create an introductory bank line along the plaza edges;
 // their short ends leave a generous straight path through the center.
 for(const x of [-21.05,-15.35]){
  box(.52,.16,1.62,dark,x,.08,10.9);
  box(.56,.045,1.58,white,x,.1825,10.9);
  box(.48,.025,.055,x< -18?orange:yellow,x,.22,10.9);
 }
 // Compact planters tie the entry threshold back to the park's landscape.
 for(const x of [-21.15,-15.25]){
  box(.88,.2,.88,edge,x,.1,9.15);
  box(.72,.07,.72,soil,x,.235,9.15);
  mesh(new THREE.IcosahedronGeometry(.42,0),green,x,.58,9.15);
  mesh(new THREE.IcosahedronGeometry(.27,0),leafLight,x+.18,.82,9.02);
 }
 // Formação turns the existing funbox into a progression line. Four small
 // terraces zig-zag along its shoulders while the center remains open to ride.
 const formationStages=[
  {x:.5,z:-8.65,level:.12,color:white},
  {x:5.45,z:-9.85,level:.18,color:project},
  {x:.5,z:-11.15,level:.24,color:green},
  {x:5.45,z:-12.4,level:.3,color:yellow},
 ] as const;
 for(let i=0;i<formationStages.length;i++){
  const stage=formationStages[i],base=groundHeight(stage.x,stage.z),height=stage.level;
  box(1.68,height,.96,edge,stage.x,base+height/2,stage.z);
  box(1.54,.035,.82,stage.color,stage.x,base+height+.0175,stage.z);
  // A short lower nose gives each level a usable manual-pad approach.
  const noseBase=groundHeight(stage.x,stage.z+.59);
  box(1.08,.09,.24,concrete,stage.x,noseBase+.045,stage.z+.59);
  box(1.02,.025,.22,i===3?orange:line,stage.x,noseBase+.1025,stage.z+.59);
  box(.055,.025,.62,i===3?yellow:project,stage.x,base+height+.039,stage.z);
 }
 // Slim rails flank, rather than cross, the central line. Four floor inlays
 // mark the sequence from the lower entry to its raised finish.
 for(const side of [-1,1]){
  const rail=box(2.1,.065,.065,metal,2.9+side*1.38,groundHeight(2.9+side*1.38,-11.2)+.42,-11.2);
  for(const z of [-12.05,-10.35]){
   const postY=groundHeight(2.9+side*1.38,z);
   cylinder(.045,.38,metal,2.9+side*1.38,postY+.19,z);
  }
  rail.rotation.y=Math.PI/2;
 }
 for(let i=0;i<4;i++){
  const z=-8.7-i*1.25;
  box(.07,.012,.52,i===3?yellow:project,2.9,groundHeight(2.9,z)+.015,z);
 }
 // A narrow portal caps the line as a skatepark feature, not an academic icon.
 const portalY=groundHeight(2.9,-13.25),portalHeight=1.52;
 for(const x of [1.35,4.45]){
  box(.12,portalHeight,.12,metal,x,portalY+portalHeight/2,-13.25);
  box(.2,.16,.2,edge,x,portalY+.08,-13.25);
 }
 box(3.22,.14,.18,project,2.9,portalY+portalHeight,-13.25);
 box(2.72,.035,.2,yellow,2.9,portalY+portalHeight+.0875,-13.25);
 // The Projects bowl has a shared entrance and two distinct stations. FinCore
 // uses a compact server/architecture language; Nerya / Grow is lighter and
 // more open, suggesting education and digital product work.
 const bowlCoping=mesh(new THREE.TorusGeometry(1,.012,4,48),white,15.5,.09,-2.5);
 bowlCoping.rotation.x=-Math.PI/2;bowlCoping.scale.set(6.1,7.3,1);
 // A thin double rim makes the bowl read as built concrete, with a second
 // inset tracing the transition where the ride line drops into its flat base.
 const outerRim=mesh(new THREE.TorusGeometry(1,.026,4,48),project,15.5,.035,-2.5);
 outerRim.rotation.x=-Math.PI/2;outerRim.scale.set(6.23,7.43,1);
 const innerRim=mesh(new THREE.TorusGeometry(1,.018,4,48),orange,15.5,.035,-2.5);
 innerRim.rotation.x=-Math.PI/2;innerRim.scale.set(2.93,3.5,1);
 // South entry deck links the existing project marker to the bowl. Low side
 // steps add a change of level while keeping the central roll-in unobstructed.
 box(5.25,.14,1.72,edge,15.5,.07,5.55);
 box(5.05,.035,1.54,white,15.5,.1575,5.55);
 for(const side of [-1,1])for(let i=0;i<3;i++){
  const height=.1+i*.075,z=6.05-i*.38;
  box(.72,height,.34,i===2?project:concrete,15.5+side*2.08,height/2,z);
  box(.67,.025,.33,i===2?yellow:white,15.5+side*2.08,height+.0125,z);
 }
 // A west-north manual pad and low rail form a second perimeter line, clear
 // of the two project stations and outside the bowl's sloped riding surface.
 box(2.55,.2,.84,dark,10.7,.1,-9.15);
 box(2.4,.045,.78,white,10.7,.2225,-9.15);
 box(2.35,.07,.07,metal,13.15,.48,-9.45);
 for(const x of [12.1,14.2])cylinder(.05,.44,metal,x,.22,-9.45);
 // East runout deck meets the existing bank and exit rail as one continuous
 // route; small edge pads frame rather than occupy its center lane.
 box(4.25,.16,1.45,edge,23.25,.08,4.55);
 box(4.08,.035,1.28,concrete,23.25,.1775,4.55);
 for(const x of [21.95,24.55]){
  box(.72,.18,.68,dark,x,.27,4.35);
  box(.66,.035,.64,project,x,.3775,4.35);
 }
 const fincoreY=groundHeight(PROJECT_STATIONS[0].x,PROJECT_STATIONS[0].z);
 box(2.88,.045,2.32,project,PROJECT_STATIONS[0].x,fincoreY+.025,PROJECT_STATIONS[0].z);
 box(2.7,.18,2.15,dark,PROJECT_STATIONS[0].x,fincoreY+.09,PROJECT_STATIONS[0].z);
 for(const [offset,height] of [[-.68,.72],[0,.98],[.68,.62]] as const){
  box(.48,height,.62,metal,PROJECT_STATIONS[0].x+offset,fincoreY+.18+height/2,PROJECT_STATIONS[0].z);
  box(.32,.045,.08,project,PROJECT_STATIONS[0].x+offset,fincoreY+.34+height*.72,PROJECT_STATIONS[0].z+.34);
 }
 // Fine conduit runs tie the FinCore server forms together as one low
 // infrastructure plinth instead of three isolated display objects.
 for(const zOffset of [-.88,.88])box(2.38,.045,.055,metal,PROJECT_STATIONS[0].x,fincoreY+.2,PROJECT_STATIONS[0].z+zOffset);
 for(const xOffset of [-1.15,1.15])box(.055,.12,1.75,project,PROJECT_STATIONS[0].x+xOffset,fincoreY+.19,PROJECT_STATIONS[0].z);
 for(const zOffset of [-.61,.61])box(1.86,.055,.065,project,PROJECT_STATIONS[0].x,fincoreY+.23,PROJECT_STATIONS[0].z+zOffset);
 for(const xOffset of [-.68,0,.68])box(.11,.07,.11,yellow,PROJECT_STATIONS[0].x+xOffset,fincoreY+.24,PROJECT_STATIONS[0].z+.72);
 const fincoreRing=mesh(new THREE.TorusGeometry(1.58,.055,6,30),project,PROJECT_STATIONS[0].x,fincoreY+.12,PROJECT_STATIONS[0].z);fincoreRing.rotation.x=-Math.PI/2;
 const growY=groundHeight(PROJECT_STATIONS[1].x,PROJECT_STATIONS[1].z);
 box(2.98,.045,2.38,orange,PROJECT_STATIONS[1].x,growY+.025,PROJECT_STATIONS[1].z);
 box(2.8,.18,2.2,white,PROJECT_STATIONS[1].x,growY+.09,PROJECT_STATIONS[1].z);
 for(const [offset,height,color] of [[-.72,.48,orange],[0,.78,green],[.72,1.08,project]] as const)box(.55,height,.72,color,PROJECT_STATIONS[1].x+offset,growY+.18+height/2,PROJECT_STATIONS[1].z);
 for(const gx of [PROJECT_STATIONS[1].x-.95,PROJECT_STATIONS[1].x+.95])box(.1,1.55,.1,metal,gx,growY+.78,PROJECT_STATIONS[1].z-.72);
 box(2,.12,.12,orange,PROJECT_STATIONS[1].x,growY+1.53,PROJECT_STATIONS[1].z-.72);
 for(const [offset,color] of [[-.72,orange],[0,green],[.72,project]] as const)box(.42,.035,.28,color,PROJECT_STATIONS[1].x+offset,growY+.205,PROJECT_STATIONS[1].z+.77);
 const growRing=mesh(new THREE.TorusGeometry(1.62,.055,6,30),orange,PROJECT_STATIONS[1].x,growY+.12,PROJECT_STATIONS[1].z);growRing.rotation.x=-Math.PI/2;
 // A small sequence of ground inlays links the Nerya / Grow station to the
 // main bowl without adding more floating labels or enclosing the runout.
 for(let i=0;i<3;i++){
  box(.44,.025,.34,[orange,green,project][i],PROJECT_STATIONS[1].x-.42+i*.42,growY+.015,PROJECT_STATIONS[1].z+1.4);
 }
 // The low locator posts give the contextual badges a physical anchor, while
 // the space between the two stations remains open for a continuous bowl line.
 for(const [station,color] of [[PROJECT_STATIONS[0],project],[PROJECT_STATIONS[1],orange]] as const){
  const markerY=groundHeight(station.labelX,station.labelZ);
  box(.46,.18,.46,dark,station.labelX,markerY+.09,station.labelZ);
  box(.1,1.35,.1,metal,station.labelX,markerY+.84,station.labelZ);
  box(.38,.11,.22,color,station.labelX,markerY+1.54,station.labelZ);
 }
 // A small curb on the east runout links the bowl to its existing exit rail.
 box(3.2,.2,.52,dark,23.2,.1,3.55);
 box(3.08,.055,.55,white,23.2,.225,3.55);
 // GitHub Dev Shop: a compact open-front building. Its roof and partial
 // sidewalls frame the workshop without closing the existing skate approach.
 const shopX=-9.6,shopZ=12.75;
 box(7.4,.22,5,edge,shopX,.11,shopZ);
 box(7.1,.08,4.7,wood,shopX,.26,shopZ);
 // Full rear wall and partial side returns make a real room, leaving a broad
 // frontal opening so both the interior and the existing approach stay clear.
 box(6.35,2.42,.2,dark,shopX,1.55,shopZ-2.18);
 box(6.22,.16,.26,wood,shopX,.48,shopZ-2.02);
 for(const sx of [-3.12,3.12]){
  box(.2,1.5,3.35,dark,shopX+sx,1.05,shopZ-.35);
  box(.26,2.75,.26,metal,shopX+sx,1.48,shopZ+1.48);
  box(.3,.11,3.42,wood,shopX+sx,1.93,shopZ-.34);
 }
 // Split canopy roof sits over the rear half: architectural silhouette with
 // the front half left uncovered for a clear view into the room.
 for(const side of [-1,1]){
  const roof=box(3.42,.18,3.45,dark,shopX+side*1.66,3.18,shopZ-.62);
  roof.rotation.z=-side*.17;
  const roofRib=box(3.32,.055,.16,metal,shopX+side*1.66,3.3,shopZ-.62);
  roofRib.rotation.z=-side*.17;
 }
 box(6.75,.22,.28,metal,shopX,2.77,shopZ+1.5);
 box(6.48,.085,.32,yellow,shopX,2.9,shopZ+1.5);
 // The shop name is printed on a physical fascia board, not a floating HUD tag.
 const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=256;
 const signContext=signCanvas.getContext('2d');
 if(signContext){
  signContext.fillStyle='#202a2f';signContext.fillRect(0,0,1024,256);
  signContext.strokeStyle='#ebe989';signContext.lineWidth=12;signContext.strokeRect(12,12,1000,232);
  signContext.fillStyle='#ebe989';signContext.font='700 94px Arial, sans-serif';signContext.textAlign='center';signContext.textBaseline='middle';
  signContext.fillText('GB DEV SHOP',512,108);
  signContext.fillStyle='#e9e7de';signContext.font='500 34px Arial, sans-serif';
  signContext.fillText('SKATE  /  CODE  /  BUILD',512,196);
 }
 const shopSignTexture=new THREE.CanvasTexture(signCanvas);shopSignTexture.colorSpace=THREE.SRGBColorSpace;textures.push(shopSignTexture);
 const shopSignMaterial=new THREE.MeshBasicMaterial({map:shopSignTexture});materials.push(shopSignMaterial);
 mesh(new THREE.PlaneGeometry(2.9,.73),shopSignMaterial,shopX,2.76,shopZ+1.66);
 // Four mounted decks, a parts shelf and boxed stock establish the skate-shop
 // side of the room while the central approach remains unobstructed.
 for(const [dx,color] of [[-2.72,orange],[-1.88,yellow],[-1.04,project],[-.2,green]] as const){
  const deck=mesh(new THREE.CapsuleGeometry(.2,1.05,3,8),color,shopX+dx,1.52,shopZ-2.02);deck.scale.z=.22;
  for(const dy of [-.38,.38]){const wheel=cylinder(.11,.08,white,shopX+dx+.34,1.52+dy,shopZ-1.86);wheel.rotation.x=Math.PI/2}
 }
 box(2.7,.14,.48,wood,shopX-1.95,.72,shopZ-1.65);
 for(const dx of [-2.85,-1.95,-1.05])box(.1,.62,.1,metal,shopX+dx,1.08,shopZ-1.65);
 for(const [dx,color] of [[-2.75,orange],[-2.05,yellow],[-1.35,project]] as const){
  const wheel=cylinder(.15,.12,color,shopX+dx,.91,shopZ-1.58);wheel.rotation.x=Math.PI/2;
 }
 // Developer bench, monitor and a two-tier parts shelf occupy the right bay.
 for(const height of [1.35,1.88])box(1.95,.12,.38,wood,shopX+2.2,height,shopZ-1.87);
 for(const dx of [1.32,2.95])box(.12,.65,.13,metal,shopX+dx,1.05,shopZ-1.87);
 for(const [dx,height,color] of [[1.5,1.52,project],[2.16,1.52,yellow],[2.78,1.52,orange]] as const)
  box(.42,.3,.3,color,shopX+dx,height,shopZ-1.84);
 box(2.35,.16,.72,wood,shopX+1.73,.82,shopZ-.9);
 for(const dx of [.68,2.78])box(.13,.73,.13,metal,shopX+dx,.42,shopZ-.9);
 box(1.02,.65,.1,dark,shopX+1.58,1.31,shopZ-1.19);
 box(.86,.5,.025,screen,shopX+1.58,1.31,shopZ-1.13);
 box(.88,.025,.3,metal,shopX+1.58,.92,shopZ-.67);
 box(.28,.2,.32,orange,shopX+2.68,1.01,shopZ-.87);
 // Warm local material accents and the existing local point light brighten
 // the interior only; the park-wide lighting rig remains untouched.
 box(1.75,.025,.12,orange,shopX,.313,shopZ-2.32);
 const shopAccess=mesh(new THREE.TorusGeometry(.88,.045,6,24),yellow,shopX,.34,shopZ);shopAccess.rotation.x=-Math.PI/2;
 const shopLight=new THREE.PointLight(0xffd69b,8,7,2);shopLight.position.set(shopX+1.5,2.18,shopZ-.55);world.add(shopLight);
 for(const x of [12,19]){box(.11,.85,.11,metal,x,.42,5.3);box(.65,.11,.65,yellow,x,.88,5.3)}
 // Contato: a compact circular seating node marks the end of the route. The
 // center stays open for the existing interaction marker and approach line.
 const contactX=13.8,contactZ=12.1;
 const contactInset=mesh(new THREE.CircleGeometry(2.18,40),white,contactX,.022,contactZ);contactInset.rotation.x=-Math.PI/2;
 const contactRing=mesh(new THREE.TorusGeometry(1.52,.035,4,36),yellow,contactX,.045,contactZ);contactRing.rotation.x=-Math.PI/2;
 const contactOuter=mesh(new THREE.TorusGeometry(2.08,.028,4,36),orange,contactX,.035,contactZ);contactOuter.rotation.x=-Math.PI/2;
 // Short benches form an open circular seating arc, with both approach axes clear.
 for(const [x,z,width,rotation] of [[11.35,12.45,1.15,0],[12.25,10.4,1.15,.55],[15.35,10.4,1.15,-.55],[16.25,12.45,1.15,0],[12.25,14.05,1.15,-.55],[15.35,14.05,1.15,.55]] as const){
  const seat=box(width,.18,.48,wood,x,.32,z);seat.rotation.y=rotation;
  for(const side of [-1,1])box(.12,.3,.4,metal,x+side*(width/2-.16)*Math.cos(rotation),.15,z-side*(width/2-.16)*Math.sin(rotation));
  const cap=box(width+.06,.045,.52,white,x,.4325,z);cap.rotation.y=rotation;
  const trim=box(width-.18,.02,.045,yellow,x,.4675,z);trim.rotation.y=rotation;
 }
 // Existing south bench is retained as the final pause point, with lighter
 // end caps; the circular seating and open north side keep the pad connected.
 box(3.35,.18,.62,dark,13.8,.27,14.45);
 box(3.42,.045,.68,white,13.8,.3825,14.45);
 for(const x of [12.35,15.25])box(.12,.24,.48,metal,x,.12,14.45);
 // Two low planters and a local warm lamp soften the closing plaza without
 // adding any park-wide lighting changes.
 for(const x of [11,16.6]){
  box(.78,.18,.78,edge,x,.09,11.2);
  box(.64,.045,.64,soil,x,.2025,11.2);
  mesh(new THREE.IcosahedronGeometry(.36,0),green,x,.47,11.2);
  mesh(new THREE.IcosahedronGeometry(.22,0),leafLight,x+.15,.67,11.12);
 }
 for(let i=0;i<3;i++)box(1.15+i*.25,.014,.045,i===2?yellow:white,contactX,.025,14.95+i*.45);
 const contactLight=new THREE.PointLight(0xffd69b,3.2,5.5,2);contactLight.position.set(contactX,2.1,contactZ);world.add(contactLight);
 // Central Plaza: concentric terraces make the planted island read as an
 // architectural hub. Shallow stair flights connect its open approaches.
 box(6.8,.12,5.4,edge,0,.06,2);
 box(6.2,.12,4.9,dark,0,.18,2);
 box(5.7,.12,4.5,edge,0,.3,2);
 box(5.35,.13,4.15,dark,0,.425,2);
 box(4.8,.32,3.6,edge,0,.65,2);
 box(4.95,.08,3.75,white,0,.85,2);
 box(4.3,.045,3.1,green,0,.9125,2);
 // Fine inlaid bands mark each terrace edge in the overview.
 for(const [width,z,accent,y] of [[6.05,-.43,yellow,.14],[6.05,4.43,orange,.14],[5.55,-.22,yellow,.26],[5.55,4.22,orange,.26]] as const)
  box(width,.025,.07,accent,0,y,z,plazaDetails);
 for(const [x,depth,accent,y] of [[-3.33,4.7,orange,.14],[3.33,4.7,yellow,.14],[-3.03,4.4,orange,.26],[3.03,4.4,yellow,.26]] as const)
  box(.07,.025,depth,accent,x,y,2,plazaDetails);
 // Two shallow stair flights, each with four treads, connect the low terraces
 // while the east and west approaches stay open to the existing skate lines.
 for(const [z,direction] of [[-1.2,1],[5.2,-1]] as const){
  for(let i=0;i<4;i++){
   const height=.09+i*.09,stepZ=z+direction*i*.3;
   box(2.35,height,.32,soil,0,height/2,stepZ,plazaDetails);
   box(2.24,.025,.32,i===3?yellow:concrete,0,height+.0125,stepZ,plazaDetails);
  }
 }
 // Raised tree beds, root collars and capped ledges integrate planting,
 // seating and skateable edges into the same small piece of architecture.
 for(const [x,z] of [[-1,2.1],[1.1,1.8]] as const){
  box(2.16,.13,2.18,edge,x,.9775,z,plazaDetails);
  box(1.94,.045,1.96,soil,x,1.065,z,plazaDetails);
  cylinder(.53,.035,leafLight,x,1.105,z,plazaDetails);
  const rootRing=mesh(new THREE.TorusGeometry(.51,.035,4,12),white,x,1.125,z,plazaDetails);rootRing.rotation.x=-Math.PI/2;
 }
 box(.72,.12,.72,edge,.05,1.15,2.45,plazaDetails);
 cylinder(.085,2.2,metal,.05,2.1875,2.45,plazaDetails);
 mesh(new THREE.IcosahedronGeometry(.8,0),green,.05,4,2.45,plazaDetails);
 mesh(new THREE.IcosahedronGeometry(.58,0),leafLight,.42,4.45,2.25,plazaDetails);
 for(const [x,z,rotation] of [[-4.1,0,Math.PI/2],[4.1,2,Math.PI/2],[0,-2.2,0],[0,5.95,0]] as const){
  const length=x===-4.1?1.35:3.2;
  const ledge=box(length,.32,.5,dark,x,.16,z,plazaDetails);ledge.rotation.y=rotation;
  const cap=box(length+.05,.055,.56,white,x,.3475,z,plazaDetails);cap.rotation.y=rotation;
  const edgeStrip=box(length-.15,.025,.045,x<0?orange:yellow,x,.39,z,plazaDetails);edgeStrip.rotation.y=rotation;
 }
 // The eastern manual pad completes the line beside the existing rail.
 box(1.2,.2,.82,dark,3.8,.1,4.2,plazaDetails);
 box(1.08,.035,.73,white,3.8,.2175,4.2,plazaDetails);
 box(.94,.025,.055,yellow,3.8,.2475,4.2,plazaDetails);
 // Existing corner lamps sit on restrained footings matched to the terraces.
 for(const [x,z] of [[-4.05,-.95],[4.05,4.95]] as const){
  box(.55,.08,.34,dark,x,.04,z,plazaDetails);
  cylinder(.06,2.6,metal,x,1.3,z);
  box(.52,.1,.22,white,x,2.58,z);
 }
 // Final obstacle pass fills peripheral dead zones while preserving wide
 // central lanes for point-and-click and keyboard navigation.
 box(3.8,.24,1.35,dark,-17,.12,1.9);box(3.5,.08,1.05,white,-17,.28,1.9);
 const eastRail=box(4.4,.08,.08,metal,7.4,.62,9.1);eastRail.rotation.y=-.18;for(const ex of [5.4,9.4])cylinder(.055,.6,metal,ex,.3,9.1);
 box(3.1,.36,1.5,concrete,16.7,.18,8.1);box(2.75,.07,1.15,white,16.7,.4,8.1);
 // Trees outside the routes, with shadows for both rendering modes.
 const shadowMat=new THREE.MeshBasicMaterial({color:0x263d38,transparent:true,opacity:.13,depthWrite:false});materials.push(shadowMat);
 for(const [x,z] of [[-22,-14.3],[22,-13.8],[-22,14.8],[22,14.5],[-1,2.1],[1.1,1.8]]){
  const onPlaza=Math.abs(x)<2,baseY=onPlaza?1.0875:0;
  box(.9,.55,.9,edge,x,baseY+.275,z);cylinder(.1,2.8,metal,x,baseY+1.9,z);mesh(new THREE.IcosahedronGeometry(1.05,0),green,x,baseY+3.4,z);mesh(new THREE.IcosahedronGeometry(.8,0),green,x+.4,baseY+3.95,z-.1);
  const sh=mesh(new THREE.CircleGeometry(onPlaza?1.1:1.4,18),shadowMat,x+(onPlaza?.2:1),onPlaza?1.09:.025,z-(onPlaza?.15:.8));sh.rotation.x=-Math.PI/2;
 }
 for(const [x,z]of[[-5.5,14.5],[-4.4,14.5],[7.7,-14.7],[8.8,-14.7],[7,7.5]]){box(.4,.05,.4,orange,x,.03,z);mesh(new THREE.ConeGeometry(.14,.45,8),orange,x,.27,z)}
 // A modeled low-poly island shore grows from the same outline as the rideable
 // slab. The sand, shoal, foam, palms and rocks are static scenery only.
 const sandPalette=[mat(0xf2c98b),mat(0xe9bd7e),mat(0xf5d49a)],
  foundationSand=mat(0xb88f61),wetSandPalette=[mat(0xd7ad72),mat(0xc99e68)],
  shoal=mat(0x51b9ae,.62),foam=mat(0xe5e6c9,.74),
  palmBark=mat(0x75543b),palmGreens=[mat(0x4d806d),mat(0x719981),mat(0x91ad78)],
  rockMaterials=[mat(0x66736e),mat(0x7c8178),mat(0x4f6262)];
 for(const leaf of palmGreens)leaf.side=THREE.DoubleSide;
 const beachInner=subdivideOutline(PARK_OUTLINE,4.2),profileInfluence=(x:number,z:number,cx:number,cz:number,radius:number)=>Math.exp(-((x-cx)**2+(z-cz)**2)/(radius*radius));
 const isCoastRecess=([x,z]:readonly [number,number])=>(z>12.8&&x>=-3.1&&x<=9.1)||(x< -23.7&&z< -8.2);
 const beachWidths=beachInner.map(([x,z],i)=>{
  const phase=i/beachInner.length*Math.PI*2;
  const authored=.58*profileInfluence(x,z,-25,3,10)+.58*profileInfluence(x,z,18,17,8)-.46*profileInfluence(x,z,5,17,7)-.34*profileInfluence(x,z,26,-9,8);
  const width=THREE.MathUtils.clamp(3.05+Math.sin(phase*3+.45)*.6+Math.sin(phase*7-1.2)*.3+authored,1.9,4.25);
  return isCoastRecess(beachInner[i])?Math.min(width,1.55):width;
 });
 const foundationWidths=beachWidths.map((_,i)=>.28+Math.sin(i*.72)*.035);
 const midWidths=beachWidths.map((width,i)=>.3+width*.45+Math.sin(i*.5)*.05);
 const shorelineWidths=beachWidths.map((width,i)=>isCoastRecess(beachInner[i])?1.68:width+.18+Math.sin(i*.42)*.035);
 const wetWidths=beachWidths.map((width,i)=>isCoastRecess(beachInner[i])?1.72:width+.32+Math.sin(i*.62)*.055);
 const shoalWidths=beachWidths.map((width,i)=>isCoastRecess(beachInner[i])?1.8:width+1.9+Math.sin(i*.44)*.18);
 const foundationOuter=offsetPoints(beachInner,foundationWidths),beachMid=offsetPoints(beachInner,midWidths),beachOuter=offsetPoints(beachInner,beachWidths),shoreFoam=offsetPoints(beachInner,shorelineWidths),wetOuter=offsetPoints(beachInner,wetWidths),shoalOuter=offsetPoints(beachInner,shoalWidths);
 coastBand(beachInner,foundationOuter,-.765,-.815,[foundationSand]);
 coastBand(foundationOuter,beachMid,-.815,-.925,sandPalette);
 coastBand(beachMid,beachOuter,-.925,-1.085,sandPalette);
 flatCoast(beachOuter,-1.09,sandPalette[0]);
 coastBand(beachOuter,wetOuter,-1.085,-1.14,wetSandPalette);
 coastBand(wetOuter,shoalOuter,-1.14,-1.405,[shoal]);
 const pointOnOutline=(outline:readonly (readonly [number,number])[],edgeIndex:number,t:number):[number,number]=>{
  const a=outline[edgeIndex],b=outline[(edgeIndex+1)%outline.length];return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 };
 for(let i=0;i<shoreFoam.length;i++){
  const a=shoreFoam[i],b=shoreFoam[(i+1)%shoreFoam.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),angle=Math.atan2(-dz,dx);
  if(i%3===1||length<.45)continue;
  const t=.36+(i%4)*.08,x=a[0]+dx*t,z=a[1]+dz*t,dashLength=Math.min(length*.58,.58+(i%4)*.13);
  const dashGeometry=new THREE.PlaneGeometry(dashLength,.09+(i%3)*.018);dashGeometry.rotateX(-Math.PI/2);
  const dash=mesh(dashGeometry,foam,x,-1.098,z,coastDetails);dash.rotation.y=angle;
 }
 const frondGeometry=new THREE.BufferGeometry();
 frondGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
  0,0,0,.56,-.12,-.19,.56,-.12,.19,1.04,-.36,-.09,1.04,-.36,.09,1.62,-.62,0,
 ],3));frondGeometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,.5,.35,0,.35,1,.68,0,.68,1,1,.5],2));frondGeometry.setIndex([0,1,2,1,3,4,1,4,2,3,5,4]);frondGeometry.computeVertexNormals();
 const palmVariants=[
  {height:4.15,crown:.92,fronds:7,trunk:.96},
  {height:4.8,crown:1.06,fronds:8,trunk:1.04},
  {height:3.5,crown:.78,fronds:6,trunk:.86},
 ] as const;
 const palmSpecs:readonly (readonly [number,number,number,0|1|2,number,number])[]=[
  [0,.08,2.05,1,.28,.7],[0,.155,2.62,2,.18,-.45],
  [0,.82,2.12,0,.22,2.15],[3,.48,2.38,1,.3,-1.05],
  [5,.58,2.18,0,.22,-.25],[7,.25,2.12,1,.27,2.65],
  [7,.38,2.72,2,.18,1.8],[11,.38,2.08,0,.23,.45],
  [11,.51,2.65,2,.17,-.55],[15,.46,2.06,0,.21,-2.15],
 ];
 const fruitGeometry=new THREE.IcosahedronGeometry(.13,0),crownGeometry=new THREE.IcosahedronGeometry(.22,0),up=new THREE.Vector3(0,1,0);
 for(let i=0;i<palmSpecs.length;i++){
  const [edgeIndex,t,offset,variantIndex,lean,heading]=palmSpecs[i],variant=palmVariants[variantIndex],[x,z]=pointOnOutline(offsetOutline(offset),edgeIndex,t),baseY=-.765-.335*offset/3.4;
  const crownX=x+Math.cos(heading)*lean,crownZ=z+Math.sin(heading)*lean,crownY=baseY+variant.height;
  const trunkDirection=new THREE.Vector3(crownX-x,variant.height,crownZ-z),trunkLength=trunkDirection.length();
  const trunk=mesh(new THREE.CylinderGeometry(.14*variant.trunk,.23*variant.trunk,1,5),palmBark,(x+crownX)/2,baseY+variant.height/2,(z+crownZ)/2,coastDetails);
  trunk.scale.y=trunkLength;trunk.quaternion.setFromUnitVectors(up,trunkDirection.normalize());
  mesh(crownGeometry,palmGreens[(i+1)%palmGreens.length],crownX,crownY-.02,crownZ,coastDetails).scale.setScalar(variant.crown*.95);
  for(let leafIndex=0;leafIndex<variant.fronds;leafIndex++){
   const frond=mesh(frondGeometry,palmGreens[(i+leafIndex)%palmGreens.length],crownX,crownY,crownZ,coastDetails);
   frond.rotation.y=heading-leafIndex*Math.PI*2/variant.fronds;frond.rotation.z=(leafIndex%2?1:-1)*.025;
   const spread=variant.crown*(.88+(leafIndex%3)*.08);frond.scale.set(spread,spread*(.88+(i%3)*.055),spread*.92);
  }
  for(let fruit=0;fruit<(variantIndex===2?2:3);fruit++)mesh(fruitGeometry,palmBark,crownX+Math.cos(fruit*2.1+i)*.17,crownY-.15,crownZ+Math.sin(fruit*2.1+i)*.17,coastDetails);
 }
 // Low coastal shrubs stay close to palm groups and leave the long beach runs
 // open, framing the park without becoming a second visual focal point.
 const shrubGeometry=new THREE.IcosahedronGeometry(.4,0),shrubSpecs:readonly (readonly [number,number,number,number])[]=[
  [0,.115,1.12,.78],[0,.81,1.05,.64],[3,.5,1.08,.72],
  [7,.31,1.18,.76],[11,.44,1.12,.7],[15,.44,1.04,.66],
 ];
 for(let i=0;i<shrubSpecs.length;i++){
  const [edgeIndex,t,offset,scale]=shrubSpecs[i],[x,z]=pointOnOutline(offsetOutline(offset),edgeIndex,t),baseY=-.765-.335*offset/3.4;
  for(let blob=0;blob<3;blob++){
   const angle=blob*Math.PI*2/3+i*.47,radius=blob===0?0:.32*scale,shrub=mesh(shrubGeometry,palmGreens[(i+blob+1)%palmGreens.length],x+Math.cos(angle)*radius,baseY+.2*scale,z+Math.sin(angle)*radius,coastDetails);
   shrub.scale.set(scale*(.76+blob*.08),scale*(.5+(blob%2)*.12),scale*(.82+(blob%2)*.1));shrub.rotation.y=angle;
  }
 }
 // A short timber pier extends from the open east beach. It is scenery rather
 // than a rideable route, echoing the reference composition without changing
 // the park collision polygon or adding an imported-model loading cost.
 const pierDetails=new THREE.Group();pierDetails.name='island-pier';coastDetails.add(pierDetails);
 const pierOrigin={x:27.1,z:11.4},pierHeading=-.1,pierLength=7.2,pierWidth=2.15,pierDeckY=-.94;
 const pierDirection={x:Math.cos(pierHeading),z:Math.sin(pierHeading)},pierAcross={x:-Math.sin(pierHeading),z:Math.cos(pierHeading)};
 const pierPoint=(forward:number,lateral=0)=>({x:pierOrigin.x+pierDirection.x*forward+pierAcross.x*lateral,z:pierOrigin.z+pierDirection.z*forward+pierAcross.z*lateral});
 const pierPlanks=12;
 for(let i=0;i<pierPlanks;i++){
  const length=pierLength/pierPlanks-.055,point=pierPoint((i+.5)*pierLength/pierPlanks);
  const plank=box(length,.14,pierWidth,wood,point.x,pierDeckY,point.z,pierDetails);plank.rotation.y=-pierHeading;
 }
 for(const side of [-1,1]){
  const beamPoint=pierPoint(pierLength/2,side*(pierWidth/2-.22)),beam=box(pierLength,.17,.12,dark,beamPoint.x,pierDeckY-.18,beamPoint.z,pierDetails);beam.rotation.y=-pierHeading;
 }
 for(const forward of [1.05,3.45,5.85,7.05])for(const side of [-1,1]){
  const point=pierPoint(forward,side*(pierWidth/2-.18));
  cylinder(.095,1.32,wood,point.x,-1.36,point.z,pierDetails);
  cylinder(.125,.1,dark,point.x,-.68,point.z,pierDetails);
 }
 // The end platform gives the pier a legible silhouette at overview scale.
 for(let i=0;i<5;i++){
  const point=pierPoint(pierLength+.52+i*.5),plank=box(.44,.15,3.05,wood,point.x,pierDeckY+.005,point.z,pierDetails);plank.rotation.y=-pierHeading;
 }
 bakeScenery(pierDetails,false);
 // Rocks now form irregular headland clusters instead of an even perimeter.
 // Shared geometry and three materials keep the final baked cost constant.
 const rockGeometry=new THREE.IcosahedronGeometry(1,0),rockClusters=[
  {x:-35,z:-12.5,stones:[[0,0,2.05,1.34],[1.55,.65,.88,.88],[-.75,1.15,.58,.72]]},
  {x:-34,z:5.5,stones:[[0,0,1.32,1.05],[1.05,-.48,.62,.78]]},
  {x:-29.8,z:18.7,stones:[[0,0,1.42,1.08],[1.12,.52,.68,.76]]},
  {x:-11.5,z:-23.5,stones:[[0,0,1.15,.96],[1.05,.42,.58,.72]]},
  {x:28.8,z:-22.1,stones:[[0,0,1.32,1.08],[1.25,.48,.72,.8],[-.82,.85,.5,.7]]},
  {x:34,z:3.2,stones:[[0,0,2.12,1.3],[1.48,.72,.92,.88],[-.9,1.18,.58,.72]]},
  {x:31.2,z:17.1,stones:[[0,0,1.38,1.04],[1.08,.55,.64,.76]]},
  {x:13.2,z:23.7,stones:[[0,0,1.18,.96],[.92,.46,.55,.7]]},
 ] as const;
 let rockIndex=0;
 for(const cluster of rockClusters)for(const [dx,dz,size,heightScale] of cluster.stones){
  const x=cluster.x+dx,z=cluster.z+dz,height=size*heightScale,rock=mesh(rockGeometry,rockMaterials[rockIndex%rockMaterials.length],x,-1.42+height/2,z,coastDetails);
  rock.scale.set(size*(.67+(rockIndex%3)*.035),height/2,size*(.55+(rockIndex%4)*.04));rock.rotation.set(.08*(rockIndex%3),rockIndex*.71,.055*(rockIndex%5));rockIndex++;
 }
 // Broken rings around the larger offshore clusters make the waterline read
 // from the isometric camera without resorting to an expensive water shader.
 const rockFoamMaterial=new THREE.MeshBasicMaterial({color:0xd9e8d8,transparent:true,opacity:.62,depthWrite:false,side:THREE.DoubleSide});materials.push(rockFoamMaterial);
 for(let i=0;i<rockClusters.length;i++){
  const cluster=rockClusters[i],largest=cluster.stones[0][2],arc=new THREE.RingGeometry(largest*.76,largest*.88,22,1,.25+i*.33,Math.PI*1.24);
  const ring=mesh(arc,rockFoamMaterial,cluster.x,-1.397,cluster.z,coastDetails);ring.rotation.x=-Math.PI/2;ring.rotation.z=i*.47;ring.scale.set(1.28,.72+(i%3)*.08,1);
 }
 coastDetails.userData.composition={palms:palmSpecs.length,shrubs:shrubSpecs.length,rockClusters:rockClusters.length,rocks:rockIndex,pierPlanks:pierPlanks+5,rockFoamArcs:rockClusters.length};
 bakeScenery(coastDetails,false);
 // The ocean stays shader-free: a coarse triangulated surface uses four
 // restrained tones and shallow facets to suggest depth with four draw calls.
 const oceanSurface=new THREE.Group();oceanSurface.name='ocean-surface';background.add(oceanSurface);
 const oceanPalette=[mat(0x247f85,.52),mat(0x1d747d,.55),mat(0x176772,.58),mat(0x125965,.62)];
 const oceanPositions=Array.from({length:oceanPalette.length},()=>[] as number[]);
 const oceanSize=190,oceanSegments=20,oceanStep=oceanSize/oceanSegments,oceanHalf=oceanSize/2;
 const waterHeight=(x:number,z:number)=>Math.sin(x*.115+z*.052)*.023+Math.cos(z*.12-x*.035)*.017;
 const oceanVertex=(gridX:number,gridZ:number)=>{
  const x=-oceanHalf+gridX*oceanStep,z=-oceanHalf+gridZ*oceanStep;
  return [x,-1.475+waterHeight(x,z),z] as const;
 };
 for(let z=0;z<oceanSegments;z++)for(let x=0;x<oceanSegments;x++){
  const a=oceanVertex(x,z),b=oceanVertex(x+1,z),c=oceanVertex(x+1,z+1),d=oceanVertex(x,z+1);
  for(const triangle of [[a,b,c],[a,c,d]] as const){
   const centerX=(triangle[0][0]+triangle[1][0]+triangle[2][0])/3,centerZ=(triangle[0][2]+triangle[1][2]+triangle[2][2])/3;
   const depth=THREE.MathUtils.clamp((Math.hypot(centerX,centerZ)-27)/70,0,1);
   const variation=(Math.sin(centerX*.19+centerZ*.11)+Math.cos(centerZ*.16-centerX*.07))*.34;
   const tone=THREE.MathUtils.clamp(Math.floor(depth*3.15+variation+.35),0,oceanPalette.length-1);
   oceanPositions[tone].push(...triangle[0],...triangle[1],...triangle[2]);
  }
 }
 for(let i=0;i<oceanPalette.length;i++){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(oceanPositions[i],3));geometry.computeVertexNormals();
  const layer=mesh(geometry,oceanPalette[i],0,0,0,oceanSurface);layer.name=`ocean-depth-${i}`;layer.renderOrder=-200;layer.castShadow=false;layer.receiveShadow=false;layer.userData.ocean=true;
 }
 const waveDetails=new THREE.Group();waveDetails.name='ocean-wave-details';background.add(waveDetails);
 const waveMaterials=[
  new THREE.MeshBasicMaterial({color:0x8ac6bd,transparent:true,opacity:.28,depthWrite:false}),
  new THREE.MeshBasicMaterial({color:0x4ca39e,transparent:true,opacity:.32,depthWrite:false}),
  new THREE.MeshBasicMaterial({color:0xc3ddd0,transparent:true,opacity:.2,depthWrite:false}),
 ];materials.push(...waveMaterials);
 for(let i=0;i<60;i++){
  const angle=i*2.3999632297+(i%3)*.045,radius=34+(i%8)*4.9,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
  const waveGeometry=new THREE.PlaneGeometry(1.05+(i%5)*.42,.026+(i%3)*.012);waveGeometry.rotateX(-Math.PI/2);
  const wave=mesh(waveGeometry,waveMaterials[i%waveMaterials.length],x,-1.414+(i%2)*.006,z,waveDetails);
  wave.rotation.y=-angle+.18+Math.sin(i*.9)*.12;
 }
 bakeScenery(waveDetails,false);
 bakeScenery(plazaDetails);
 // Project pads are mirrored by accessible, projected HTML labels.
 const markers=SPOTS.map((s,i)=>{
    const m=mat(s.color);
    const baseY=groundHeight(s.x,s.z);
    const ring=mesh(new THREE.TorusGeometry(.95,.065,6,28),m,s.x,baseY+.09,s.z);ring.rotation.x=-Math.PI/2;
    // The marker sits beside the ride line, leaving the center of each spot
    // clear for the board and the character silhouette.
    const signX=i===4?s.x+2.85:s.x-1.35,signZ=i===4?s.z+1.35:s.z-1.1,signY=groundHeight(signX,signZ);
    const beacon=mesh(new THREE.OctahedronGeometry(.25),m,signX,signY+2.55,signZ+.23);
    box(2.1,.16,.8,dark,signX,signY+.08,signZ).renderOrder=-88;
    box(1.95,.06,.1,m,signX,signY+.18,signZ+.37);
    const pole=cylinder(.06,1.8,metal,signX,signY+.98,signZ+.28);
    const sign=box(1.85,.62,.12,dark,signX,signY+1.91,signZ+.28);
    sign.rotation.y=-Math.PI/8;
    const glow=box(1.87,.045,.14,m,signX,signY+2.24,signZ+.28);
    glow.rotation.y=-Math.PI/8;
    ring.userData.project=i;beacon.userData.project=i;
    return{ring,beacon,pole,baseY:signY,signX,signZ};
  });
 // A slightly longer deck and exposed trucks keep the silhouette legible at
 // the overview scale. Everything remains native Three.js geometry.
 const skater=new THREE.Group();skater.scale.setScalar(1.18);world.add(skater);const slope=new THREE.Group();skater.add(slope);const board=new THREE.Group();slope.add(board);board.position.y=.24;
 const shape=new THREE.Shape();shape.moveTo(-.33,-.71);shape.lineTo(-.31,.7);shape.quadraticCurveTo(-.31,1.05,0,1.05);shape.quadraticCurveTo(.31,1.05,.31,.7);shape.lineTo(.33,-.71);shape.quadraticCurveTo(.32,-1.05,0,-1.05);shape.quadraticCurveTo(-.32,-1.05,-.33,-.71);
 const deck=mesh(new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1}),orange,0,0,0,board);deck.rotation.x=Math.PI/2;
 const grip=mesh(new THREE.ShapeGeometry(shape),dark,0,.046,0,board);grip.rotation.x=-Math.PI/2;
 for(const z of[-.8,.8])box(.56,.012,.045,yellow,0,.053,z,board);
 const wheels:THREE.Mesh[]=[];for(const z of[-.64,.64]){box(.83,.075,.12,metal,0,-.085,z,board);for(const x of[-.42,.42]){const w=cylinder(.16,.11,white,x,-.13,z,board);w.rotation.z=Math.PI/2;wheels.push(w)}}
 const body=new THREE.Group();slope.add(body);body.position.y=.22;
 // A readable side-on skate stance: bent knees, two planted shoes and room
 // between the board, legs and torso even in the small overview projection.
 const shoe=mat(0x26363b),sole=mat(0xf1e9d3),hoodie=mat(0x568983),hoodShade=mat(0x3c6968),cap=mat(0xd97857),capBrim=mat(0x34464a);
 box(.42,.18,.54,shoe,-.12,.13,.47,body).rotation.y=.37;
 box(.43,.045,.55,sole,-.12,.025,.47,body).rotation.y=.37;
 box(.31,.48,.3,pants,-.12,.48,.36,body).rotation.x=.27;
 const legBack=new THREE.Group();legBack.position.set(.13,.73,-.36);body.add(legBack);legBack.rotation.x=-.25;
 box(.3,.51,.3,pants,0,-.27,0,legBack).rotation.x=-.13;
 const pushShoe=box(.42,.18,.54,shoe,.02,-.57,-.04,legBack);pushShoe.rotation.y=-.36;
 box(.43,.045,.55,sole,.02,-.68,-.04,legBack).rotation.y=-.36;
 // One solid hoodie shape gives the character a clean chibi silhouette.
 box(.56,.23,.43,hoodShade,0,.79,-.04,body);
 const torso=mesh(new THREE.CylinderGeometry(.35,.42,.72,6),hoodie,0,1.18,0,body);torso.rotation.z=-.05;
 box(.39,.25,.15,hoodShade,0,1.51,-.2,body);
 box(.08,.24,.035,sole,-.09,1.28,.36,body);box(.08,.24,.035,sole,.08,1.28,.36,body);
 box(.19,.045,.025,cap,0,1.1,.385,body);
 const arms:THREE.Group[]=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.38,1.43,0);body.add(arm);
  box(.25,.46,.3,hoodie,side*.045,-.19,0,arm).rotation.z=side*.13;
  box(.18,.16,.2,skin,side*.07,-.48,.04,arm);
  arm.rotation.z=side<0?.19:-.28;arms.push(arm);
 }
 // A compact laptop sleeve sits against the back of the hoodie. Its pale
 // computer panel reads from the opening view while both hands stay free.
 const strap=box(.075,.83,.045,capBrim,0,1.2,.36,body);strap.rotation.z=.73;
 box(.5,.61,.18,capBrim,.08,1.12,-.43,body);
 box(.39,.43,.035,mat(0xaac3bf),.08,1.1,-.54,body);
 box(.17,.065,.045,cap,.08,1.34,-.565,body);
 box(.12,.12,.048,yellow,.08,1.08,-.565,body);
 box(.2,.18,.18,skin,0,1.64,0,body);
 mesh(new THREE.IcosahedronGeometry(.36,1),skin,0,1.89,.04,body);
 // Flat crown, adjustable front band and a distinct rear brim read as a
 // backward cap from the camera's isometric angle and while turning.
 mesh(new THREE.CylinderGeometry(.32,.345,.17,8),cap,0,2.14,.04,body);
 box(.53,.06,.33,capBrim,0,2.075,-.37,body).rotation.x=.08;
 box(.27,.055,.045,sole,0,2.12,.38,body);
 for(const x of [-.13,.13])box(.055,.055,.025,capBrim,x,1.91,.385,body);
 box(.045,.07,.055,skin,0,1.81,.405,body);
 const skaterShadow=mesh(new THREE.CircleGeometry(.65,20),shadowMat,0,.03,0);skaterShadow.rotation.x=-Math.PI/2;skaterShadow.scale.y=1.7;
 const targetMat=new THREE.MeshBasicMaterial({color:0xebe989,transparent:true,opacity:.75,depthWrite:false});materials.push(targetMat);const targetRing=mesh(new THREE.TorusGeometry(.27,.028,5,24),targetMat,0,.055,0);targetRing.rotation.x=-Math.PI/2;targetRing.visible=false;
 const dispose=()=>{scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose()});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())};
 return{scene,world,skater,slope,board,body,wheels,arms,legBack,pushShoe,markers,skaterShadow,targetRing,rail,oceanSurface,waveDetails,dispose};
}
