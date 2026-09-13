import Link from "next/link";

export function SiteHeader() {
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
        </nav>
      </div>
    </header>
  );
}
