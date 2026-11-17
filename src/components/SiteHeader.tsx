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
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-medium tracking-tight">
          {BRAND_NAME}
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/catalogo" className="hover:text-foreground">
            Catálogo
          </Link>
          <Link href="/mapa" className="hover:text-foreground">
            Mapa
          </Link>
          {esEstudioAprobado(perfil) ? (
            <Link href="/estudios" className="hover:text-foreground">
              Panel de estudio
            </Link>
          ) : (
            <Link href="/para-estudios" className="hover:text-foreground">
              Para estudios
            </Link>
          )}
          {isAdminEmail(user?.email) && (
            <>
              <Link href="/admin/estudios" className="hover:text-foreground">
                Admin
              </Link>
              <Link href="/admin/destacados" className="hover:text-foreground">
                Destacados
              </Link>
            </>
          )}
          {user ? (
            <>
              <Link href="/perfil" className="hover:text-foreground">
                Favoritos
              </Link>
              <form action={logout}>
                <button type="submit" className="hover:text-foreground" title={user.email}>
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="hover:text-foreground">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
