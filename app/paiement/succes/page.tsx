export default function PaymentSuccessPage() {
  return (
    <main className="payment-result-page">
      <div className="payment-result-card">
        <img src="/assets/alya-logo.png" alt="Logo ALYA" />
        <p className="micro-label">Paiement confirmé</p>
        <h1>Merci pour votre commande.</h1>
        <p>
          Votre paiement a bien été transmis à ALYA. Vous recevrez la suite des
          informations par e-mail et pourrez retrouver votre projet dans votre espace.
        </p>
        <a className="action action-dark" href="/compte">Retourner à mon espace</a>
      </div>
    </main>
  );
}
