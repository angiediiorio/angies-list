"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

import { cn } from "@/lib/utils";

interface FavoritoButtonProps {
  productoId: string;
  favoritoInicial: boolean;
  logueado: boolean;
  className?: string;
}

/** Corazón para guardar/sacar un producto de favoritos. Si el usuario no
 * está logueado, funciona como un link a /login (no bloquea la navegación). */
export function FavoritoButton({
  productoId,
  favoritoInicial,
  logueado,
  className = "",
}: FavoritoButtonProps) {
  const router = useRouter();
  const [favorito, setFavorito] = useState(favoritoInicial);
  const [cargando, setCargando] = useState(false);

  const base = "flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-70";

  if (!logueado) {
    return (
      <Link
        href="/login"
        title="Iniciá sesión para guardar favoritos"
        aria-label="Iniciá sesión para guardar favoritos"
        className={cn(base, className)}
      >
        <CorazonIcon relleno={false} />
      </Link>
    );
  }

  async function alternarFavorito(evento: MouseEvent) {
    evento.preventDefault();
    evento.stopPropagation();
    if (cargando) return;

    const siguiente = !favorito;
    setFavorito(siguiente);
    setCargando(true);

    try {
      const res = await fetch("/api/favoritos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el favorito");
      router.refresh();
    } catch {
      setFavorito(!siguiente); // revertimos si falló
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={alternarFavorito}
      aria-pressed={favorito}
      aria-label={favorito ? "Sacar de favoritos" : "Guardar en favoritos"}
      disabled={cargando}
      className={cn(base, className, "disabled:opacity-60")}
    >
      <CorazonIcon relleno={favorito} />
    </button>
  );
}

function CorazonIcon({ relleno }: { relleno: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] dark:text-white"
      fill={relleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.6-10-9.2C.4 8 1.7 4.6 5 3.6c2-.6 4 .2 5.2 2 .1.1.7 1 1.8 2.6 1.1-1.6 1.7-2.5 1.8-2.6 1.2-1.8 3.2-2.6 5.2-2 3.3 1 4.6 4.4 3 7.7-2.5 4.6-10 9.2-10 9.2z"
      />
    </svg>
  );
}
