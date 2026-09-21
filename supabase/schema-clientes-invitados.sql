-- habit·an·do — acceso temporal para clientes de un estudio (invitaciones).
-- Correr en el SQL Editor DESPUÉS de schema.sql y schema-b2b.sql.
-- Es seguro volver a correrlo.

create extension if not exists "pgcrypto";

-- Ampliamos perfiles: nuevo tipo_cuenta 'cliente_invitado', más las
-- columnas que necesita (a qué estudio pertenece, para qué proyecto,
-- cuándo vence, si se revocó a mano). email se agrega también acá porque
-- el panel del estudio necesita mostrarlo sin tocar auth.users.
alter table perfiles drop constraint if exists perfiles_tipo_cuenta_check;
alter table perfiles add constraint perfiles_tipo_cuenta_check
  check (tipo_cuenta in ('cliente_final', 'estudio', 'cliente_invitado'));

alter table perfiles add column if not exists email text;
alter table perfiles add column if not exists estudio_id uuid references perfiles (id) on delete set null;
alter table perfiles add column if not exists proyecto text;
alter table perfiles add column if not exists expira_en timestamptz;
alter table perfiles add column if not exists revocado_en timestamptz;

create index if not exists perfiles_estudio_id_idx on perfiles (estudio_id);

-- El trigger de altas (definido en schema-b2b.sql) ahora también guarda el
-- email. create or replace actualiza la función sin tocar el trigger que
-- ya la referencia.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, tipo_cuenta, email)
  values (new.id, 'cliente_final', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill: perfiles que ya existían antes de agregar la columna email.
update perfiles
set email = u.email
from auth.users u
where perfiles.id = u.id and perfiles.email is null;

-- Un estudio puede ver el perfil de los clientes que invitó (además de
-- poder ver siempre el suyo propio, política ya definida en schema-b2b.sql).
create policy "El estudio ve el perfil de sus clientes invitados" on perfiles
  for select using (auth.uid() = estudio_id);

-- Links de invitación. El link en sí (antes de ser reclamado) no requiere
-- ninguna cuenta — se crea recién cuando el cliente lo usa en
-- /invitacion/[id]. cliente_id referencia perfiles (no auth.users
-- directamente) para poder traer sus datos con un join de PostgREST.
create table if not exists invitaciones_cliente (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references perfiles (id) on delete cascade,
  proyecto text,
  dias_validez integer not null default 30 check (dias_validez > 0),
  creado_en timestamptz not null default now(),
  usado_en timestamptz,
  cliente_id uuid references perfiles (id) on delete set null,
  revocado_en timestamptz
);

create index if not exists invitaciones_cliente_estudio_id_idx on invitaciones_cliente (estudio_id);

alter table invitaciones_cliente enable row level security;

-- Solo el propio estudio ve/crea/edita sus invitaciones. La pantalla
-- pública donde el cliente reclama el link (/invitacion/[id]) no pasa por
-- acá: usa la Service Role Key desde el servidor, con sus propias
-- validaciones en código (ver src/lib/invitaciones-actions.ts).
create policy "El estudio ve sus invitaciones" on invitaciones_cliente
  for select using (auth.uid() = estudio_id);

create policy "El estudio crea sus invitaciones" on invitaciones_cliente
  for insert with check (auth.uid() = estudio_id);
