# habit·an·do

MVP de habit·an·do: catálogo curado de interiorismo y arquitectura en 11
categorías (muebles, decoración, iluminación, pisos y revestimientos,
sanitarios, textiles, alfombras, climatización, bazar, jardinería, arte).
La plataforma no procesa pagos — cada ficha de producto redirige al sitio
del local de origen para completar la compra.

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
- ✅ **Acceso temporal para clientes de un estudio** (`/estudios/clientes`):
  un estudio aprobado genera links de invitación con vencimiento
  configurable — ver "Clientes invitados" más abajo.
- ✅ **Script de importación de locales reales** (`scripts/importar-locales.ts`):
  scraping + clasificación por IA a partir de un CSV — ver "Importar
  locales reales" más abajo.
- ⏳ Panel de asesoría y fase 2 completa: ver brief técnico, sección 2.

> **Pivot de modelo de negocio**: el foco pasó a ser B2B-first — suscripciones
> de estudios de arquitectura/diseño (solicitud + aprobación manual + rol
> `estudio`, ya armado). El catálogo sigue público para cualquier
> visitante; lo que queda reservado a estudios con suscripción activa son
> las funcionalidades premium (specs técnicas ampliadas, exportar
> propuestas, bloques CAD/SketchUp cuando existan).

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
   - Si tu proyecto ya tenía `schema.sql` corrido con las 5 categorías
     viejas (`mueble`/`revestimiento`/`griferia`), corré también
     `supabase/schema-categorias-v2.sql` — migra `locales`/`productos` a
     las 11 categorías actuales sin perder datos. En un proyecto nuevo no
     hace falta: `schema.sql` ya trae el enum completo.
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
  cuenta en habit·an·do", cuerpo en
  `supabase/email-templates/confirm-signup.html`.
- **Invite user** (aprobación de una solicitud de estudio, ver sección B2B
  más abajo): asunto "Tu estudio fue aprobado en habit·an·do", cuerpo en
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
búsqueda multi-local para proyectos, specs ampliadas y export a PDF quedan
para una próxima iteración — lo que ya funciona de punta a punta es el
control de acceso).

**Propuesta de valor B2B**: agilizar la búsqueda de elementos de
interiorismo/arquitectura para proyectos de estudios (no precios
mayoristas ni marketplace). A futuro, en evaluación: generar
automáticamente bloques de AutoCAD/SketchUp de cada producto a partir de
una foto (con IA) — no confirmado, se menciona como tal en `/para-estudios`.

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

## Clientes invitados (acceso temporal)

Un estudio con cuenta aprobada puede darle acceso de solo-catálogo-y-favoritos
a un cliente suyo, por tiempo limitado, sin que ese cliente pueda a su vez
invitar a nadie.

**Flujo**: estudio en `/estudios/clientes` completa proyecto (opcional) +
duración en días → genera un link (`/invitacion/{id}`), **sin crear ninguna
cuenta todavía** → se lo comparte al cliente por el medio que quiera
(WhatsApp, mail, etc.) → el cliente entra al link, pone su email y
contraseña → se crea su cuenta (`tipo_cuenta='cliente_invitado'`,
`estudio_id` = el estudio que lo invitó, `expira_en` = hoy + los días
elegidos) y queda logueado directo, sin pasar por confirmación de email.

- El cliente invitado puede navegar el catálogo (que ya es público para
  cualquiera) y guardar favoritos en `/perfil`, igual que una cuenta normal.
- Cuando `expira_en` ya pasó, o el estudio lo revocó a mano, **no puede
  volver a loguearse** — el intento de login lo desloguea al toque con el
  mensaje "Tu acceso expiró. Consultá con tu estudio." (chequeo también en
  `/perfil` y en el endpoint de favoritos, por si ya tenía una sesión
  abierta de antes de expirar).
- El estudio ve todas sus invitaciones (usadas y sin usar) en
  `/estudios/clientes`, con estado (Pendiente de uso / Activo / Expirado /
  Revocado) y un botón **Revocar** — antes de que la usen, invalida el
  link; después de usada, corta el acceso de ese cliente puntual.

### Setup

Corré `supabase/schema-clientes-invitados.sql` en el SQL Editor (después de
`schema.sql` y `schema-b2b.sql`). Agrega el tipo de cuenta
`cliente_invitado` a `perfiles`, las columnas que necesita
(`estudio_id`, `proyecto`, `expira_en`, `revocado_en`, y `email` para poder
mostrarlo en el panel del estudio sin tocar `auth.users`), y la tabla
`invitaciones_cliente`. No necesita ninguna variable de entorno nueva —
usa las mismas credenciales de Supabase que ya están cargadas.

## Importar locales reales (script)

`scripts/importar-locales.ts` lee un CSV de locales (nombre, sitio web,
categorías generales), scrapea cada sitio y usa la API de Anthropic para
extraer productos y clasificarlos en una de las 11 categorías del catálogo.
El CSV real ya está en `scripts/data/locales-habitando.csv` (167 locales).

**Corre en tu máquina, no acá en Claude Code** — este entorno no tiene
salida de red hacia sitios externos (lo mismo que pasó con Supabase/Vercel
al principio), así que el scraping tiene que hacerse desde tu compu con tu
propia conexión.

### Antes de correrlo

1. Corré `supabase/schema-locales-opcionales.sql` en el SQL Editor (hace
   opcionales `direccion`/`ciudad`/`lat`/`lng` en `locales` — la mayoría de
   estos locales son tiendas online sin local físico).
2. Cloná el repo en tu máquina (`git clone ...`) y `npm install`.
3. Necesitás en el entorno (`.env.local` alcanza, el script lo lee igual
   que la app):
   ```
   ANTHROPIC_API_KEY=...
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   La `ANTHROPIC_API_KEY` se saca de [console.anthropic.com](https://console.anthropic.com)
   (es una cuenta aparte de Supabase/Vercel — si no la tenés, hay que crearla ahí).

### Cómo correrlo

```bash
# Probar primero con pocos locales y sin escribir nada en la base:
npm run importar:locales -- --limit=5 --dry-run

# Si se ve bien, correr en serio con un lote chico:
npm run importar:locales -- --limit=20

# Encadenar el resto (es idempotente: a los locales ya cargados
# — mismo sitio_web — no los vuelve a crear, pero si lo corrés dos
# veces completo sí va a duplicar los productos de un mismo local):
npm run importar:locales
```

Flags disponibles: `--csv=ruta` (default el CSV de locales-habitando),
`--offset=N` (cuántos locales saltear desde el principio, para continuar
donde quedó una corrida anterior sin duplicar), `--limit=N` (cuántos
locales procesar desde ahí), `--max-productos=N` (por local, default 4),
`--max-imagenes=N` (fotos que la IA mira por local, default 6),
`--delay=ms` (pausa entre locales, default 1500), `--model=id` (default
`claude-sonnet-5`; `claude-haiku-4-5-20251001` sale más barato si se
prioriza costo sobre precisión).

### Qué hace y qué no

- Por cada local: busca si ya existe por `sitio_web` (si no, lo crea, sin
  dirección/coordenadas — se pueden completar a mano después desde el
  Table Editor de Supabase para que aparezca en el Mapa).
- Descarga la página y le pasa a Claude el texto + hasta `--max-imagenes`
  fotos reales (descargadas y mostradas como imagen, no solo la URL como
  texto) para que identifique hasta N productos con nombre, precio,
  material, color, estilo, medidas, categoría y la foto que corresponde a
  cada uno. Si no hay ninguna imagen que matchee con confianza, el
  producto queda sin foto (`imagenes: []`) — la UI lo maneja mostrando
  "Sin foto" en vez de romper.
- La categoría se fuerza por schema (`enum` con los 11 valores exactos) Y
  se vuelve a validar en código antes de insertar — si por algún motivo
  llega algo fuera de esa lista, se descarta ese producto puntual con un
  warning en vez de romper el resto de la importación.
- Si un sitio no responde, está caído, o no tiene ningún producto con
  nombre y precio claramente visibles, ese local queda sin productos
  (nunca inventa datos) — quedan logueados al final cuántos fallaron.
- El CSV trae algunas categorías sin equivalente exacto en el modelo
  (`empapelados`, `espejos`) — se aproximan a `pisos_y_revestimientos` y
  `decoracion` respectivamente; está documentado en el propio script
  (`SINONIMOS_CATEGORIA`) por si se prefiere otro mapeo.
- Sitios con mucho contenido armado en JavaScript (no en el HTML inicial)
  pueden devolver poco o ningún texto útil — el script no usa un browser
  real (Playwright), así que esos locales probablemente queden sin
  productos en esta primera pasada. Es una limitación conocida, no un bug.

### Costo estimado (API de Anthropic)

Con `claude-sonnet-5` ($2/millón de tokens de entrada, $10/millón de
salida) y el default de 6 imágenes por local, cada local sale
aproximadamente 2-3 centavos de dólar. Para los 167 locales del CSV
completo, el total ronda **los 3-6 dólares**, variando según cuántas
imágenes tenga cada sitio. Se puede ver el saldo y el consumo real en
[console.anthropic.com](https://console.anthropic.com) → Billing.

## Próximos pasos sugeridos

Ver brief técnico, sección 7: validar con usuarios/locales piloto, cargar
locales/productos reales, y avanzar con el panel de asesoría (fase 2).
