import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { productVisuals } from "./product-visuals";

const visualOrder = ['nfc','lamp','custom','usb','stand','deadpool','stitch','rocket','mario','luigi'];

export type ShowroomControls = {
  active: number; color: string; figurine: boolean; luminous: boolean;
  spinToken: number; paused: boolean;
  items?: number[];
};

export function mountShowroomScene(canvas: HTMLCanvasElement, getControls: () => ShowroomControls, onReady: () => void) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "default" });
  renderer.setClearColor(0x071126, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, .1, 80);
  camera.position.set(0, 2.25, 12.6);
  scene.add(new T.HemisphereLight(0xdce8ff, 0x11142d, 1.9));
  const key = new T.DirectionalLight(0xffffff, 3.6); key.position.set(-4, 6, 5); scene.add(key);
  const violet = new T.PointLight(0x835eff, 8, 9, 2); violet.position.set(4, 2, 4); scene.add(violet);
  const cyan = new T.PointLight(0x71c7ff, 5, 8, 2); cyan.position.set(-4, 1, 3); scene.add(cyan);
  // One reusable lamp source, not ten lights compiled into every object's shader.
  const lampLight = new T.PointLight(0xffc37d, 0, 5, 2); scene.add(lampLight);

  const carousel = new T.Group(); scene.add(carousel);
  const objects: { holder: T.Group; body: T.Mesh; material: T.MeshStandardMaterial; glow: T.Mesh; pivot: T.Group; model?: T.Group; loading: boolean; tint: {value:T.Color}; mix: {value:number}; light: {value:number} }[] = [];
  const count = 10, radius = 5.15;
  const bodyGeometry = new T.CylinderGeometry(1.02, 1.02, 2.65, 48, 1);
  const glowGeometry = new T.CylinderGeometry(.73, .73, 2.2, 32);
  const ringGeometry = new T.TorusGeometry(1.025, .012, 4, 48);
  const pedestalGeometry = new T.CylinderGeometry(1.23, 1.3, .14, 40);
  const pedestalMaterial = new T.MeshStandardMaterial({ color: 0x111d3b, roughness: .4, metalness: .3 });
  const ringMaterial = new T.MeshBasicMaterial({ color: 0xd8e1ff, transparent: true, opacity: .08, depthWrite: false });
  const glowMaterial = new T.MeshBasicMaterial({ color: 0xffd7a8 });
  const matrix = new T.Matrix4(), position = new T.Vector3(), quaternion = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0));
  const unitScale = new T.Vector3(1, 1, 1);
  for (let index = 0; index < count; index++) {
    const angle = index / count * Math.PI * 2;
    const holder = new T.Group(); holder.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius); holder.rotation.y = angle;
    const material = new T.MeshStandardMaterial({ color: 0x8292d8, roughness: .26, metalness: .08 });
    const body = new T.Mesh(bodyGeometry, material); body.position.y = 1.45; holder.add(body);
    // Thirteen layer bands cost a single draw instead of thirteen separate draws.
    const bands = new T.InstancedMesh(ringGeometry, ringMaterial, 13);
    for (let band = 0; band < 13; band++) {
      position.set(0, -1.17 + band * .18, 0); matrix.compose(position, quaternion, unitScale); bands.setMatrixAt(band, matrix);
    }
    body.add(bands);
    const glow = new T.Mesh(glowGeometry, glowMaterial); glow.position.y = 1.45; glow.visible = false; holder.add(glow);
    const pedestal = new T.Mesh(pedestalGeometry, pedestalMaterial); pedestal.position.y = .07; holder.add(pedestal);
    const pivot = new T.Group(); pivot.position.y = .14; holder.add(pivot);
    carousel.add(holder); objects.push({ holder, body, material, glow, pivot, loading:false, tint:{value:new T.Color(0xffffff)}, mix:{value:0}, light:{value:1} });
  }
  const floor = new T.Mesh(new T.CircleGeometry(8.5, 48), new T.MeshStandardMaterial({ color: 0x071027, roughness: .72, metalness: .08 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.01; scene.add(floor);

  let alive = true, visible = true, raf = 0, last = 0, time = 0, targetRotation = 0, active = -1, spin = 0, spinTarget = 0;
  let spinToken = getControls().spinToken, width = 1, dragging = false, dragStart = 0, dragRotation = 0, contextLost = false, ready = false, inspection = 0;
  let previousStyle = "", previousState = "", dirty = true;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const loader = new GLTFLoader();
  const disposeModel = (root:T.Object3D) => root.traverse(node => {
    if(node instanceof T.Mesh){node.geometry.dispose();for(const material of (Array.isArray(node.material)?node.material:[node.material])){for(const value of Object.values(material))if(value instanceof T.Texture)value.dispose();material.dispose();}}
  });
  const surfaceMasks:Record<string,string> = {
    usb:'float a=edge(productUV,vec2(.31,.13),vec2(.86,.58));float b=edge(productUV,vec2(.86,.58),vec2(.65,.80));float c=edge(productUV,vec2(.65,.80),vec2(.12,.35));float d=edge(productUV,vec2(.12,.35),vec2(.31,.13));mask=step(0.0,a*b)*step(0.0,a*c)*step(0.0,a*d);',
    lamp:'mask=1.0-smoothstep(.78,.84,productUV.y);',
    tag:'mask=smoothstep(.37,.44,productUV.y)*(1.0-smoothstep(.98,1.0,productUV.y));',
    stand:'mask=1.0-smoothstep(.82,1.0,length((productUV-vec2(.50,.32))/vec2(.38,.27)));',
    custom:'mask=1.0-smoothstep(.78,1.0,length((productUV-vec2(.69,.73))/vec2(.27,.26)));',
    none:'mask=0.0;',
  };
  function ensureModel(index:number){
    const object=objects[index], visual=productVisuals[visualOrder[index]];
    if(!visual||object.model||object.loading)return;
    object.loading=true;
    loader.load(visual.modelUrl,gltf=>{
      if(!alive){disposeModel(gltf.scene);return;}
      object.model=gltf.scene;object.pivot.add(gltf.scene);object.body.visible=false;object.glow.visible=false;
      gltf.scene.traverse(node=>{if(node instanceof T.Mesh){
        for(const material of (Array.isArray(node.material)?node.material:[node.material])){
          material.toneMapped=false; material.alphaToCoverage=true; if(material.map)material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
          material.onBeforeCompile=(shader:T.WebGLProgramParametersWithUniforms)=>{
            shader.uniforms.productTint=object.tint;shader.uniforms.productMix=object.mix;shader.uniforms.lampPower=object.light;
            shader.vertexShader='varying vec2 productUV;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nproductUV=uv;');
            shader.fragmentShader='varying vec2 productUV;uniform vec3 productTint;uniform float productMix;uniform float lampPower;float edge(vec2 p,vec2 a,vec2 b){return (p.x-a.x)*(b.y-a.y)-(p.y-a.y)*(b.x-a.x);}\n'+shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nfloat mask=0.0;'+surfaceMasks[visual.surface]+'\nfloat shade=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(diffuseColor.rgb,productTint*(.28+.72*shade),mask*productMix);'+(visual.surface==='lamp'?'diffuseColor.rgb*=mix(1.0,lampPower,mask);':''));
          };
          material.customProgramCacheKey=()=>`alya-relief-${visual.surface}`;
        }
      }});
      dirty=true;
    },undefined,()=>{object.loading=false;object.pivot.userData.loadFailed=true;});
  }
  const lampPosition = new T.Vector3(0, 1.45, 0);
  const resize = () => {
    const box = canvas.getBoundingClientRect(); width = Math.max(1, box.width); const height = Math.max(1, box.height);
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 650 ? 1.75 : 2));
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.position.z = width < 650 ? 14.4 : 12.6; camera.lookAt(0, 1.25, 2.3); camera.updateProjectionMatrix(); dirty = true;
  };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas); resize();
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; }, { rootMargin: "100px" }); intersection.observe(canvas);
  const down = (event: PointerEvent) => { dragging = true; dragStart = event.clientX; dragRotation = carousel.rotation.y; canvas.setPointerCapture(event.pointerId); dirty = true; };
  const move = (event: PointerEvent) => { if (dragging) { const amount=(event.clientX-dragStart)*.0016;inspection=Math.max(-.2,Math.min(.2,amount));carousel.rotation.y=dragRotation+Math.max(-.11,Math.min(.11,amount));dirty = true; } };
  const up = () => { dragging = false; dirty = true; };
  const lost = (event: Event) => { event.preventDefault(); contextLost = true; canvas.dataset.lost = "true"; };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up); canvas.addEventListener("webglcontextlost", lost);

  const frame = (now: number) => {
    if (!alive) return; raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
    if (!visible || document.hidden || contextLost) return;
    const controls = getControls(); const moving = !controls.paused && !reduced.matches;
    const allowed = controls.items?.length ? controls.items : objects.map((_, index) => index);
    const slots = allowed.length;
    const state = `${controls.active}|${controls.color}|${controls.figurine}|${controls.luminous}|${controls.spinToken}|${controls.paused}|${reduced.matches}|${allowed.join(',')}`;
    const changed = state !== previousState; previousState = state;
    if (active !== controls.active || changed) {
      active = Math.max(0, Math.min(count - 1, controls.active));
      // Follow the shortest orbital path, including the last-to-first wrap.
      const angle = -Math.max(0,allowed.indexOf(active)) / slots * Math.PI * 2;
      targetRotation = carousel.rotation.y + Math.atan2(Math.sin(angle - carousel.rotation.y), Math.cos(angle - carousel.rotation.y));
    }
    if (spinToken !== controls.spinToken) { spinToken = controls.spinToken; spinTarget += Math.PI * 2; }
    const blend = reduced.matches ? 1 : 1 - Math.exp(-9 * dt);
    const settling = Math.abs(carousel.rotation.y - targetRotation) > .0001 || Math.abs(spin - spinTarget) > .0001 || objects.some((object, index) => Math.abs(object.holder.scale.x - (index === active ? 1 : .62)) > .0001);
    if (!moving && !changed && !dirty && !settling) return;
    dirty = false;
    if (moving) time += dt;
    if (!dragging) carousel.rotation.y = T.MathUtils.lerp(carousel.rotation.y, targetRotation, blend);
    spin = T.MathUtils.lerp(spin, spinTarget, blend);
    const style = `${active}|${controls.color}|${controls.figurine}|${controls.luminous}`;
    if (style !== previousStyle) {
      previousStyle = style;
      objects.forEach((object, index) => {
        const chosen = index === active;
        object.material.color.set(chosen ? (controls.figurine ? "#d7d9ee" : controls.color) : "#27345f");
        object.material.roughness = chosen ? .26 : .5;
        const transparent = chosen && controls.luminous;
        if (object.material.transparent !== transparent) { object.material.transparent = transparent; object.material.needsUpdate = true; }
        object.material.opacity = chosen && controls.luminous ? .72 : 1;
        object.glow.visible = !object.model && chosen && controls.luminous;
        object.tint.value.set(controls.color);object.mix.value=chosen&&controls.color!=='#ffffff'?.7:0;
      });
    }
    objects.forEach((object, index) => {
      const chosen = index === active;
      const slot = allowed.indexOf(index);
      if(slot < 0){object.holder.visible=false;return;}
      const localAngle = slot / slots * Math.PI * 2;
      object.holder.position.set(Math.sin(localAngle)*radius,0,Math.cos(localAngle)*radius);
      object.holder.rotation.y=localAngle;
      const worldAngle = localAngle + carousel.rotation.y;
      // Draw only the front half during travel; just active and neighbours at rest.
      object.holder.visible = Math.cos(worldAngle) > (slots < 8 ? .2 : .45);
      if(object.holder.visible&&!object.pivot.userData.loadFailed)ensureModel(index);
      const scale = chosen ? 1 : .62;
      object.holder.scale.setScalar(T.MathUtils.lerp(object.holder.scale.x, scale, blend));
      object.body.rotation.y = chosen ? spin + time * .13 : 0;
      object.body.rotation.z = chosen ? -.08 : 0;
      // Photo reliefs never expose an invented back or perform a 360-degree spin.
      if(object.model){
        const angle=Math.atan2(Math.sin(worldAngle),Math.cos(worldAngle));
        const sway=chosen?(Math.sin(spin)*.32+(moving?Math.sin(time*.42)*.13:0)+inspection):0;
        object.pivot.rotation.y=-angle+Math.max(-.3491,Math.min(.3491,sway));
        object.light.value=controls.luminous?1.02+(moving?Math.sin(time*1.2)*.018:0):1;
      }
    });
    if(!dragging)inspection*=1-blend;
    lampLight.intensity = controls.luminous ? 24 : 0;
    if (controls.luminous) { carousel.updateMatrixWorld(true); lampLight.position.copy(lampPosition); objects[active].holder.localToWorld(lampLight.position); }
    violet.position.x = 3.6 + Math.sin(time * .42) * .45;
    renderer.render(scene, camera);
    if (!ready) { ready = true; onReady(); }
  };
  raf = requestAnimationFrame(frame);
  return () => {
    alive = false; cancelAnimationFrame(raf); resizeObserver.disconnect(); intersection.disconnect();
    canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up); canvas.removeEventListener("webglcontextlost", lost);
    const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    scene.traverse(node => { if (node instanceof T.Mesh) { geometries.add(node.geometry); (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material)); if (node instanceof T.InstancedMesh) node.dispose(); } });
    const textures=new Set<T.Texture>();materials.forEach(material=>Object.values(material).forEach(value=>{if(value instanceof T.Texture)textures.add(value);}));textures.forEach(texture=>texture.dispose());
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); renderer.dispose();
  };
}
