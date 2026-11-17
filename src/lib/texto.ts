// Los nombres de producto vienen de la IA tal como los escribe cada
// sitio (a veces TODO EN MAYÚSCULA, a veces Con Cada Palabra En
// Mayúscula) — esto normaliza cómo se muestran, sin tocar el dato
// original en la base.
export function capitalizarOracion(texto: string): string {
  const limpio = texto.trim();
  if (!limpio) return limpio;
  const minuscula = limpio.toLowerCase();
  return minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
}
