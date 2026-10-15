"use client";
import { useEffect, useRef, useState } from 'react';
import type { StudioControls } from './print-scene';

export function PrintStudio({onPauseChange}:{onPauseChange:(paused:boolean)=>void}){
  const canvas=useRef<HTMLCanvasElement>(null);
  const [exploded,setExploded]=useState(false),[paused,setPaused]=useState(false),[material,setMaterial]=useState(0),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const controls=useRef<StudioControls>({exploded,paused,material});
  controls.current={exploded,paused,material};
  useEffect(()=>{
    let disposed=false;let cleanup:(()=>void)|undefined;
    import('./print-scene').then(({mountPrintScene})=>{if(disposed||!canvas.current)return;try{cleanup=mountPrintScene(canvas.current,()=>controls.current,()=>setReady(true));}catch{setFailed(true);}}).catch(()=>setFailed(true));
    return()=>{disposed=true;cleanup?.();};
  },[]);
  return <section className="p-studio" aria-labelledby="studio-heading">
    <div className="p-studio-heading"><h1 id="studio-heading">Objets. Figurines.<br/><span>Et vos idées en volume.</span></h1><p>Impression 3D à la demande. <br/>À vous de choisir la forme, <br className="p-wide-break"/> la taille et la couleur.</p></div>
    <div className={`p-stage ${ready&&!failed?'is-ready':''}`}>
      <div className="p-stage-word" aria-hidden="true">ALYA</div>
      <div className="p-static-forms" aria-hidden="true"><i/><i/><i/></div>
      <canvas ref={canvas} aria-label="Démonstration 3D : support arqué, vase imprimé par couches et pièce dentée. Faites glisser pour tourner." role="img"/>
      <div className="p-stage-caption"><span>Du filament à l’objet.</span><small>Formes de démonstration · photos du catalogue à venir</small></div>
      {!failed&&<button className="p-pause" type="button" onClick={()=>{setPaused(!paused);onPauseChange(!paused);}} aria-pressed={paused} aria-label={paused?"Reprendre les animations":"Mettre les animations en pause"}>{paused?<svg viewBox="0 0 20 20" fill="currentColor"><path d="m6 4 10 6-10 6z"/></svg>:<svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 4h3v12H5zm7 0h3v12h-3z"/></svg>}</button>}
    </div>
    <div className="p-studio-bottom">
      <div className="p-view-controls" role="group" aria-label="Vue de la démonstration"><button type="button" aria-pressed={!exploded} onClick={()=>setExploded(false)}>En volume</button><button type="button" aria-pressed={exploded} onClick={()=>setExploded(true)}>Voir les couches <span aria-hidden="true">≋</span></button></div>
      <div className="p-materials" role="group" aria-label="Couleur des formes de démonstration"><span>Essayez une couleur</span>{['Perle','Ardoise','Brique'].map((name,i)=><button type="button" key={name} aria-label={name} aria-pressed={material===i} onClick={()=>setMaterial(i)} style={{'--swatch':['#cdd2d5','#809eb8','#9c5855'][i]} as React.CSSProperties}/>)}</div>
      <a className="p-browse" href="#catalogue">Choisir mes objets <span aria-hidden="true">↓</span></a>
    </div>
  </section>
}
