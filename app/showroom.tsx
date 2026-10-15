"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { products } from "./catalogue";
import type { Product, Category } from "./catalogue";
import type { ShowroomControls } from "./showroom-scene";
import { Arrow, Plus } from "./shop-icons";
import { productVisuals } from "./product-visuals";

const colours = [
  { name: "Matière de référence", value: "#ffffff" },
  { name: "Bleu nuit", value: "#334ca1" },
  { name: "Ivoire", value: "#d8d4c8" },
];

type Props = {
  items: Product[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (id: string) => void;
  quantity: number;
  paused: boolean;
  category: "all" | Category;
  onCategory: (category: "all" | Category) => void;
};

export function Showroom({ items, activeId, onSelect, onAdd, quantity, paused, category, onCategory }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const details = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [colour, setColour] = useState(colours[0].value);
  const [spinToken, setSpinToken] = useState(0);
  const active = products.find(product => product.id === activeId) ?? items[0] ?? products[0];
  const activeSceneIndex = Math.max(0, products.findIndex(product => product.id === active.id));
  const isFigurine = active.category === "figurines";
  const visual = productVisuals[active.id];
  const controls = useRef<ShowroomControls>({ active: activeSceneIndex, color: colour, figurine: isFigurine, luminous: active.id === "lamp", spinToken, paused });
  controls.current = { active: activeSceneIndex, color: colour, figurine: isFigurine, luminous: active.id === "lamp", spinToken, paused, items: items.map(item=>products.findIndex(product=>product.id===item.id)) };
  const activePosition = Math.max(0, items.findIndex(product => product.id === active.id));

  useEffect(() => {
    let disposed = false, cleanup: (() => void) | undefined;
    import("./showroom-scene").then(({ mountShowroomScene }) => {
      if (disposed || !canvas.current) return;
      try { cleanup = mountShowroomScene(canvas.current, () => controls.current, () => setReady(true)); }
      catch { setFailed(true); }
    }).catch(() => setFailed(true));
    return () => { disposed = true; cleanup?.(); };
  }, []);

  useLayoutEffect(() => {
    if (!details.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".v-product-copy > *", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .07, ease: "power3.out" });
      gsap.fromTo(".v-light-sweep", { xPercent: -140, opacity: 0 }, { xPercent: 180, opacity: .8, duration: .9, ease: "power2.inOut", onComplete() { gsap.set(this.targets(), { opacity: 0 }); } });
    }, details);
    return () => ctx.revert();
  }, [active.id]);

  const move = (direction: -1 | 1) => {
    if (!items.length) return;
    const next = (activePosition + direction + items.length) % items.length;
    onSelect(items[next].id);
  };

  const aria = useMemo(() => visual ? `Aperçu en relief de ${active.title}, inspection limitée à vingt degrés.` : `Aperçu de ${active.title} en préparation.`, [active.title,visual]);

  return <section className="v-showroom" aria-labelledby="showroom-title">
    <div className="v-showroom-stage">
      <div className="v-view-category"><label htmlFor="viewer-category">Explorer</label><select id="viewer-category" value={category} onChange={event => onCategory(event.target.value as "all" | Category)}><option value="all">Toutes les créations</option><option value="objets">Objets & accessoires</option><option value="figurines">Figurines</option></select></div>
      <div className="v-model-status"><span>{visual?"Aperçu en relief":"Aperçu en préparation"}</span><b>{String(activePosition + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</b></div>
      <div className={`v-canvas-shell ${ready && !failed ? "is-ready" : ""}`}>
        <div className="v-render-fallback">{failed?"L’aperçu 3D est indisponible sur cet appareil.":"Chargement de l’aperçu…"}</div>
        <canvas ref={canvas} role="img" aria-label={aria}
          onPointerDown={event => { drag.current = event.clientX; }}
          onPointerUp={event => {
            const distance = drag.current === null ? 0 : event.clientX - drag.current;
            drag.current = null;
            if (Math.abs(distance) > 65) move(distance > 0 ? -1 : 1);
            else setSpinToken(value => value + 1);
          }}/>
        <div className="v-light-sweep" aria-hidden="true"/>
      </div>
      <button type="button" className="v-carousel-arrow is-left" onClick={() => move(-1)} aria-label="Article précédent"><Arrow/></button>
      <button type="button" className="v-carousel-arrow is-right" onClick={() => move(1)} aria-label="Article suivant"><Arrow/></button>
      <p className="v-drag-hint">Glissez pour parcourir · cliquez pour inspecter</p>
    </div>

    <div className="v-product-copy" ref={details}>
      <span className="v-product-label">{active.label}</span>
      <h2 id="showroom-title">{active.title}</h2>
      <p>{active.description}</p>
      <ul>{active.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
      {isFigurine ? <p className="v-figurine-note">Les couleurs du modèle de référence sont conservées.</p> : <fieldset className="v-colours"><legend>{active.id==='usb'?"Plaque d’aperçu":"Finition d’aperçu"}</legend><div>{colours.map(option => <button key={option.value} type="button" aria-label={option.name} aria-pressed={colour === option.value} onClick={() => setColour(option.value)} style={{ "--swatch": option.value } as React.CSSProperties}/>)}</div></fieldset>}
      {active.id === "lamp" && <div className="v-light-note"><i aria-hidden="true"/><span>Éclairage interne simulé dans la visionneuse.</span></div>}
      {visual?.example&&<p className="v-example-note">Cet objet illustre une possibilité. Forme, dimensions, inscription et finition peuvent être personnalisées après étude du projet.</p>}
      <button type="button" className="v-add" onClick={() => onAdd(active.id)}><span>{quantity ? `Dans la sélection · ${quantity}` : "Ajouter à ma sélection"}</span><Plus/></button>
      <small>Prix communiqué après étude du projet.</small>
    </div>

    <div className="v-product-rail" aria-label="Articles de la catégorie">
      {items.map(product => <article key={product.id} className={product.id === active.id ? "is-active" : ""}>
        <button type="button" onClick={() => onSelect(product.id)} aria-current={product.id === active.id ? "true" : undefined}>
          <span><small>{product.label}</small>{product.title}</span>
        </button>
      </article>)}
    </div>
  </section>;
}
