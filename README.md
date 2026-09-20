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
- ✅ **Sección B2B para estudios** (`/para-estudios`): solicitud de acceso
  con aprobación manual, panel de admin y rutas premium protegidas — ver
  "Sección B2B" más abajo.
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

Sin cuenta se puede seguir navegando el catálogo y comprando con
normalidad — el login solo es necesario para guardar favoritos
(`/perfil`). Sin las credenciales de Supabase configuradas, `/login` y
`/registro` muestran un aviso en vez de romperse.

### Mail con marca propia

SMTP propio configurado vía [Resend](https://resend.com) con el dominio
`habitando.com.ar` verificado (Authentication → Emails → SMTP Settings).
Con eso habilitado, en **Authentication → Emails → Templates** se pegan:

- **Confirm signup** (registro normal en `/registro`): asunto "Confirmá tu
  cuenta en habit·AN·do", cuerpo en
  `supabase/email-templates/confirm-signup.html`.
- **Invite user** (aprobación de una solicitud de estudio, ver sección B2B
  más abajo): asunto "Tu estudio fue aprobado en habit·AN·do", cuerpo en
  `supabase/email-templates/invite-user.html`. Es una plantilla aparte —
  `inviteUserByEmail` no usa la de "Confirm signup".

Sin SMTP propio configurado, Supabase usa su plantilla genérica compartida
igual — el flujo funciona en ambos casos, solo cambia el diseño del mail.

## Sección B2B para estudios

Flujo completo: `/para-estudios` (landing pública) → `/para-estudios/solicitar`
(formulario) → queda en `solicitudes_estudio` con estado `pendiente`, **sin
crear ninguna cuenta todavía** (así nadie puede loguearse hasta ser
aprobado) → admin la revisa en `/admin/estudios` → al aprobar, se crea la
cuenta real (invitación de Supabase) y se le manda un mail con el link para
que elija contraseña en `/activar-cuenta` → una vez logueada, esa cuenta
tiene `tipo_cuenta='estudio'` y `estado_verificacion='aprobado'` y puede
entrar a las secciones premium (`/estudios`, hoy con contenido de ejemplo:
precios mayoristas, specs ampliadas y export a PDF quedan para una próxima
iteración — lo que ya funciona de punta a punta es el control de acceso).

### Setup

1. Corré `supabase/schema-b2b.sql` en el SQL Editor (después de
   `schema.sql`). Crea `perfiles` (extiende cada usuario con
   `tipo_cuenta`/`estado_verificacion`) y `solicitudes_estudio`, más un
   trigger que le da `tipo_cuenta='cliente_final'` a cualquier cuenta
   nueva automáticamente.
2. En `.env.local` (y en Vercel → Settings → Environment Variables),
   agregá:
   - `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API → `service_role`
     (o `secret` en el sistema nuevo de keys). **Nunca** con prefijo
     `NEXT_PUBLIC_` — solo se usa en Server Actions.
   - `ADMIN_EMAILS`: tu email de Supabase Auth (el que usás para loguearte
     en `/login`). Separá con comas si hay más de un admin.
3. En **Authentication → URL Configuration → Redirect URLs**, agregá
   también `<tu-dominio>/auth/callback?next=/activar-cuenta` (o dejá el
   comodín que ya hayas cargado para `/auth/callback` — alcanza con que
   cubra ese path).

### Cómo probarlo

1. Andá a `/para-estudios/solicitar` y mandá una solicitud de prueba.
2. Entrá a `/admin/estudios` logueada con un email que esté en
   `ADMIN_EMAILS` — vas a ver la solicitud en "Pendientes".
3. Apretá "Aprobar": se crea la cuenta y sale el mail de invitación
   (plantilla genérica de Supabase, mismo tema del SMTP que en Registro).
4. Desde ese mail, el link te loguea y te manda a `/activar-cuenta` para
   poner contraseña. Después de eso, `/estudios` ya es visible.
5. Probá también entrar a `/estudios` con una cuenta normal (`cliente_final`)
   — te tiene que mandar a `/para-estudios`.

## Próximos pasos sugeridos

Ver brief técnico, sección 7: validar con usuarios/locales piloto, cargar
locales/productos reales, y avanzar con el panel de asesoría (fase 2).
