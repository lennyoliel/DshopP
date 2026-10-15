import * as T from 'three';

export type StudioControls = { exploded: boolean; paused: boolean; material: number };
export function mountPrintScene(canvas: HTMLCanvasElement, getControls: () => StudioControls, onReady: () => void) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x15181c, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, .1, 70);
  const world = new T.Group(); world.scale.setScalar(1.15); scene.add(world);
  scene.add(new T.HemisphereLight(0xf7f6f0, 0x444b57, 2.5));
  const key = new T.DirectionalLight(0xffffff, 4); key.position.set(-3,6,4);scene.add(key);
  const rim = new T.DirectionalLight(0xb2c9e3, 3);rim.position.set(5,3,-3);scene.add(rim);
  const fill = new T.DirectionalLight(0xffffff, 1.2);fill.position.set(0,1,6);scene.add(fill);
  const material = new T.MeshStandardMaterial({color:0xd2d6d7,metalness:.3,roughness:.33});
  const machine = new T.MeshStandardMaterial({color:0x434b54,metalness:.7,roughness:.28});
  const paleMetal = new T.MeshStandardMaterial({color:0xb1bac3,metalness:.72,roughness:.24});
  const dark = new T.MeshStandardMaterial({color:0x20262d,metalness:.4,roughness:.5});
  const accent = new T.MeshStandardMaterial({color:0xe78570,metalness:.25,roughness:.36});
  function mesh(geometry:T.BufferGeometry,mat:T.Material,parent:T.Object3D,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m;}
  const layers: {group:T.Group; y:number; index:number; count:number; print:boolean}[]=[];
  const objects:T.Group[]=[];
  const positions=[-2.9,0,2.9];
  const bases: T.Mesh[]=[];
  for(let i=0;i<3;i++){
    const pedestal=mesh(new T.CylinderGeometry(1.4,1.4,.11,96),machine,world,positions[i],-.14,0);bases.push(pedestal);
    mesh(new T.CylinderGeometry(1.36,1.36,.015,96),dark,world,positions[i],-.077,0);
    const g=new T.Group();g.position.x=positions[i];world.add(g);objects.push(g);
  }
  // Hollow ribbed vessel, made from individual deposited layers.
  const ringPoints:T.Vector2[]=[];
  for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;const r=1+.035*Math.cos(a*24);ringPoints.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r));}
  const ringShape=new T.Shape(ringPoints);const hole=new T.Path();hole.absarc(0,0,.91,0,Math.PI*2,true);ringShape.holes.push(hole);
  const ringGeometry=new T.ExtrudeGeometry(ringShape,{depth:.033,bevelEnabled:false,curveSegments:64});ringGeometry.rotateX(-Math.PI/2);
  for(let i=0;i<60;i++){
    const u=i/59;const radius=.58+.21*Math.sin(u*Math.PI*1.1)+.11*Math.cos(u*Math.PI*2);
    const group=new T.Group();group.position.y=i*.034;group.rotation.y=u*.65;
    const ring=mesh(ringGeometry,material,group);ring.scale.set(radius,1,radius);
    objects[1].add(group);layers.push({group,y:group.position.y,index:i,count:60,print:true});
  }
  // An arched support: horizontal deposition makes its construction legible.
  const block=new T.BoxGeometry(1,.036,.7);
  for(let i=0;i<48;i++){
    const y=i*.038;const group=new T.Group();group.position.y=y;
    const outer=Math.sqrt(Math.max(0,1.1**2-(y-.77)**2));
    const inner=y<.78?.59:Math.sqrt(Math.max(0,.59**2-(y-.78)**2));
    if(y<.78){for(const side of [-1,1]){const m=mesh(block,material,group,side*.855,0,0);m.scale.x=.51;}}
    else if(inner>.05){for(const side of [-1,1]){const m=mesh(block,material,group,side*(outer+inner)/2,0,0);m.scale.x=Math.max(.04,outer-inner);}}
    else {const m=mesh(block,material,group);m.scale.x=Math.max(.05,outer*2);}
    objects[0].add(group);layers.push({group,y,index:i,count:48,print:false});
  }
  // A toothed mechanical part; the bore is real geometry, not a painted decal.
  const gearShape=new T.Shape();
  for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;const r=(i%4===1||i%4===2)?1.03:.9;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)gearShape.moveTo(x,y);else gearShape.lineTo(x,y);}
  const bore=new T.Path();bore.absarc(0,0,.48,0,Math.PI*2,true);gearShape.holes.push(bore);
  const gearGeometry=new T.ExtrudeGeometry(gearShape,{depth:.035,bevelEnabled:false,curveSegments:40});
  const gearGroup=new T.Group();gearGroup.position.y=1.08;gearGroup.rotation.x=-.13;objects[2].add(gearGroup);
  for(let i=0;i<15;i++){const g=new T.Group();g.position.z=(i-7)*.037;mesh(gearGeometry,material,g);gearGroup.add(g);}
  // Printhead follows the perimeter of the vessel as the layer stack grows.
  const head=new T.Group();objects[1].add(head);
  mesh(new T.BoxGeometry(.3,.25,.3),machine,head,0,.30,0);
  for(let i=0;i<4;i++)mesh(new T.CylinderGeometry(.2,.2,.028,24),paleMetal,head,0,.46+i*.07,0);
  mesh(new T.CylinderGeometry(.045,.006,.13,16),accent,head,0,.085,0);
  const filament=mesh(new T.CylinderGeometry(.009,.009,1.1,8),accent,head,0,1.23,0);
  const gantry=mesh(new T.BoxGeometry(.08,3.9,.08),machine,world,.05,1.72,-1.2);
  mesh(new T.BoxGeometry(2.9,.075,.08),paleMetal,world,.05,3.65,-1.2);
  // Soft contact shadows, drawn once, keep the lightweight scene grounded.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const ctx=shadowCanvas.getContext('2d')!;const shade=ctx.createRadialGradient(64,64,4,64,64,63);shade.addColorStop(0,'rgba(0,0,0,.75)');shade.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,128,128);
  const shadowTexture=new T.CanvasTexture(shadowCanvas);
  const shadowMat=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
  for(const x of positions){const shadow=mesh(new T.PlaneGeometry(3.6,3.6),shadowMat,world,x,-.208,0);shadow.rotation.x=-Math.PI/2;}
  let alive=true,visible=true,raf=0,last=0,time=0,expansion=0,pointerX=0,pointerY=0,drag=false,startX=0,rotation=0;
  let width=1,height=1;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const palette=[0xd2d6d7,0x7f9db7,0x9c5855];let currentMaterial=-1;
  const resize=()=>{const box=canvas.getBoundingClientRect();width=Math.max(box.width,1);height=Math.max(box.height,1);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{rootMargin:'100px'});intersection.observe(canvas);
  const move=(e:PointerEvent)=>{const box=canvas.getBoundingClientRect();pointerX=(e.clientX-box.left)/box.width-.5;pointerY=(e.clientY-box.top)/box.height-.5;if(drag){rotation+=(e.clientX-startX)*.006;startX=e.clientX;}};
  const down=(e:PointerEvent)=>{drag=true;startX=e.clientX;canvas.setPointerCapture(e.pointerId);};
  const up=()=>{drag=false;};
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  let contextLost=false;const lost=(event:Event)=>{event.preventDefault();contextLost=true;canvas.dataset.lost='true';};canvas.addEventListener('webglcontextlost',lost);
  const render=(now:number)=>{
    if(!alive)return;raf=requestAnimationFrame(render);
    if(now-last<1000/30)return;const dt=Math.min((now-last)/1000,.06);last=now;
    if(!visible||document.hidden||contextLost)return;
    const controls=getControls();const motion=!controls.paused&&!reduced.matches;
    if(motion)time+=dt;
    expansion=T.MathUtils.lerp(expansion,controls.exploded?1:0,reduced.matches?1:.085);
    if(currentMaterial!==controls.material){currentMaterial=controls.material;material.color.setHex(palette[currentMaterial]??palette[0]);}
    // A complete object is visible first; later loops demonstrate additive printing.
    const cycle=time%19;const progress=reduced.matches?1:cycle<5?1:cycle<16?.15+(cycle-5)/11*.85:1;
    for(const layer of layers){layer.group.position.y=layer.y+expansion*(layer.index/layer.count)*1.15;layer.group.visible=!layer.print||layer.index/layer.count<progress;}
    const a=time*4.4;const py=progress*2.03;const r=.58+.21*Math.sin(progress*Math.PI*1.1)+.11*Math.cos(progress*Math.PI*2);
    head.position.set(Math.cos(a)*r,py+expansion*1.15,Math.sin(a)*r);head.visible=expansion<.15;filament.scale.y=1;
    objects[0].rotation.y=rotation-.25+(motion||time>0?Math.sin(time*.25)*.3:0);
    objects[1].rotation.y=rotation+time*.12;objects[2].rotation.y=rotation+.18+Math.sin(time*.21)*.35;
    gearGroup.rotation.z=time*.14;gearGroup.children.forEach((child,i)=>{child.position.z=(i-7)*(.037+expansion*.065);});
    gantry.visible=expansion<.8;
    const mobile=width<650;const targetX=reduced.matches?0:pointerX*.5;
    camera.position.lerp(new T.Vector3(targetX,mobile?6:5.4,mobile?18.5:14.2),.045);
    // Fit the entire three-object tableau on every aspect ratio.
    const fit=mobile?Math.max(1,1.25/camera.aspect):Math.max(1,1.9/camera.aspect);
    camera.position.z=(mobile?14.5:12.4)*fit;
    camera.lookAt(0,1.05+(reduced.matches?0:pointerY*.15),0);
    world.rotation.y=T.MathUtils.lerp(world.rotation.y,reduced.matches?0:pointerX*.09,.04);
    renderer.render(scene,camera);onReadyOnce();
  };
  let ready=false;function onReadyOnce(){if(!ready){ready=true;onReady();}}
  camera.position.set(0,5.4,15);raf=requestAnimationFrame(render);
  return ()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect();canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('webglcontextlost',lost);const geometries=new Set<T.BufferGeometry>();const materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());shadowTexture.dispose();renderer.dispose();};
}
