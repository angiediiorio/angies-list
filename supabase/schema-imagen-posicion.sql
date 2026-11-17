-- habit·an·do — agrega `imagen_posicion` a `productos`.
-- Correr en el SQL Editor (después de schema.sql, en cualquier momento).
--
-- Guarda un valor CSS object-position (ej. "50% 0%") para que desde
-- /admin/destacados se pueda reencuadrar qué parte de la foto principal
-- se ve en el catálogo/ficha de producto, sin tener que editar el
-- archivo de imagen. null (default) = centrado, el comportamiento de
-- siempre.

alter table productos add column if not exists imagen_posicion text;
