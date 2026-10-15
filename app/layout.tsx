import type { Metadata } from "next";
import "./globals.css";
import "./atelier.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dshopp-alya.netlify.app"),
  title: "ALYA — Impression 3D sur mesure",
  description:
    "Composez votre demande de devis pour un objet, une figurine ou un accessoire imprimé en 3D sur mesure par ALYA.",
  openGraph: {
    title: "ALYA — Impression 3D sur mesure",
    description:
      "Objets personnalisés, devis en ligne et impression 3D à la demande.",
    url: "/",
    siteName: "ALYA",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ALYA — Impression 3D sur mesure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALYA — Impression 3D sur mesure",
    description:
      "Objets personnalisés, devis en ligne et impression 3D à la demande.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/assets/alya-mark.png",
    shortcut: "/assets/alya-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
