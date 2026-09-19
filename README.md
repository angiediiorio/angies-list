# habit·AN·do

MVP de habit·AN·do: catálogo curado de muebles, decoración, iluminación,
revestimientos y grifería. La plataforma no procesa pagos — cada ficha de
producto redirige al sitio del local de origen para completar la compra.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase.

## Estado del MVP

- ✅ **Catálogo** (`/catalogo`): grilla de productos con filtros por tipo,
  ubicación del local, material, color, estilo y precio.
- ✅ **Ficha de producto** (`/producto/[slug]`): detalle, galería, local de
  origen, botón "Ir a comprar" y sugerencias de productos complementarios.
- ✅ **Landing** (`/`): propuesta de valor + acceso al catálogo.
- ✅ **Mapa de locales** (`/mapa`): pines por local (Leaflet + OpenStreetMap,
  sin API key), filtrable por categoría.
- ✅ **Registro/login + Favoritos**: cuenta opcional (Supabase Auth, email +
  contraseña) que no bloquea navegar ni comprar; con cuenta se pueden
  guardar productos en `/perfil`.
- ⏳ Panel de asesoría y fase 2 completa: ver brief técnico, sección 2.

Ahora mismo el catálogo corre 100% sobre **datos mock** (`src/data/`) para
poder validar la experiencia sin depender de infraestructura. La capa de
datos ya está preparada para pasar a Supabase sin tocar las páginas — ver
"Conectar Supabase" más abajo.

## Getting started

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Arquitectura de datos

```
src/
  types/            Tipos del dominio (Producto, Local, filtros, etc.)
  data/             Datos mock (locales y productos)
  lib/
    repository.ts               Interfaz CatalogoRepository
    repositories/
      mock-repository.ts        Implementación sobre datos en memoria
      supabase-repository.ts    Implementación sobre Supabase/Postgres
    catalogo.ts                 Elige repositorio según DATA_SOURCE
    supabase/                   Clientes de Supabase (browser / server)
  components/       ProductCard, CatalogFilters, header/footer
  app/
    page.tsx                    Landing
    catalogo/page.tsx           Catálogo con filtros (server component)
    producto/[slug]/page.tsx    Ficha de producto
```

Las páginas llaman siempre a `getCatalogoRepository()` — nunca importan los
datos mock ni Supabase directamente — así que cambiar la fuente de datos es
un cambio de configuración, no de código.

## Conectar Supabase (base de datos real)

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Corré `supabase/schema.sql` en el SQL Editor del proyecto (crea las
   tablas `locales`, `productos` y, para fases siguientes, `favoritos` y
   `clicks_redireccion`, con RLS habilitado).
3. Opcional: corré `supabase/seed.sql` para cargar el mismo catálogo de
   prueba que hoy usan los datos mock (útil para comparar que ambas fuentes
   se comporten igual).
4. Copiá `.env.local.example` a `.env.local` y completá:
   ```
   DATA_SOURCE=supabase
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Reiniciá `npm run dev`. El catálogo y las fichas de producto van a leer
   de Supabase sin ningún otro cambio.

Con `DATA_SOURCE=mock` (o sin `.env.local`) el proyecto sigue funcionando
igual que hoy, con los datos de `src/data/`.

## Registro/login + Favoritos (Supabase Auth)

Usa las mismas credenciales que "Conectar Supabase" de arriba — no hace
falta nada adicional en `.env.local`. Dos cosas para configurar en el
dashboard de Supabase:

1. **Authentication → URL Configuration → Redirect URLs**: agregá
   `http://localhost:3000/auth/callback` (para desarrollo local) y
   `https://<tu-dominio-de-vercel>/auth/callback` (para producción). Sin
   esto, el link de confirmación de email no va a poder volver a la app.
2. **Authentication → Providers → Email → Confirm email**: si lo dejás
   activado (default), un usuario nuevo tiene que confirmar el email antes
   de poder iniciar sesión. Para probar más rápido en desarrollo, se puede
   desactivar.
3. Opcional: **Authentication → Emails → Confirm signup** — reemplazá el
   asunto/cuerpo genérico de Supabase por la plantilla en
   `supabase/email-templates/confirm-signup.html` (con el branding de
   habit·AN·do). El remitente sigue siendo el compartido de Supabase salvo
   que se configure SMTP propio en Authentication → Settings → SMTP Settings.

Sin cuenta se puede seguir navegando el catálogo y comprando con
normalidad — el login solo es necesario para guardar favoritos
(`/perfil`). Sin las credenciales de Supabase configuradas, `/login` y
`/registro` muestran un aviso en vez de romperse.

## Próximos pasos sugeridos

Ver brief técnico, sección 7: validar con usuarios/locales piloto, cargar
locales/productos reales, y avanzar con el panel de asesoría (fase 2).
