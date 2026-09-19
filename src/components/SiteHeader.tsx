import Link from "next/link";

import { isAdminEmail } from "@/lib/admin-auth";
import { logout } from "@/lib/auth-actions";
import { BRAND_NAME } from "@/lib/brand";
import { esEstudioAprobado, getPerfil } from "@/lib/perfiles";
import { getCurrentUser } from "@/lib/supabase/current-user";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const perfil = user ? await getPerfil(user.id) : null;

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/60 sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {BRAND_NAME}
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Link href="/catalogo" className="hover:text-zinc-950 dark:hover:text-white">
            Catálogo
          </Link>
          <Link href="/mapa" className="hover:text-zinc-950 dark:hover:text-white">
            Mapa
          </Link>
          {esEstudioAprobado(perfil) ? (
            <Link href="/estudios" className="hover:text-zinc-950 dark:hover:text-white">
              Panel de estudio
            </Link>
          ) : (
            <Link href="/para-estudios" className="hover:text-zinc-950 dark:hover:text-white">
              Para estudios
            </Link>
          )}
          {isAdminEmail(user?.email) && (
            <Link href="/admin/estudios" className="hover:text-zinc-950 dark:hover:text-white">
              Admin
            </Link>
          )}
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
