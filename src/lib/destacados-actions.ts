"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/current-user";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    redirect("/");
  }
}

function revalidarCatalogo() {
  revalidatePath("/admin/destacados");
  revalidatePath("/catalogo");
  revalidatePath("/");
}

/** Reemplaza la foto (y opcionalmente el encuadre) de un producto
 * destacado. No tocamos el resto del producto — solo imagenes/imagen_posicion. */
export async function actualizarFotoDestacado(formData: FormData) {
  await requireAdmin();

  const productoId = String(formData.get("productoId") ?? "");
  const imagenUrl = String(formData.get("imagenUrl") ?? "").trim();
  const posicion = String(formData.get("posicion") ?? "").trim();

  if (!productoId || !imagenUrl) {
    redirect(`/admin/destacados?error=${encodeURIComponent("Completá la URL de la foto.")}`);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("productos")
    .update({ imagenes: [imagenUrl], imagen_posicion: posicion || null })
    .eq("id", productoId);

  if (error) {
    redirect(`/admin/destacados?error=${encodeURIComponent(error.message)}`);
  }

  revalidarCatalogo();
}

/** Saca destacado_demo del producto actual y se lo pone a otro producto
 * del mismo local — para reemplazar un destacado "poco vistoso" por otro
 * item real de ese local, sin tocar la curaduría del resto del catálogo. */
export async function cambiarProductoDestacado(formData: FormData) {
  await requireAdmin();

  const actualId = String(formData.get("actualId") ?? "");
  const nuevoId = String(formData.get("nuevoId") ?? "");

  if (!actualId || !nuevoId || actualId === nuevoId) return;

  const admin = createAdminClient();

  const { error: errorQuitar } = await admin
    .from("productos")
    .update({ destacado_demo: false })
    .eq("id", actualId);

  const { error: errorPoner } = await admin
    .from("productos")
    .update({ destacado_demo: true })
    .eq("id", nuevoId);

  const error = errorQuitar ?? errorPoner;
  if (error) {
    redirect(`/admin/destacados?error=${encodeURIComponent(error.message)}`);
  }

  revalidarCatalogo();
}
