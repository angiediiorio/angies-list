import Link from "next/link";

import { logout } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/supabase/current-user";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/60 sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Angie&apos;s List
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Link href="/catalogo" className="hover:text-zinc-950 dark:hover:text-white">
            Catálogo
          </Link>
          <Link href="/mapa" className="hover:text-zinc-950 dark:hover:text-white">
            Mapa
          </Link>
          {user ? (
            <>
              <Link href="/perfil" className="hover:text-zinc-950 dark:hover:text-white">
                Favoritos
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="hover:text-zinc-950 dark:hover:text-white"
                  title={user.email}
                >
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="hover:text-zinc-950 dark:hover:text-white">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
