"use client";

import { useState } from "react";

export function CopyLinkButton({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin acceso al portapapeles (permiso denegado, contexto no seguro):
      // no rompemos nada, el link ya está visible como texto para copiar a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="shrink-0 text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
    >
      {copiado ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
