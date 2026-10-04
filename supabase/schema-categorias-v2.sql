-- habit·an·do — actualiza categoria_producto de 5 a 11 valores.
-- Correr en el SQL Editor DESPUÉS de schema.sql (reemplaza el enum viejo
-- por el nuevo, migrando los datos que ya existan en locales/productos).
--
-- Mapeo de categorías viejas -> nuevas:
--   mueble        -> muebles
--   decoracion    -> decoracion     (sin cambio)
--   iluminacion   -> iluminacion    (sin cambio)
--   revestimiento -> pisos_y_revestimientos
--   griferia      -> sanitarios
--
-- No se puede hacer con "alter type ... add value" + "drop value" porque
-- Postgres no permite sacar valores de un enum en uso. El camino seguro es
-- crear el tipo nuevo, migrar cada columna a través de una columna
-- temporaria, y recién ahí borrar el tipo viejo.

create type categoria_producto_v2 as enum (
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

-- productos.categoria
alter table productos add column categoria_v2 categoria_producto_v2;

update productos set categoria_v2 = (case categoria::text
  when 'mueble' then 'muebles'
  when 'revestimiento' then 'pisos_y_revestimientos'
  when 'griferia' then 'sanitarios'
  else categoria::text
end)::categoria_producto_v2;

alter table productos alter column categoria_v2 set not null;
alter table productos drop column categoria;
alter table productos rename column categoria_v2 to categoria;

-- locales.categoria
alter table locales add column categoria_v2 categoria_producto_v2;

update locales set categoria_v2 = (case categoria::text
  when 'mueble' then 'muebles'
  when 'revestimiento' then 'pisos_y_revestimientos'
  when 'griferia' then 'sanitarios'
  else categoria::text
end)::categoria_producto_v2;

alter table locales alter column categoria_v2 set not null;
alter table locales drop column categoria;
alter table locales rename column categoria_v2 to categoria;

-- Reemplazar el tipo viejo por el nuevo con el mismo nombre.
drop type categoria_producto;
alter type categoria_producto_v2 rename to categoria_producto;

-- Los índices se cayeron al borrar las columnas — se recrean.
create index if not exists productos_categoria_idx on productos (categoria);
