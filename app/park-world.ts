import * as THREE from 'three';
import { groundHeight } from './skate-physics';
export const SPOTS=[
 {name:'Sobre mim',subtitle:'O começo da linha',x:-15.1,z:7.6,color:0xebe989,zone:'ENTRADA'},
 {name:'Experiência',subtitle:'A trajetória na transição',x:-12.7,z:-5.7,color:0xe6a98a,zone:'TRANSIÇÃO'},
 {name:'FinCore',subtitle:'Projeto · .NET e arquitetura',x:1,z:-7,color:0x9bcbd6,zone:'PROJETOS'},
 {name:'Grow Journeys',subtitle:'Projeto · aprender inglês',x:6.7,z:-5.9,color:0xb9cad8,zone:'PROJETOS'},
 {name:'GitHub',subtitle:'Código e experimentos',x:13.7,z:4.1,color:0xb9d3bd,zone:'LABORATÓRIO'},
 {name:'Contato',subtitle:'A próxima conexão',x:16,z:11.1,color:0xf5b59b,zone:'SAÍDA'},
];
export function createPark(){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x17252a);scene.fog=new THREE.Fog(0x17252a,65,140);
 const world=new THREE.Group();scene.add(world);
 const materials:THREE.Material[]=[];const textures:THREE.Texture[]=[];
 const mat=(color:number,roughness=.9)=>{const m=new THREE.MeshStandardMaterial({color,roughness});materials.push(m);return m};
 const concrete=mat(0xc5c5b8),edge=mat(0x676f68),line=mat(0x9b9f92),rampMat=mat(0xb8c9c7),orange=mat(0xeb8963),metal=mat(0x353f40,.4),dark=mat(0x202a2f),yellow=mat(0xebe989),white=mat(0xe9e7de),green=mat(0x5a8474),skin=mat(0xbe8c70),pants=mat(0x4b6070),tech=mat(0x769f9d),project=mat(0x96bbc3);
 const mesh=(geometry:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Object3D=world)=>{const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
 const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=world)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
 const cylinder=(r:number,h:number,m:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=world)=>mesh(new THREE.CylinderGeometry(r,r,h,10),m,x,y,z,parent);
 const hemi=new THREE.HemisphereLight(0xe3eef6,0x4a5b52,2.3);scene.add(hemi);
 const sunlight=new THREE.DirectionalLight(0xffe3bc,3);sunlight.position.set(-15,25,18);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1536,1536);Object.assign(sunlight.shadow.camera,{left:-25,right:25,top:20,bottom:-20,near:.5,far:80});sunlight.shadow.normalBias=.03;scene.add(sunlight);
 const fill=new THREE.DirectionalLight(0x9ebcca,1.4);fill.position.set(15,10,-18);scene.add(fill);
 box(42,.65,28,edge,0,-.44,0).renderOrder=-101;box(41.8,.1,27.8,concrete,0,-.065,0).renderOrder=-100;
 box(42,.12,.16,orange,0,0,13.9);box(.16,.12,28,orange,20.9,0,0);
 for(let i=-20;i<=20;i+=2.5)box(.018,.005,27.5,line,i,.001,0).renderOrder=-90;
 for(let i=-12.5;i<=12.5;i+=2.5)box(41.5,.005,.018,line,0,.001,i).renderOrder=-90;
 // Five connected zones: entry, career transition, two project decks, code
 // bowl and contact terrace. Thin markings point along the visitor's route.
 box(6.2,.008,5.1,orange,-15.1,.009,7.6).renderOrder=-89;
 box(8.7,.008,6.7,project,1.95,.009,-6.85).renderOrder=-89;
 box(6.9,.008,3.7,green,16,.009,11.05).renderOrder=-89;
 for(const [a,b] of [[SPOTS[0],SPOTS[1]],[SPOTS[1],SPOTS[2]],[SPOTS[2],SPOTS[3]],[SPOTS[3],SPOTS[4]],[SPOTS[4],SPOTS[5]]]){
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);
  for(let t=1.5;t<length-1.5;t+=1.5){const mark=box(.08,.01,.65,yellow,a.x+dx*t/length,.025,a.z+dz*t/length);mark.rotation.y=angle}
 }
 for(const z of [-13.2,13.2])for(let x=-19.7;x<20;x+=1.8)box(.75,.012,.1,white,x,.021,z);
 function surface(x0:number,x1:number,z0:number,z1:number,m:THREE.Material,nx:number,nz:number){
  const pos:number[]=[],idx:number[]=[];for(let iz=0;iz<=nz;iz++){for(let ix=0;ix<=nx;ix++){const x=x0+(x1-x0)*ix/nx,z=z0+(z1-z0)*iz/nz;pos.push(x,groundHeight(x,z),z)}}
  for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){const a=iz*(nx+1)+ix;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,m);
 }
 surface(-17,-8.5,-10.3,-1.2,rampMat,2,36);
 // Side panels follow the ramp profile, closing the geometry.
 for(const x of [-17,-8.5]){const pos:number[]=[],idx:number[]=[];for(let i=0;i<=36;i++){const z=-10.3+i*9.1/36;pos.push(x,0,z,x,groundHeight(x,z),z)}for(let i=0;i<36;i++){let a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const m=orange.clone();m.side=THREE.DoubleSide;materials.push(m);mesh(geo,m)}
 for(const z of [-10.3,-1.2]){box(8.5,.12,.12,metal,-12.75,2.7,z);box(8.5,2.6,.1,edge,-12.75,1.3,z)}
 surface(-2.4,6.3,-10.2,-3.5,project,28,22);
 surface(8.7,18.7,-1,9.3,tech,26,26);
 // Features are recognizable from the overview and leave broad routes open.
 const rail=box(5,.08,.08,metal,-4.3,.64,1.3);for(const x of [-6.5,-2.1])cylinder(.055,.62,metal,x,.31,1.3);
 box(4,.26,.7,dark,-4,.13,10.4);box(4,.12,.9,white,-4,.32,10.4);
 for(let i=0;i<4;i++)box(3.3,.14,.7,concrete,18.5,.07+i*.14,10+i*.65);
 for(let i=0;i<19;i++)box(.07,1,.07,metal,-19.6+i*2.2,.5,-13.55);box(40,.07,.07,metal,0,1,-13.55);
 for(const x of [-19,19]){cylinder(.07,5,metal,x,2.5,-12.1);box(.7,.12,.25,white,x,5,-12.1)}
 // Arrival arch, project ledges and laptop-shaped technical blocks.
 for(const x of [-18.2,-11.8])box(.13,3.2,.13,metal,x,1.6,5.8);
 box(6.6,.2,.22,yellow,-15,3.18,5.8);
 for(const x of [-1.6,5.8]){box(1.1,.4,1.25,dark,x,.2,-3.3);box(1.12,.05,.12,yellow,x,.43,-2.73)}
 for(const x of [10.7,16.7]){box(.11,.85,.11,metal,x,.42,-.35);box(.65,.11,.65,yellow,x,.88,-.35)}
 box(3.5,.22,.85,dark,17.2,.11,12.45);box(3.5,.07,1,white,17.2,.28,12.45);
 // Trees outside the routes, with shadows for both rendering modes.
 const shadowMat=new THREE.MeshBasicMaterial({color:0x263d38,transparent:true,opacity:.13,depthWrite:false});materials.push(shadowMat);
 for(const [x,z] of [[-19,-11.5],[19,-10.5],[-19,12.5],[19,12.2]]){
  box(.9,.55,.9,edge,x,.275,z);cylinder(.1,2.8,metal,x,1.9,z);mesh(new THREE.IcosahedronGeometry(1.05,0),green,x,3.4,z);mesh(new THREE.IcosahedronGeometry(.8,0),green,x+.4,3.95,z-.1);
  const sh=mesh(new THREE.CircleGeometry(1.4,18),shadowMat,x+1,.025,z-.8);sh.rotation.x=-Math.PI/2;
 }
 for(const [x,z]of[[-4,12],[-3,12],[7,-11],[8,-11]]){box(.4,.05,.4,orange,x,.03,z);mesh(new THREE.ConeGeometry(.14,.45,8),orange,x,.27,z)}
 // Abstract coastal backdrop; part of the 3D environment, not a city reconstruction.
 const ocean=mat(0x24434b);box(130,.08,70,ocean,0,-1.3,-43).renderOrder=-200;
 for(let i=0;i<24;i++)box(4+(i%5),.02,.045,mat(i%2?0x31555b:0x2d4c54),-45+(i*13)%90,-1.24,-16-(i%7)*6).renderOrder=-190;
 const skyline=mat(0x293b40);for(let i=0;i<13;i++)box(2.2,2+(i%4)*1.8,2,skyline,-33+i*5,.2,-30-(i%3)*3);
 // Project pads are mirrored by accessible, projected HTML labels.
 const markers=SPOTS.map((s,i)=>{
    const m=mat(s.color);
    const baseY=groundHeight(s.x,s.z);
    const ring=mesh(new THREE.TorusGeometry(.95,.065,6,28),m,s.x,baseY+.09,s.z);ring.rotation.x=-Math.PI/2;
    // The marker sits beside the ride line, leaving the center of each spot
    // clear for the board and the character silhouette.
    const signX=s.x-1.35,signZ=s.z-1.1,signY=groundHeight(signX,signZ);
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
 const dispose=()=>{world.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose()});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())};
 return{scene,world,skater,slope,board,body,wheels,arms,legBack,pushShoe,markers,skaterShadow,targetRing,rail,dispose};
}
