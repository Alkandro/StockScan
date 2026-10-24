// Formatos de código de barras conocidos.
// Cada regla captura, en el grupo 1, solo la parte que identifica al MODELO.
// Lo demás (contador, fecha, lote) cambia en cada unidad y se ignora.
const MODEL_RULES = [
  // Etiqueta larga: 8 dígitos + MODELO + contador de 4 dígitos + fecha de 8 dígitos + lote
  // Ej.: 34940577UGJGC51BR  #EL       0001 20261008 326X0800L9Q1010
  /^\d{8}\s*(\S.*?)\s*\d{4}\s+\d{8}\b/,
];

/**
 * Analiza un código leído:
 * - matched:   true si se reconoció el formato y se pudo sacar el modelo
 * - modelKey:  modelo con espacios normalizados (ej. "UGJGC51BR #EL")
 * - modelName: modelo sin espacios (ej. "UGJGC51BR#EL"), que se usa como nombre
 */
export function parseBarcode(raw) {
  const text = String(raw ?? "").trim();
  let model = text;
  let matched = false;

  for (const rule of MODEL_RULES) {
    const match = text.match(rule);

    if (match && match[1] && match[1].trim()) {
      model = match[1];
      matched = true;
      break;
    }
  }

  let modelKey = model.replace(/\s+/g, " ").trim().toUpperCase();

  // Códigos solo numéricos: sin ceros a la izquierda
  if (/^\d+$/.test(modelKey)) modelKey = modelKey.replace(/^0+(?=\d)/, "");

  return {
    matched,
    modelKey,
    modelName: modelKey.replace(/\s+/g, ""),
  };
}

/** Modelo del código leído, con los espacios normalizados. */
export function modelKeyFromCode(raw) {
  return parseBarcode(raw).modelKey;
}

/** Clave para comparar modelos: ignora mayúsculas y todos los espacios. */
export function modelMatchKey(raw) {
  return parseBarcode(raw).modelName;
}
