-- habit·an·do — sección B2B para estudios de arquitectura/diseño.
-- Correr en el SQL Editor DESPUÉS de schema.sql (y seed.sql si ya se corrió).
-- Es seguro volver a correrlo (usa if not exists / or replace / on conflict).

create extension if not exists "pgcrypto";

-- Perfiles extiende auth.users con datos propios de la app. No se puede
-- agregar columnas a auth.users directamente sin arriesgar romper las
-- migraciones internas de Supabase, así que se maneja como tabla aparte
-- 1 a 1 (id = auth.users.id).
create table if not exists perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tipo_cuenta text not null default 'cliente_final'
    check (tipo_cuenta in ('cliente_final', 'estudio')),
  estado_verificacion text
    check (estado_verificacion in ('pendiente', 'aprobado', 'rechazado')),
  nombre_estudio text,
  cuit_matricula text,
  sitio_web_instagram text,
  created_at timestamptz not null default now()
);

alter table perfiles enable row level security;

create policy "Cada usuario ve su propio perfil" on perfiles
  for select using (auth.uid() = id);

-- Crea automáticamente un perfil "cliente_final" para cada cuenta nueva
-- (registro normal en /registro, o cualquier alta futura). Las cuentas de
-- estudio arrancan igual (por el trigger) y se pisan a tipo_cuenta='estudio'
-- explícitamente cuando se aprueban (ver aprobarSolicitud en el código).
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, tipo_cuenta)
  values (new.id, 'cliente_final')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill: usuarios que ya existían antes de esta migración (por ejemplo
-- cuentas de prueba creadas mientras se armaba el MVP) no tienen fila en
-- perfiles porque el trigger de arriba solo corre en altas nuevas.
insert into public.perfiles (id, tipo_cuenta)
select id, 'cliente_final' from auth.users
on conflict (id) do nothing;

-- Solicitudes de acceso B2B: formulario público en /para-estudios. No
-- requiere cuenta — se completa antes de que exista ningún usuario. Solo
-- se lee/edita desde el panel de admin (con la Service Role Key, que
-- bypassea RLS), por eso no hay policy de select/update para usuarios.
create table if not exists solicitudes_estudio (
  id uuid primary key default gen_random_uuid(),
  nombre_estudio text not null,
  cuit_matricula text not null,
  email text not null,
  sitio_web_instagram text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobado', 'rechazado')),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  revisado_at timestamptz
);

create index if not exists solicitudes_estudio_estado_idx on solicitudes_estudio (estado);

alter table solicitudes_estudio enable row level security;

create policy "Cualquiera puede solicitar acceso" on solicitudes_estudio
  for insert with check (true);
