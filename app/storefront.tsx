"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { products } from "./catalogue";
import type { Category, CurrentUser } from "./catalogue";
import { Arrow, Bag, UserIcon } from "./shop-icons";
import { QuotePanel } from "./quote-panel";
import { IntroPrint } from "./intro-print";
import { Showroom } from "./showroom";

export function Storefront({ currentUser }: { currentUser: CurrentUser }) {
  const [intro, setIntro] = useState(true);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(products[0].id);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartReady, setCartReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const accountHref = "?devis=1";
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const visibleProducts = useMemo(() => products.filter(product => {
    const categoryMatch = filter === "all" || product.category === filter;
    const query = search.trim().toLocaleLowerCase("fr");
    return categoryMatch && (!query || `${product.title} ${product.label} ${product.description}`.toLocaleLowerCase("fr").includes(query));
  }), [filter, search]);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("alya-quote-draft") || "{}");
      const safe: Record<string, number> = {};
      products.forEach(product => { const quantity = Math.floor(Number(saved?.[product.id])); if (quantity > 0) safe[product.id] = Math.min(20, quantity); });
      setCart(safe);
    } catch { /* Browsing stays available when storage is blocked. */ }
    setCartReady(true);
    if (new URLSearchParams(location.search).has("devis")) setPanelOpen(true);
  }, []);
  useEffect(() => { if (cartReady) try { localStorage.setItem("alya-quote-draft", JSON.stringify(cart)); } catch {} }, [cart, cartReady]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 2400); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (visibleProducts.length && !visibleProducts.some(product => product.id === activeId)) setActiveId(visibleProducts[0].id); }, [visibleProducts, activeId]);

  function updateCart(id: string, quantity: number) {
    setCart(previous => { const next = { ...previous }; if (quantity <= 0) delete next[id]; else next[id] = Math.min(20, quantity); return next; });
  }
  function addProduct(id: string) {
    if ((cart[id] || 0) >= 20) return;
    updateCart(id, (cart[id] || 0) + 1);
    setNotice(`${products.find(product => product.id === id)?.title} ajouté à votre sélection`);
  }
  function chooseCategory(next: "all" | Category, id?: string) {
    setFilter(next); setSearch("");
    const first = id ? products.find(product => product.id === id) : products.find(product => next === "all" || product.category === next);
    if (first) setActiveId(first.id);
    requestAnimationFrame(() => document.querySelector("#catalogue")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  }

  return <div className="v-site" id="top" data-motion={paused ? "paused" : "playing"}>
    {intro && <IntroPrint onDone={() => setIntro(false)}/>}
    <a className="v-skip" href="#catalogue">Aller au catalogue</a>
    <header className="v-header">
      <a className="v-brand" href="#top" aria-label="ALYA — Accueil"><span className="v-brand-slot"><img src="/assets/alya-mark.png" alt=""/></span><b>ALYA</b></a>
      <nav aria-label="Navigation principale"><a href="#categories">Catégories</a><a href="#catalogue">Catalogue</a><a href="#sur-mesure">Sur mesure</a></nav>
      <div className="v-header-actions">
        <button type="button" className="v-motion" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? "Reprendre les animations" : "Mettre les animations en pause"}>{paused ? "▶" : "Ⅱ"}</button>
        <a href={accountHref} onClick={(event) => { event.preventDefault(); setPanelOpen(true); }} aria-label="Ouvrir ma demande"><UserIcon/><span>Devis</span></a>
        <button type="button" onClick={() => setPanelOpen(true)} aria-label={`Ma sélection, ${count} article${count > 1 ? "s" : ""}`}><Bag/><span>Sélection</span><b>{count}</b></button>
      </div>
    </header>

    <main>
      <section className="v-category-gate" id="categories">
        <div className="v-gate-copy"><h1>Qu’est-ce qu’on fabrique<br/>pour vous&nbsp;?</h1><p>Deux univers à explorer. Une idée à vous ?<br/>On peut aussi partir de zéro.</p></div>
        <div className="v-category-list">
          <button type="button" onClick={() => chooseCategory("objets")}><i className="v-category-orbit" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none"><path d="M30 26h40l8 55H22zM25 62h50M28 44h44" stroke="currentColor" strokeWidth="2"/><ellipse cx="50" cy="26" rx="20" ry="6" stroke="currentColor" strokeWidth="2"/></svg></i><span>Objets & accessoires</span><small>Pour le quotidien, pour votre intérieur.</small><b className="v-category-enter">Explorer <Arrow/></b></button>
          <button type="button" onClick={() => chooseCategory("figurines")}><i className="v-category-orbit" aria-hidden="true"><svg viewBox="0 0 100 100" fill="none"><path d="M50 12c-11 13-16 28-16 51h32c0-23-5-38-16-51ZM34 50 21 81l13-5m32-26 13 31-13-5M42 85h16" stroke="currentColor" strokeWidth="2"/><circle cx="50" cy="43" r="6" stroke="currentColor" strokeWidth="2"/></svg></i><span>Figurines</span><small>Vos personnages, vos collections.</small><b className="v-category-enter">Explorer <Arrow/></b></button>
        </div>
        <div className="v-category-links"><button type="button" onClick={() => chooseCategory("objets", "custom")}>J’ai un projet sur mesure <Arrow/></button><button type="button" onClick={() => chooseCategory("all")}>Voir toutes les créations</button></div>
      </section>

      <section className="v-catalogue" id="catalogue" aria-label="Catalogue ALYA">
        <div className="v-catalogue-bar">
          <div className="v-filter" role="group" aria-label="Filtrer les articles">
            {([["all", "Tout"], ["objets", "Objets"], ["figurines", "Figurines"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setSearch(""); }}>{label}</button>)}
          </div>
          <p>Aperçus à titre d’exemple · fabrication sur devis</p>
          <label className="v-search"><span className="v-visually-hidden">Rechercher un article</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher"/><span aria-hidden="true">⌕</span></label>
        </div>
        {visibleProducts.length ? <Showroom items={visibleProducts} activeId={activeId} onSelect={setActiveId} onAdd={addProduct} quantity={cart[activeId] || 0} paused={paused} category={filter} onCategory={next => { setFilter(next); setSearch(""); const first=products.find(product=>next==="all"||product.category===next); if(first)setActiveId(first.id); }}/> : <div className="v-empty"><h2>Aucun objet trouvé.</h2><button type="button" onClick={() => { setSearch(""); setFilter("all"); }}>Revenir au catalogue</button></div>}
      </section>

      <section className="v-custom" id="sur-mesure">
        <div className="v-custom-word" aria-hidden="true"><span>FORME</span><span>FORME</span><span>FORME</span><span>FORME</span></div>
        <div><h2>Vous avez déjà<br/>l’objet en tête&nbsp;?</h2><p>Décrivez sa fonction, ses dimensions ou simplement l’idée de départ. Aucun fichier 3D n’est nécessaire pour commencer.</p><button type="button" onClick={() => { if (!cart.custom) addProduct("custom"); setPanelOpen(true); }}>Décrire mon projet <Arrow/></button></div>
      </section>

      <section className="v-faq" id="informations"><h2>Avant de lancer l’impression</h2><div>{[
        ["Les couleurs affichées sont-elles définitives ?", "Les objets personnalisables montrent des exemples de finition. Les couleurs et matières réelles seront confirmées avec votre devis ; les figurines gardent les couleurs de leur référence."],
        ["Comment connaître le prix ?", "Ajoutez les objets qui vous intéressent puis précisez les dimensions, couleurs et quantités. Le prix est communiqué avant tout paiement."],
        ["Peut-on demander une forme qui n’est pas au catalogue ?", "Oui. Décrivez votre projet sur mesure, même sans modèle 3D ni dessin technique."],
      ].map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
    </main>

    <footer className="v-footer"><div><span className="v-brand-slot"><img src="/assets/alya-mark.png" alt=""/></span><strong>ALYA</strong><small>Impression 3D à la demande.</small></div><nav aria-label="Pied de page"><a href={accountHref} onClick={(event) => { event.preventDefault(); setPanelOpen(true); }}>Demander un devis</a><a href="https://www.instagram.com/alyacreation3d/" target="_blank" rel="noreferrer">Instagram</a></nav><span>© {new Date().getFullYear()}</span></footer>
    <button type="button" className="v-mobile-cart" onClick={() => setPanelOpen(true)}><span>{count ? `${count} article${count > 1 ? "s" : ""}` : "Ma sélection"}</span><Bag/><b>{count}</b></button>
    <div className={`v-toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite"><span>{notice}</span><button type="button" onClick={() => setPanelOpen(true)} tabIndex={notice ? 0 : -1}>Voir</button></div>
    <QuotePanel open={panelOpen} currentUser={currentUser} cart={cart} onClose={closePanel} onUpdate={updateCart} onClear={() => setCart({})}/>
  </div>;
}
