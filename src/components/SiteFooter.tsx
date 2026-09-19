import { BRAND_NAME } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/10 py-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
      <p>
        {BRAND_NAME} no procesa pagos: cada compra se completa en el sitio
        del local correspondiente.
      </p>
    </footer>
  );
}
