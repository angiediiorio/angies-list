-- habit·an·do — agrega `destacado_demo` a `productos`.
-- Correr en el SQL Editor (después de schema.sql, en cualquier momento).
--
-- Marca manualmente qué productos están listos para mostrarse en la demo
-- a estudios: foto confirmada + todos los campos completos. El catálogo
-- (ver src/app/catalogo/page.tsx) filtra por esto por defecto; el link
-- "Ver catálogo completo" (?todos=1) muestra todo sin filtrar.
--
-- La selección real de qué productos marcar la hace
-- scripts/curar-destacados-demo.ts, no este archivo — esto solo prepara
-- la columna.

alter table productos add column if not exists destacado_demo boolean not null default false;
create index if not exists productos_destacado_demo_idx on productos (destacado_demo) where destacado_demo;
