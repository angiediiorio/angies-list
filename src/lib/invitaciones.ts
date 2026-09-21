import { createClient } from "@/lib/supabase/server";
import type { EstadoInvitacion, InvitacionCliente } from "@/types";

/** Invitaciones que generó un estudio (usadas y sin usar), con los datos
 * del cliente ya resueltos si el link fue reclamado. RLS en
 * invitaciones_cliente/perfiles garantiza que un estudio solo ve lo suyo. */
export async function getInvitacionesDelEstudio(estudioId: string): Promise<InvitacionCliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitaciones_cliente")
    .select("*, cliente:perfiles!cliente_id(email, expira_en, revocado_en)")
    .eq("estudio_id", estudioId)
    .order("creado_en", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as InvitacionCliente[];
}

/** Estado a mostrar en el panel: una invitación sin usar es "pendiente" (o
 * "revocado" si se dio de baja el link antes de que lo usaran); una ya
 * reclamada hereda el estado del perfil del cliente. */
export function estadoDeInvitacion(invitacion: InvitacionCliente): EstadoInvitacion {
  if (!invitacion.usado_en) {
    return invitacion.revocado_en ? "revocado" : "pendiente";
  }

  const cliente = invitacion.cliente;
  if (!cliente || cliente.revocado_en) return "revocado";
  if (cliente.expira_en && new Date(cliente.expira_en) < new Date()) return "expirado";
  return "activo";
}
