export type Category = "objets" | "figurines";
export type Product = {
  id: string; title: string; label: string; description: string;
  category: Category; details: string[];
};

export const products: Product[] = [
  { id: "nfc", title: "Porte-clé NFC", label: "Connecté", description: "Une pièce unique avec puce programmée : carte de visite, lien ou réseaux sociaux.", category: "objets", details: ["Forme et couleur au choix", "Puce NFC programmée", "Lien, vCard ou réseaux"] },
  { id: "lamp", title: "Lampe design", label: "Lumineux", description: "Une lampe sculpturale imprimée à la demande, avec teinte et motif personnalisables.", category: "objets", details: ["Teinte au choix", "Motif ou gravure", "Selon les couleurs disponibles"] },
  { id: "custom", title: "Création sur mesure", label: "100 % personnel", description: "Classique, NFC, lumineux ou aimanté : votre idée devient un véritable objet.", category: "objets", details: ["Objet classique", "NFC ou lumineux", "Version aimantée possible"] },
  { id: "usb", title: "Clé USB personnalisée", label: "Utile", description: "La clé avec plaque interchangeable est un exemple. Votre coque peut prendre une autre forme et recevoir un prénom, un logo ou un motif.", category: "objets", details: ["8 à 128 Go selon stock", "Plaque et coque personnalisables", "Forme, inscription et finition sur devis"] },
  { id: "stand", title: "Support personnalisé", label: "Accessoire", description: "Le support présenté est un exemple : téléphone, écouteurs, câbles ou autre objet. Sa forme et ses appuis s’adaptent à votre usage.", category: "objets", details: ["Dimensions et appuis adaptés", "Usage à préciser dans le devis", "Gravure ou logo possible"] },
  { id: "deadpool", title: "Deadpool cousu", label: "Figurine", description: "Une version texturée pleine de détails, disponible avec ou sans bonnet de Noël.", category: "figurines", details: ["Dimensions au choix", "Avec ou sans bonnet", "Texture effet cousu"] },
  { id: "stitch", title: "Stitch", label: "Figurine", description: "Une figurine expressive en PLA, imprimée dans la dimension de votre choix.", category: "figurines", details: ["Impression PLA", "Format personnalisable", "Nombreux détails"] },
  { id: "rocket", title: "Fusée Tintin", label: "Figurine", description: "La célèbre fusée rouge et blanche, avec taille et finition personnalisables.", category: "figurines", details: ["Dimensions au choix", "Finition brillante ou mate", "Impression PLA"] },
  { id: "mario", title: "Mario", label: "Figurine", description: "Une reproduction haute en couleur, fabriquée à la demande dans le format souhaité.", category: "figurines", details: ["Format personnalisable", "Impression multicolore", "Lot disponible"] },
  { id: "luigi", title: "Luigi", label: "Figurine", description: "Le compagnon parfait de Mario, seul ou en lot, avec plusieurs dimensions possibles.", category: "figurines", details: ["Format personnalisable", "Impression multicolore", "Lot disponible"] },
];

export type CurrentUser = { displayName: string; email: string } | null;
