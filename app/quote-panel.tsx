"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { products } from "./catalogue";
import type { CurrentUser } from "./catalogue";
import { Arrow, Close } from "./shop-icons";

type Props = {
  open: boolean; currentUser: CurrentUser; cart: Record<string, number>;
  onClose: () => void; onUpdate: (id: string, quantity: number) => void;
  onClear: () => void;
};

export function QuotePanel({ open, currentUser, cart, onClose, onUpdate, onClear }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const items = useMemo(() => products.filter(p => cart[p.id]).map(p => ({ ...p, quantity: cart[p.id] })), [cart]);

  useEffect(() => {
    if (!open) {
      dialog.current?.close();
      if (state === "success") { setState("idle"); setDetails(""); setPhone(""); }
      return;
    }
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open, state]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading"); setError("");
    try {
      const payload = new URLSearchParams({
        "form-name": "demande-devis",
        name,
        email,
        phone,
        details,
        website,
        items: items.map(p => `${p.quantity} × ${p.title}`).join(" | "),
      });
      const response = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: payload.toString() });
      if (!response.ok) throw new Error("La demande n’a pas pu être envoyée.");
      setState("success"); onClear();
    } catch (failure) {
      setState("error");
      setError(failure instanceof Error ? failure.message : "Envoi impossible. Réessayez.");
    }
  }

  return (
    <dialog ref={dialog} className="f-dialog" onCancel={onClose} onClick={event => {
      if (event.target === dialog.current) {
        const box = dialog.current.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }
    }}>
      <div className="f-dialog-top"><strong>Votre sélection</strong><button type="button" className="f-icon-button" onClick={onClose} aria-label="Fermer la sélection"><Close /></button></div>
      {state === "success" ? (
        <div className="f-dialog-success"><span>✓</span><h2>Demande envoyée.</h2><p>Nous vous répondrons par e-mail avec le prix et les prochaines étapes.</p><button className="f-button f-button-dark" type="button" onClick={onClose}>Fermer <Arrow /></button></div>
      ) : (
        <>
          <h2 className="f-dialog-title">Votre demande de devis.</h2>
          <p className="f-dialog-intro">Choisissez vos créations, ajoutez quelques détails. Le prix est confirmé avant tout paiement.</p>
          <div className="f-selection">
            {items.length ? items.map(p => (
              <div key={p.id} className="f-selection-row"><div><small>{p.label}</small><strong>{p.title}</strong></div><div className="f-quantity"><button type="button" onClick={() => onUpdate(p.id, p.quantity - 1)} aria-label={`Retirer un ${p.title}`}>−</button><span>{p.quantity}</span><button type="button" onClick={() => onUpdate(p.id, p.quantity + 1)} aria-label={`Ajouter un ${p.title}`}>+</button></div></div>
            )) : <div className="f-selection-empty"><p>Votre sélection est encore vide.</p><button type="button" onClick={() => onUpdate("custom", 1)}>Ajouter un projet sur mesure</button></div>}
          </div>
          <form onSubmit={submit} className="f-form" name="demande-devis" data-netlify="true" data-netlify-honeypot="website">
              <input type="hidden" name="form-name" value="demande-devis" />
              <label>Nom<input required autoComplete="name" maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Votre nom" /></label>
              <label>E-mail<input required type="email" autoComplete="email" maxLength={160} value={email} onChange={event => setEmail(event.target.value)} placeholder="vous@exemple.fr" /></label>
              <label>Parlez-nous de votre idée<textarea required maxLength={3000} rows={5} placeholder="Dimensions, couleurs, prénom, finition… Ce qui compte pour vous." value={details} onChange={event => setDetails(event.target.value)} /></label>
              <label>Téléphone <span>facultatif</span><input type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={event => setPhone(event.target.value)} placeholder="06 00 00 00 00" /></label>
              <label className="f-honeypot" aria-hidden="true">Site web<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
              {error && <p role="alert" className="f-error">{error}</p>}
              <button className="f-button f-button-dark f-button-full" type="submit" disabled={!items.length || state === "loading"}>{state === "loading" ? "Envoi en cours…" : "Envoyer ma demande"}<Arrow /></button>
            </form>
          <small className="f-payment-note">Pas de paiement avant validation du devis.</small>
        </>
      )}
    </dialog>
  );
}
