// Registro/login/favoritos dependen de Supabase Auth, que a su vez necesita
// las mismas credenciales que el repositorio de datos (ver .env.local.example).
// Esto permite que el resto de la app siga funcionando con DATA_SOURCE=mock
// y sin ningún .env cargado.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
