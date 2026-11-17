import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Select nativo (no Radix) con el mismo lenguaje visual que el resto de
 * src/components/ui — a propósito, no el Select de shadcn/ui: los
 * filtros del catálogo son un <form method="get"> que tiene que andar sin
 * JavaScript, y el Select de Radix no es un <select> real.
 */
function SelectNative({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-lg border border-input bg-card px-3.5 py-2 pr-9 text-sm text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { SelectNative };
