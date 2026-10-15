"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function IntroPrint({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);

  function finish() {
    if (leaving.current) return;
    leaving.current = true;
    if (!root.current || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    gsap.to(root.current, { yPercent: -100, duration: .9, ease: "power4.inOut", onComplete: onDone });
  }

  useEffect(() => {
    if (!root.current) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const skip = root.current.querySelector<HTMLButtonElement>(".v-intro-skip");
    skip?.focus({ preventScroll: true });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(finish, 450);
      return () => { clearTimeout(timer); document.body.style.overflow = previousOverflow; };
    }
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: finish });
      timeline
        // One shared boundary drives both the deposited logo and the nozzle tip.
        .fromTo(".v-intro-print", { "--print-height": "100%" }, { "--print-height": "0%", duration: 2.35, ease: "none" })
        .to(".v-intro-nozzle", { opacity: 0, y: "-=20", duration: .3 }, 2.35)
        .to(".v-intro-copy span", { y: 0, opacity: 1, duration: .45, stagger: .09, ease: "power3.out" }, 1.8)
        .to({}, { duration: .42 });
    }, root);
    return () => { ctx.revert(); document.body.style.overflow = previousOverflow; };
  }, []);

  return <div ref={root} className="v-intro" role="dialog" aria-modal="true" aria-label="Introduction ALYA" onKeyDown={event => { if (event.key === "Escape") finish(); if (event.key === "Tab") { event.preventDefault(); root.current?.querySelector<HTMLButtonElement>(".v-intro-skip")?.focus(); } }}>
    <button type="button" className="v-intro-skip" onClick={finish}>Passer</button>
    <div className="v-intro-print" aria-hidden="true">
      <img className="v-intro-outline" src="/assets/alya-mark.png" alt=""/>
      <img className="v-intro-fill" src="/assets/alya-mark.png" alt=""/>
      <div className="v-intro-nozzle"><i/><b/></div>
    </div>
    <p className="v-intro-copy"><span>Bienvenue chez ALYA.</span><span>On fabrique vos idées.</span></p>
  </div>;
}
