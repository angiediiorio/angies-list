-- habit·an·do — hace opcionales direccion/ciudad/lat/lng en `locales`.
-- Correr en el SQL Editor DESPUÉS de schema.sql.
--
-- Necesario para poder importar locales reales que son tiendas online sin
-- local físico (no tienen dirección que cargar). El Mapa (/mapa) ya está
-- preparado para mostrar solo los locales que sí tengan lat/lng.

alter table locales alter column direccion drop not null;
alter table locales alter column ciudad drop not null;
alter table locales alter column lat drop not null;
alter table locales alter column lng drop not null;
