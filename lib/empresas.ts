export const EMPRESAS = [
  "Global Coffee Industries",
  "Catunambú Netherland",
  "Catunambú Chile",
  "Tea Quiero",
  "Expressate",
  "La Rocca",
  "Emotions café",
  "Polymat Solutions",
  "Empire teas",
  "Cafés Civit",
] as const;

export type Empresa = (typeof EMPRESAS)[number];
