import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProductCard } from "@/components/ProductCard";
import { getFavoritosConProducto } from "@/lib/favoritos";
import { getCurrentUser } from "@/lib/supabase/current-user";

export const metadata: Metadata = {
  title: "Mi perfil | Angie's List",
};

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/perfil");

  const favoritos = await getFavoritosConProducto(user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mi perfil</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{user.email}</p>
      </div>

      <h2 className="mb-4 text-lg font-medium">
        Favoritos ({favoritos.length})
      </h2>

      {favoritos.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          Todavía no guardaste ningún producto. Andá al{" "}
          <a href="/catalogo" className="underline">
            catálogo
          </a>{" "}
          y tocá el corazón del que te guste.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoritos.map((producto) => (
            <ProductCard key={producto.id} producto={producto} favorito logueado />
          ))}
        </div>
      )}
    </div>
  );
}
