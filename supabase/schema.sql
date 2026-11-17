-- habit·an·do — esquema inicial (brief técnico, sección 4)
-- Pensado para Supabase/Postgres. Correr en el SQL Editor del proyecto.

create extension if not exists "pgcrypto";

create type categoria_producto as enum (
  'muebles',
  'decoracion',
  'iluminacion',
  'pisos_y_revestimientos',
  'sanitarios',
  'textiles',
  'alfombras',
  'climatizacion',
  'bazar',
  'jardineria',
  'arte'
);

create table if not exists locales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria categoria_producto not null,
  -- Muchos locales son tiendas online sin local físico: estos tres son
  -- opcionales a propósito. El Mapa (/mapa) solo muestra los que sí
  -- tengan lat/lng cargados.
  direccion text,
  ciudad text,
  lat double precision,
  lng double precision,
  contacto text,
  sitio_web text not null,
  created_at timestamptz not null default now()
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  local_id uuid not null references locales (id) on delete cascade,
  nombre text not null,
  categoria categoria_producto not null,
  precio numeric(12, 2) not null,
  moneda text not null default 'ARS',
  material text not null,
  color text not null,
  estilo text not null,
  medidas text,
  stock boolean not null default true,
  descripcion text,
  imagenes text[] not null default '{}',
  producto_relacionado_ids uuid[] not null default '{}',
  -- Curaduría manual para la demo a estudios: true solo en los productos
  -- con foto confirmada y todos los campos completos (ver
  -- scripts/curar-destacados-demo.ts). El catálogo filtra por esto por
  -- defecto, mostrando el completo solo con ?todos=1.
  destacado_demo boolean not null default false,
  -- object-position CSS (ej. "50% 0%") para reencuadrar la foto principal
  -- desde /admin/destacados sin recortar el archivo. null = centrado.
  imagen_posicion text,
  created_at timestamptz not null default now()
);

create index if not exists productos_categoria_idx on productos (categoria);
create index if not exists productos_local_id_idx on productos (local_id);
create index if not exists productos_precio_idx on productos (precio);
create index if not exists productos_destacado_demo_idx on productos (destacado_demo) where destacado_demo;

-- Fase 2 (pospuesto, ver brief sección 2): favoritos, tracking de clics y
-- asesoría. Se dejan creadas para no romper el modelo cuando se activen.

create table if not exists favoritos (
  user_id uuid not null references auth.users (id) on delete cascade,
  producto_id uuid not null references productos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, producto_id)
);

create table if not exists clicks_redireccion (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  producto_id uuid not null references productos (id) on delete cascade,
  local_id uuid not null references locales (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Row Level Security: lectura pública de catálogo, escritura restringida.
alter table locales enable row level security;
alter table productos enable row level security;
alter table favoritos enable row level security;
alter table clicks_redireccion enable row level security;

create policy "Lectura pública de locales" on locales
  for select using (true);

create policy "Lectura pública de productos" on productos
  for select using (true);

create policy "Cada usuario ve sus favoritos" on favoritos
  for select using (auth.uid() = user_id);

create policy "Cada usuario gestiona sus favoritos" on favoritos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Cada usuario registra sus clicks" on clicks_redireccion
  for insert with check (auth.uid() = user_id or user_id is null);
