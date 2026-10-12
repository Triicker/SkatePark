"use client";
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {ArrowUp,ArrowDown,ArrowLeft,ArrowRight,ArrowUpRight,RotateCcw,Focus,Map,Pause,Play,ScanSearch,X} from 'lucide-react';
import {SoftwareRenderer} from './software-renderer';
import {createPark,PROJECT_STATIONS,SPOTS} from './park-world';
import {groundHeight,screenDirection,evolveMomentum,turnTowards,advancePosition,SPAWN,LIMIT_X,LIMIT_Z,isInsidePark} from './skate-physics';

type Engine={jump:(flip:boolean)=>void;reset:()=>void;step:(direction:string)=>void;goTo:(spot:number)=>void;goToStation:(station:number)=>void};
type Props={blocked:boolean;onProject:(index:number)=>void};
type CameraMode='normal'|'close'|'overview';
export function Scene({blocked,onProject}:Props){
 const mount=useRef<HTMLDivElement>(null),root=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null);
 const held=useRef(new Set<string>()),refs=useRef({blocked,modal:blocked,paused:false,cameraMode:'normal' as CameraMode,zoom:1});
 const projectRef=useRef(onProject);
 const labels=useRef<(HTMLButtonElement|null)[]>([]),projectLabels=useRef<(HTMLButtonElement|null)[]>([]);const avatarLabel=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false),[error,setError]=useState(false),[paused,setPaused]=useState(false),[cameraMode,setCameraMode]=useState<CameraMode>('normal'),[map,setMap]=useState(false),[help,setHelp]=useState(false),[near,setNear]=useState<number|null>(null),[trick,setTrick]=useState(''),[stats,setStats]=useState({speed:0,distance:0}),[compat,setCompat]=useState(false),[visited,setVisited]=useState<number[]>([]);
 const nearRef=useRef<number|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  refs.current={...refs.current,paused,cameraMode,blocked:blocked||map||help,modal:blocked};
  projectRef.current=onProject;
 },[blocked,cameraMode,help,map,onProject,paused]);
 useEffect(()=>{
  const container=mount.current;if(!container)return;const heldKeys=held.current;
  let renderer:THREE.WebGLRenderer|SoftwareRenderer;let cpu=false;
  const probe=document.createElement('canvas');const gl=probe.getContext('webgl2',{antialias:true});
  try{if(gl){const gpu=new THREE.WebGLRenderer({canvas:probe,context:gl,antialias:true,alpha:false});gpu.shadowMap.enabled=true;gpu.shadowMap.type=THREE.PCFSoftShadowMap;gpu.outputColorSpace=THREE.SRGBColorSpace;gpu.toneMapping=THREE.ACESFilmicToneMapping;gpu.toneMappingExposure=1.05;renderer=gpu}else{renderer=new SoftwareRenderer();cpu=true}}catch{renderer=new SoftwareRenderer();cpu=true}
  setCompat(cpu);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  const canvas=renderer.domElement as HTMLCanvasElement;canvas.className='scene-canvas';canvas.tabIndex=0;canvas.setAttribute('role','application');canvas.setAttribute('aria-label','Pista de skate. Use WASD ou setas para andar, espaço para ollie, F para kickflip e E para abrir o projeto próximo.');container.appendChild(canvas);
  const park=createPark();const {scene,world,skater,slope,board,body,wheels,arms,legBack,markers,skaterShadow,targetRing,oceanSurface,waveDetails}=park;
  const camera=new THREE.OrthographicCamera(-26,26,17,-17,.1,220);const look=new THREE.Vector3(SPAWN.x,0,SPAWN.z);const cameraOffset=new THREE.Vector3(34,38,36);camera.position.copy(look).add(cameraOffset);camera.lookAt(look);
  world.updateMatrixWorld(true);
  const parkBounds=new THREE.Box3().setFromObject(world),overviewCenter=parkBounds.getCenter(new THREE.Vector3());
  const overviewViewDirection=cameraOffset.clone().negate().normalize();
  const overviewRight=new THREE.Vector3().crossVectors(overviewViewDirection,new THREE.Vector3(0,1,0)).normalize();
  const overviewUp=new THREE.Vector3().crossVectors(overviewRight,overviewViewDirection).normalize();
  const overviewMin=new THREE.Vector2(Infinity,Infinity),overviewMax=new THREE.Vector2(-Infinity,-Infinity),corner=new THREE.Vector3();
  for(let i=0;i<8;i++){
   corner.set(i&1?parkBounds.max.x:parkBounds.min.x,i&2?parkBounds.max.y:parkBounds.min.y,i&4?parkBounds.max.z:parkBounds.min.z).sub(overviewCenter);
   const horizontal=corner.dot(overviewRight),vertical=corner.dot(overviewUp);
   overviewMin.x=Math.min(overviewMin.x,horizontal);overviewMax.x=Math.max(overviewMax.x,horizontal);
   overviewMin.y=Math.min(overviewMin.y,vertical);overviewMax.y=Math.max(overviewMax.y,vertical);
  }
  const overviewSpanX=overviewMax.x-overviewMin.x,overviewSpanY=overviewMax.y-overviewMin.y;
  let width=1,height=1,visible=true,disposed=false,frame=0,last=performance.now(),time=0,lastPaint=0,hudTime=0;
  let x=SPAWN.x,z=SPAWN.z,y=0,vx=0,vz=0,vy=0,yaw=3.4,air=false,flip=false,airTime=0,distance=0,nudgeUntil=0,nudge='',pushClock=0,landing=0;
  let target:THREE.Vector3|null=null;let lastNear:number|null=null;let resizeNeeded=true;let lastCameraMode:CameraMode='normal',lastZoom=1;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function tell(message:string){setTrick(message);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{if(!disposed)setTrick('')},1800)}
  function jump(isFlip:boolean){if(refs.current.blocked)return;setPaused(false);refs.current.paused=false;if(!air){air=true;vy=7;airTime=0;flip=isFlip;tell(isFlip?'KICKFLIP':'OLLIE')}}
  function clearInput(){heldKeys.clear();target=null;nudge='';vx=0;vz=0;targetRing.visible=false}
  function moveToPoint(px:number,pz:number){target=new THREE.Vector3(px,0,pz);targetRing.position.set(px,groundHeight(px,pz)+.08,pz);targetRing.visible=true;setPaused(false);refs.current.paused=false}
  function reset(){x=SPAWN.x;z=SPAWN.z;y=0;vy=0;air=false;distance=0;yaw=3.4;landing=0;board.rotation.set(0,0,0);slope.rotation.set(0,0,0);clearInput();setNear(null);lastNear=null;nearRef.current=null;setVisited([]);setStats({speed:0,distance:0});setPaused(false);refs.current.paused=false;look.set(SPAWN.x,0,SPAWN.z);tell('NOVA SESSÃO')}
  engine.current={jump,reset,step:(direction)=>{nudge=direction;nudgeUntil=performance.now()+210;setPaused(false);refs.current.paused=false},goTo:(index)=>{const spot=SPOTS[index];if(spot)moveToPoint(spot.x,spot.z)},goToStation:(index)=>{const station=PROJECT_STATIONS[index];if(station)moveToPoint(station.x,station.z)}};
  const inputKeys=['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'];
  function keyDown(e:KeyboardEvent){
   const focused=document.activeElement as HTMLElement|null;
   if(!visible||refs.current.blocked||focused?.matches('input,textarea,select,[contenteditable=true]')||focused?.closest('[role=dialog]'))return;
   if(e.ctrlKey||e.metaKey||e.altKey)return;
   const key=e.key.toLowerCase();
   if(inputKeys.includes(key)){e.preventDefault();heldKeys.add(key);target=null;setPaused(false);refs.current.paused=false;nudge=key;nudgeUntil=performance.now()+110}
   else if(key===' '||key==='f'){if(focused?.tagName==='BUTTON'&&key===' ')return;e.preventDefault();if(!e.repeat)jump(key==='f')}
   else if((key==='e'||key==='enter')&&nearRef.current!==null){e.preventDefault();projectRef.current(nearRef.current);clearInput()}
  }
  function keyUp(e:KeyboardEvent){heldKeys.delete(e.key.toLowerCase())}
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',clearInput);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  let down:{x:number;y:number}|null=null;
  function pointerDown(e:PointerEvent){if(e.button!==0)return;down={x:e.clientX,y:e.clientY}}
  function pointerUp(e:PointerEvent){if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>12){down=null;return}down=null;if(refs.current.blocked)return;
   canvas.focus({preventScroll:true});setPaused(false);refs.current.paused=false;
   const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const point=new THREE.Vector3();
   if(raycaster.ray.intersectPlane(plane,point)){
    if(isInsidePark(point.x,point.z)){target=point;targetRing.position.set(point.x,groundHeight(point.x,point.z)+.08,point.z);targetRing.visible=true}
    else{target=null;targetRing.visible=false}
   }
  }
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);
  function onVisibility(){if(document.hidden)clearInput()};document.addEventListener('visibilitychange',onVisibility);
  const resize=()=>{width=container!.clientWidth;height=container!.clientHeight;if(!width||!height)return;renderer.setSize(width,height);resizeNeeded=true};
  const ro=new ResizeObserver(resize);ro.observe(container);resize();
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)clearInput()},{threshold:.12});io.observe(container);
  function projection(){
   const aspect=width/height,mobile=width<700,mode=refs.current.cameraMode;
   // Normal and close retain their previous framing. Overview fits the actual
   // park bounds into the canvas area while leaving room beneath the HUD.
   const localSize=mode==='close'?(mobile?8.7:8.9):(mobile?17.1:18.2);
   const overviewHalfH=Math.max(overviewSpanY/(2*(mobile ? .78 : .84)),overviewSpanX/(2*aspect*(mobile ? .88 : .94)))*1.06;
   const halfH=(mode==='overview'?overviewHalfH:localSize)/refs.current.zoom;
   camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();resizeNeeded=false;lastCameraMode=mode;lastZoom=refs.current.zoom;
  }
  const projected=new THREE.Vector3();function place(element:HTMLElement|null,px:number,py:number,pz:number){if(!element)return;projected.set(px,py,pz).project(camera);element.style.left=`${(projected.x+1)*width/2}px`;element.style.top=`${(1-projected.y)*height/2}px`;element.style.visibility=projected.x< -1.05||projected.x>1.05||projected.y< -1.05||projected.y>1.05?'hidden':'visible'}
  function animate(now:number){
   frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.045);last=now;if(disposed||!visible||document.hidden)return;
   time+=dt;
   if(!refs.current.paused&&!refs.current.modal){
    const isHeld=(...keys:string[])=>keys.some(k=>heldKeys.has(k)||(nudge===k&&now<nudgeUntil));
    const horizontal=Number(isHeld('d','arrowright'))-Number(isHeld('a','arrowleft'));const vertical=Number(isHeld('s','arrowdown'))-Number(isHeld('w','arrowup'));
    const angle=Math.atan2(cameraOffset.x,cameraOffset.z);let direction=screenDirection(horizontal,vertical,angle);
    if(horizontal||vertical){target=null;targetRing.visible=false}
    if(target){const dx=target.x-x,dz=target.z-z,l=Math.hypot(dx,dz);if(l<.3&&Math.hypot(vx,vz)<.7){target=null;targetRing.visible=false;vx=0;vz=0}else{direction={x:dx/Math.max(l,.01),z:dz/Math.max(l,.01)}}}
    const desiredSpeed=target?Math.min(7.2,Math.max(.35,Math.hypot(target.x-x,target.z-z)*1.7)):7.2;
    const motion=evolveMomentum(vx,vz,direction.x,direction.z,dt,desiredSpeed);vx=motion.x;vz=motion.z;
    const airNext={x:THREE.MathUtils.clamp(x+vx*dt,-LIMIT_X,LIMIT_X),z:THREE.MathUtils.clamp(z+vz*dt,-LIMIT_Z,LIMIT_Z)};
    const next=air?(isInsidePark(airNext.x,airNext.z)?airNext:{x,z}):advancePosition(x,z,vx,vz,dt);
    if(next.x===x&&next.z===z&&Math.hypot(vx,vz)>.25){vx=0;vz=0}
    distance+=Math.hypot(next.x-x,next.z-z);x=next.x;z=next.z;const ground=groundHeight(x,z),speed=Math.hypot(vx,vz);
    const hasDirection=Math.hypot(direction.x,direction.z)>.01;const goal=Math.atan2(hasDirection?direction.x:vx,hasDirection?direction.z:vz);const turning=hasDirection||speed>.15;
    if(turning)yaw=turnTowards(yaw,goal,(speed<1?5:2.9)*dt);
    const difference=turning?Math.atan2(Math.sin(goal-yaw),Math.cos(goal-yaw)):0;
    if(air){vy-=14*dt;y+=vy*dt;airTime+=dt;if(y<=ground&&vy<0){y=ground;vy=0;air=false;landing=.12;board.rotation.set(0,0,0)}}else if(y-ground>.2){air=true;vy=0;airTime=.8;flip=false}else y=ground;
    landing=Math.max(0,landing-dt);
    skater.position.set(x,y,z);skater.rotation.y=yaw;
    const slopeAhead=groundHeight(x+Math.sin(yaw)*.3,z+Math.cos(yaw)*.3),slopeBehind=groundHeight(x-Math.sin(yaw)*.3,z-Math.cos(yaw)*.3);
    const tilt=air?0:THREE.MathUtils.clamp(Math.atan2(slopeAhead-slopeBehind,.6),-.6,.6);slope.rotation.x+=(tilt-slope.rotation.x)*Math.min(1,dt*12);
    const lean=THREE.MathUtils.clamp(difference*speed/7,-.25,.25);slope.rotation.z+=(-lean-slope.rotation.z)*Math.min(1,dt*7);
    const progress=Math.min(airTime/.95,1);board.rotation.z=air&&flip?progress*Math.PI*2:0;board.rotation.x=air?Math.sin(progress*Math.PI)*.2:0;board.rotation.y=lean*.3;
    const pushing=!air&&Math.hypot(direction.x,direction.z)>.01&&speed<6.4;
    if(pushing)pushClock+=dt*(3.2+speed*.42);
    body.position.y=.22+(air?Math.sin(progress*Math.PI)*.13:Math.sin(pushClock*2)*.022*(pushing?1:0))-landing*.45;
    body.rotation.x=air?-.1:-.09-Math.min(speed/7,.1);body.rotation.z=-lean*.7;
    legBack.rotation.x=-.25+(air?-.25:pushing?Math.sin(pushClock)*.48:0);arms[0].rotation.z=air?.65:.22+Math.sin(pushClock)*.13*(pushing?1:0);arms[1].rotation.z=air?-.42:-.3;
   wheels.forEach(w=>w.rotation.x+=speed*dt*8);skaterShadow.position.set(x,ground+.03,z);skaterShadow.rotation.z=-yaw;
    // Only the ocean receives ambient motion: a few millimetres of tide and a
    // very slow drift of the baked surface strokes. Reduced-motion stays still.
    if(!reduced.matches){
     oceanSurface.position.y=Math.sin(time*.32)*.009;
     waveDetails.position.set(Math.sin(time*.12)*.22,Math.sin(time*.38)*.008,Math.cos(time*.1)*.18);
     waveDetails.rotation.y=Math.sin(time*.09)*.004;
    }
    if(!reduced.matches)markers.forEach((m,i)=>{m.beacon.position.y=m.baseY+2.55+Math.sin(time*1.8+i)*.11;m.beacon.rotation.y=time*.5});
    let nearest=SPOTS.findIndex(s=>Math.hypot(x-s.x,z-s.z)<2.6);if(nearest<0&&PROJECT_STATIONS.some(station=>Math.hypot(x-station.x,z-station.z)<2.5))nearest=3;const selected=nearest<0?null:nearest;if(selected!==lastNear){lastNear=selected;nearRef.current=selected;setNear(selected);if(selected!==null)setVisited(previous=>previous.includes(selected)?previous:[...previous,selected])}
   }else{clearInput()}
   if(resizeNeeded||lastCameraMode!==refs.current.cameraMode||lastZoom!==refs.current.zoom)projection();
   const mode=refs.current.cameraMode,speed=Math.hypot(vx,vz),forwardX=speed>.2?vx/speed:Math.sin(yaw),forwardZ=speed>.2?vz/speed:Math.cos(yaw);
   const lookAhead=mode==='close'?1.3:mode==='normal'?2.7:0;
   const desiredLook=mode==='overview'?overviewCenter:new THREE.Vector3(x+forwardX*lookAhead,y*.3,z+forwardZ*lookAhead);
   const damping=mode==='close'?5.2:mode==='normal'?3.5:2.2;
   look.lerp(desiredLook,reduced.matches?1:1-Math.exp(-dt*damping));camera.position.copy(look).add(cameraOffset);camera.lookAt(look);camera.updateMatrixWorld();
   if(now-lastPaint>(cpu?33:0)){renderer.render(scene,camera);markers.forEach((m,i)=>place(labels.current[i],m.signX,m.baseY+2.95,m.signZ));PROJECT_STATIONS.forEach((station,i)=>place(projectLabels.current[i],station.labelX,groundHeight(station.labelX,station.labelZ)+1.95,station.labelZ));place(avatarLabel.current,x,y+2.45,z);lastPaint=now}
   hudTime+=dt;if(hudTime>.2){setStats({speed:Math.hypot(vx,vz)*3.6,distance});hudTime=0}
  }
  skater.position.set(x,y,z);projection();renderer.render(scene,camera);setReady(true);frame=requestAnimationFrame(animate);
  function lost(e:Event){e.preventDefault();setError(true);clearInput()};canvas.addEventListener('webglcontextlost',lost);
  return()=>{disposed=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clearInput);document.removeEventListener('visibilitychange',onVisibility);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('webglcontextlost',lost);if(timer.current)clearTimeout(timer.current);park.dispose();renderer.dispose();canvas.remove();heldKeys.clear();engine.current=null};
 },[]);
 
 // Event handlers read the engine refs only after user interaction.
 // eslint-disable-next-line react-hooks/refs
 const hold=(key:string)=>({onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);held.current.add(key);refs.current.paused=false;setPaused(false)},onPointerUp:()=>held.current.delete(key),onPointerCancel:()=>held.current.delete(key),onLostPointerCapture:()=>held.current.delete(key),onClick:()=>engine.current?.step(key),onBlur:()=>held.current.delete(key)});
 return <div id="pista" ref={root} className="park-experience">
  <div className="scene-mount" ref={mount}/>
  <div className="park-vignette"/>
  <header className="world-header"><button className="brand" onClick={()=>engine.current?.reset()} aria-label="Gabriel Bassalo, voltar ao início"><span>gb<span>.</span></span><span>GABRIEL BASSALO<br/>DEVELOPER SKATEPARK</span></button><div className="world-header-actions"><span className="city">SALVADOR, BR / 2026</span><button onClick={()=>setHelp(!help)}>COMO JOGAR</button><button className="map-toggle" onClick={()=>{setMap(!map);setHelp(false);setCameraMode(map?'normal':'overview')}}><Map size={17}/> MAPA <span>{visited.length}/{SPOTS.length}</span></button></div></header>
  <div className="world-title"><span>01 / UM PORTFÓLIO PARA EXPLORAR</span><h1>Entre na pista<span>.</span></h1><p>Ande de skate para conhecer meus projetos e minha trajetória.</p></div>
  <div className="speed-display"><strong>{stats.speed.toFixed(0).padStart(2,'0')}</strong><span>KM/H</span></div>
  {ready&&!error&&<><div className="project-hotspots">{SPOTS.map((s,i)=><button key={s.name} ref={el=>{labels.current[i]=el}} onClick={()=>{engine.current?.goTo(i);setMap(false);setHelp(false)}} className={`hotspot${near===i?' near':''}${i===4?' shop-hotspot':''}`} aria-label={`Ir de skate para ${s.name}`}><span className="spot-number">0{i+1}</span><span>{s.name}</span><ArrowUpRight size={13}/></button>)}{near===3&&cameraMode!=='overview'&&PROJECT_STATIONS.map((station,i)=><button key={station.name} ref={el=>{projectLabels.current[i]=el}} onClick={()=>{engine.current?.goToStation(i);setMap(false);setHelp(false)}} className="project-badge" aria-label={`Ir para a área de Projetos: ${station.name}`}><span>{station.name}</span><small>{station.subtitle}</small></button>)}</div><div ref={avatarLabel} className="rider-label">VOCÊ <span>↓</span></div></>}
  {(!ready||error)&&<div className="park-loading"><span className="loading-mark">gb.</span><p>{error?'A conexão com a pista foi interrompida.':'Preparando o skatepark…'}</p>{error&&<button onClick={()=>window.location.reload()}>Reabrir a pista</button>}</div>}
  <div className="trick-announcement" aria-live="polite">{trick}</div>
  {near!==null&&!map&&!help&&<div className="spot-preview"><span>ÁREA {SPOTS[near].zone} · VOCÊ CHEGOU EM</span><h2>{SPOTS[near].name}</h2><p>{SPOTS[near].subtitle}</p><button onClick={()=>onProject(near)}>Conhecer este ponto <ArrowUpRight size={16}/><kbd>E</kbd></button></div>}
  {paused&&<div className="paused-overlay"><button onClick={()=>setPaused(false)}><Play size={21} fill="currentColor"/>Continuar andando</button></div>}
  <div className="touch-controls"><div className="direction-pad"><button className="d-up" aria-label="Mover para cima" {...hold('arrowup')}><ArrowUp size={20}/></button><button className="d-left" aria-label="Mover para esquerda" {...hold('arrowleft')}><ArrowLeft size={20}/></button><button className="d-down" aria-label="Mover para baixo" {...hold('arrowdown')}><ArrowDown size={20}/></button><button className="d-right" aria-label="Mover para direita" {...hold('arrowright')}><ArrowRight size={20}/></button></div><div className="touch-tricks"><button onClick={()=>engine.current?.jump(false)}>Ollie</button><button onClick={()=>engine.current?.jump(true)}>Flip ↻</button></div></div>
  <div className="world-footer"><div className="control-instruction"><strong>CONTROLES</strong><span>WASD / SETAS <i>mover</i></span><span>ESPAÇO <i>ollie</i></span><span>F <i>kickflip</i></span><span>E <i>explorar</i></span></div><div className="world-actions"><button onClick={()=>setCameraMode(current=>current==='normal'?'close':current==='close'?'overview':'normal')} aria-label={`Câmera ${cameraMode}. Alternar enquadramento`}>{cameraMode==='normal'?<Focus size={17}/>:cameraMode==='close'?<ScanSearch size={17}/>:<Map size={17}/>} {cameraMode==='normal'?'CÂMERA NORMAL':cameraMode==='close'?'CÂMERA PRÓXIMA':'VISÃO GERAL'}</button><button onClick={()=>engine.current?.reset()} aria-label="Recomeçar" title="Recomeçar"><RotateCcw size={17}/></button><button onClick={()=>setPaused(!paused)} aria-label={paused?'Retomar':'Pausar'} title={paused?'Retomar':'Pausar'}>{paused?<Play size={17}/>:<Pause size={17}/>}</button></div></div>
  {map&&<div className="park-map"><div className="map-header"><div><span className="small-caps">NAVEGAÇÃO DA PISTA</span><h2>Escolha um destino.</h2></div><button aria-label="Fechar mapa" onClick={()=>{setMap(false);setCameraMode('normal')}}><X size={20}/></button></div><p>Siga a linha da sua trajetória: da entrada à transição, da formação aos projetos, do laboratório à próxima conexão.</p><div className="map-spot-list">{SPOTS.map((spot,i)=><button key={spot.name} onClick={()=>{engine.current?.goTo(i);setMap(false);setCameraMode('normal')}}><span className="map-index">0{i+1}</span><span><strong>{spot.name}</strong><small>{spot.zone} · {spot.subtitle}</small></span>{visited.includes(i)&&<span className="visited-marker">VISITADO</span>}<ArrowUpRight size={18}/></button>)}</div></div>}
  {help&&<div className="help-panel"><button className="help-close" aria-label="Fechar instruções" onClick={()=>setHelp(false)}><X size={18}/></button><span className="small-caps">SUA PRIMEIRA SESSÃO</span><h2>Bora pra pista.</h2><p>Use <strong>WASD</strong> ou as <strong>setas</strong> para andar. Clique em um lugar da pista ou escolha um ponto no mapa e o skatista vai até lá.</p><p><strong>Espaço</strong> faz ollie, <strong>F</strong> faz kickflip. Ao chegar perto de uma placa, pressione <strong>E</strong> para conhecer o lugar.</p><p>No celular, use o direcional e os botões de manobra.</p>{compat&&<small>Visualização compatível ativa.</small>}</div>}
 </div>;
}
