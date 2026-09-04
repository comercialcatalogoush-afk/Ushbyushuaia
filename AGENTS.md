# AGENTS.md — Reglas permanentes del proyecto Ush By Ushuaia

## Memoria obligatoria
- ANTES de CUALQUIER acción (leer, editar, ejecutar comandos, responder al usuario),
  consulta **MEMORIA.md** en la raíz del proyecto. Es la memoria persistente del proyecto.
- Todos los comentarios de código en **español**.
- Si haces cambios relevantes, actualiza **MEMORIA.md** al final del turno.

## Explicación de los errores y bugs corregidos (para el dueño, sin conocimientos de programación)
> Esta sección está escrita para que el dueño entienda los problemas que se encontraron y
> corrigieron en la auditoría de seguridad (2026-09-04). Explicado con lenguaje de todos los días.

### ¿Qué es cada pieza y qué hace?
- **Supabase** = la base de datos en la nube donde vive el catálogo (productos, precios, stock,
  pedidos, clientes registrados, textos de la página).
- **"RLS"** = un "candado con reglas" que pone Supabase en cada tabla de datos, para decidir
  quién puede leer y quién puede escribir cada cosa. Los clientes anónimos (visitas a la web)
  son el rol "público"; el administrador autenticado (cuando entra al panel `/admin`) es el rol
  "administrador".
- **El panel admin `/admin`** = la parte privada donde el dueño ve pedidos, clientes, precios y
  respaldos. Solo debe ser accesible con la cuenta del administrador.

### Los 3 problemas GRAVES que se encontraron (que hubieran permitido robar/destruir datos)

**1. "La puerta trasera de la base de datos" (el candado estaba abierto).**
   - Dónde: en la configuración de seguridad de Supabase (`supabase/fix_rls.sql`).
   - Qué pasaba: en algún momento anterior se ejecutó una instrucción que dejó el candado
     (RLS) abierto en las tablas de **pedidos, clientes mayoristas y precios**. Eso significa
     que CUALQUIER persona en internet (no solo el admin) podía ver y hasta borrar los pedidos
     de los clientes y el historial de precios, sin contraseña.
   - Cómo se corrigió: se volvió a cerrar ese candado (solo el administrador puede leer y
     gestionar pedidos/clientes/precios; el público solo puede ver la tienda y hacer su pedido).
     Se verificó con pruebas reales que el público ya NO puede ver los pedidos y que el admin sí.

**2. "El catálogo podía mostrar productos ocultos (borradores)".**
   - Dónde: en el archivo `src/lib/supabase.ts` (la parte que busca un producto por su enlace,
     por ejemplo `/producto/ref-556287`).
   - Qué pasaba: la instrucción que filtraba "no mostrar borradores ni productos ocultos" estaba
     mal escrita y se pisaba a sí misma (normalmente solo se aplicaba el último filtro). Un
     visitante podía escribir en la barra del navegador el enlace de un producto que el dueño
     había marcado como Oculto o Borrador, y la web se lo mostraba igual.
   - Cómo se corrigió: se escribió bien la instrucción para que TODOS los filtros se apliquen a
     la vez: solo se muestra un producto si NO está oculto y si NO es borrador.

**3. "Se podía falsificar el precio y el descuento al hacer un pedido".**
   - Dónde: en `src/lib/supabase.ts` (la función `submitOrder`, que guarda cada pedido) y en
     `src/lib/pricing.ts` (donde viven los códigos de descuento como BIENVENIDA10).
   - Qué pasaba: el sitio calculaba el precio y el descuento en el navegador del visitante y se
     lo creía tal cual. Una persona con conocimientos técnicos podía cambiar el total en su
     navegador y mandar un pedido de $200.000 pagando $1, o inventarse un descuento falso.
   - Cómo se corrigió: ahora el servidor (Supabase) **recalcula el total por su cuenta** sumando
     precio × cantidad de cada prenda, y **comprueba que el código de descuento sea real** (uno
     de los códigos conocidos) y que cumpla el mínimo de unidades. Si algo no cuadra, rechaza el
     pedido.

**4. Empujar el botón "Confirmar pedido" varias veces.**
   - Dónde: `src/app/checkout/page.tsx`.
   - Qué pasaba: si se hacía doble clic sobre "Confirmar & Tramitar Pedido", se podía registrar
     el pedido dos veces (cobrando/descontando doble).
   - Cómo se corrigió: el botón queda bloqueado mientras se procesa y no permite un segundo clic.

**5. El stock podía descontarse dos veces por el mismo pedido.**
   - Dónde: `src/lib/supabase.ts` (función `confirmOrderAndDeductStock`).
   - Qué pasaba: cuando el admin confirmaba un pedido, el sistema descontaba el stock leyendo el
     número actual y luego guardándolo; si dos confirmaciones coincidían al mismo tiempo, el
     stock podía bajarse de más (se vendía mercancía que no existía).
   - Cómo se corrigió: se añadió una operación "atómica" (indivisible) en Supabase
     (`deduct_stock`) que resta el stock en un solo paso y de forma segura, sin importar cuántas
     confirmaciones lleguen a la vez.

### Problemas de seguridad MEDIOS corregidos (fuga de información a desconocidos)

**6. Los errores internos se mostraban a los visitantes.**
   - Dónde: `src/app/api/admin/clients/route.ts` y `src/app/api/admin/catalog/route.ts`.
   - Qué pasaba: cuando el sistema fallaba, la web respondía con el mensaje técnico interno del
     servidor (nombres de archivos, bases de datos, etc.). Un atacante usa esa información para
     aprender a entrar. Ahora solo se responde "Error interno del servidor" y el detalle real se
     guarda en el registro (log) privado.

**7. La clave de revalidación quedaba visible en el enlace (logs).**
   - Dónde: `src/app/api/revalidate-db/route.ts`.
   - Qué pasaba: la clave secreta que permite limpiar la memoria caché del sitio podía enviarse
     como parte del enlace (en la barra del navegador), y esa clave quedaba grabada en los
     registros del servidor. Ahora solo se acepta por el método seguro (POST), no por un enlace.

**8. Borrar datos sensibles sin permiso de administrador.**
   - Dónde: `src/lib/backup.ts` (función `purgeTransactionalData`, que vacía pedidos, clientes y
     precios para hacer respaldo).
   - Qué pasaba: esa función usaba la clave "anónima" y dependía del candado RLS. Para que el
     borrado masivo funcionara SIEMPRE (y no fallara por el candado), ahora usa la clave de
     servicio del administrador, verificando primero que exista.

### Correcciones de estabilidad (para que la página no se caiga ni se vea rara)

**9. Pantalla de error amigable si algo falla (en vez de página en blanco).**
   - Dónde: `src/app/layout.tsx` + nuevo archivo `src/components/ErrorBoundary.tsx`.
   - Qué pasaba: si un error ocurría en medio de una página, la web se quedaba en blanco o rota
     sin explicación. Ahora hay un aviso en español ("Algo salió mal / Intentar de nuevo").

**10. Ocultar que el sitio usa Next.js y activar el modo estricto.**
   - Dónde: `next.config.js`.
   - Qué pasaba: la web anunciaba en sus cabeceras la tecnología que usa (útil para atacantes).
     Ahora oculta esa pista, y además se activó el "modo estricto" de React, que ayuda a
     encontrar errores escondidos en el código durante el desarrollo.

### Lo que NO se cambió (para que lo sepas)
- Los formularios de notificación (cuando un cliente se registra o pide recuperar su contraseña)
  siguen funcionando sin contraseña de admin a propósito, porque los llaman los clientes desde
  la página. Ya tienen un límite de intentos por IP para frenar el spam.
- No se modificó `.env.local` ni se quitó ninguna clave.
- La instrucción SQL corregida vive en `supabase/reconcile_rls.sql` y YA se ejecutó y verificó
  en Supabase.

### En resumen
Antes: un desconocido podía (a) ver/borrar pedidos y precios, (b) ver productos ocultos, y
(c) falsificar precios y descuentos. Después de la corrección: todo eso quedó bloqueado, la
página sigue igual de normal para tí y tus clientes, y se añadieron pantallas de error amables
y bloqueos de estabilidad.

## Regla interna e inviolable (SIEMPRE en `principal`)
- **TODO** desarrollo y **TODO** deploy se hace SIEMPRE en la rama `principal`. Nunca crear,
  cambiar ni publicar en otra rama.
- Cualquier commit, push o deploy a Vercel usa únicamente `principal`.
- No usar `target: 'preview'` ni aliases de preview para el sitio principal: el deploy
  de producción (`ushbyushuaia.vercel.app`) se genera siempre desde `principal`.

## Regla obligatoria antes de cada cambio
Antes de modificar cualquier archivo:

1. Leer este `AGENTS.md` completo.
2. Consultar **MEMORIA.md**.
3. Revisar `git status`, la rama actual y los cambios existentes.
4. Inspeccionar el código relacionado con la solicitud.
5. Reproducir el problema en local o en producción cuando sea seguro.
6. Explicar brevemente la causa encontrada.
7. Aplicar el cambio mínimo necesario.
8. Ejecutar las pruebas correspondientes.
9. Informar exactamente qué se modificó y qué no se modificó.

Nunca afirmar que un cambio está publicado si no se verificó el despliegue real en Vercel.

## Entorno (Windows/PowerShell)
- Usar SIEMPRE `cmd /c "..."` (PowerShell bloquea npx.ps1 y rompe quoting).
  - Typecheck: `cmd /c "npx tsc --noEmit"`
  - Build: `cmd /c "npm run build"`
  - Dev visual: `npm run dev -- --hostname 127.0.0.1 --port 3000`
- ESLint NO configurado → omitir lint.
- Git: rama `principal`. Para mensajes de commit largos usar `git commit -F archivo`
  (el quoting de comillas dobles en `cmd /c` rompe mensajes largos). Borrar archivo temporal después.
- NO commitear archivos `tmp_*`, `.env.local`, credenciales. Limpiar temporales al final.

## Contexto del proyecto
- Aplicación Next.js 14.2.5.
- App Router y TypeScript estricto.
- Rama principal: `principal`.
- Hosting y despliegue: Vercel.
- Base de datos y autenticación: Supabase.
- Catálogo público:
  - `/`
  - `/catalogo`
  - `/producto/[slug]`
  - `/contacto`
  - `/rastreo`
  - `/como-comprar`
  - `/politicas`
  - `/checkout`
- El panel `/admin` no debe modificarse ni probarse salvo que el usuario lo solicite expresamente.

## Regla crítica para imágenes
Las imágenes de productos NO se almacenan en Supabase Storage ni dentro del repositorio o Vercel.

Las imágenes son un puente externo:

Google Drive → enlace CDN externo → aplicación web

El código debe utilizar referencias externas como:

`https://lh3.googleusercontent.com/d/ID_DEL_ARCHIVO`

No descargar, copiar, comprimir, convertir, subir ni guardar imágenes localmente.

No usar:

- `wget`
- `curl` para descargar imágenes
- `downloadMedia`
- `pageAssets`
- capturas o archivos locales como sustituto de la imagen original
- imágenes dentro de `public/images` para productos
- Supabase Storage para las fotos del catálogo

Para convertir enlaces compartidos de Google Drive se debe reutilizar:

- `src/lib/drive.ts`
- `getGoogleDriveImageUrl()`
- `src/data/drive-map.ts`

Nunca usar como `src` el enlace de una carpeta completa de Google Drive. Se necesita el enlace directo del archivo o su ID convertido mediante el puente existente.

Las imágenes externas deben evitar el optimizador de Vercel cuando sea posible. Para imágenes remotas de Drive usar `unoptimized` en `next/image` o `<img>` directo, según el componente.

No modificar un enlace de imagen existente sin comprobar antes que pertenece a la referencia correcta.

Si una referencia no tiene carpeta o archivo comprobable en Drive, no inventar una imagen. Informar la referencia y solicitar una fuente válida.

Estado conocido de Drive:

- El catálogo contiene 90 referencias oficiales.
- La carpeta compartida contiene 88 carpetas.
- Faltan las carpetas `558063` y `558066`.
- El código ya contiene enlaces externos para esas dos referencias.
- No reemplazar esas referencias hasta recibir nuevas imágenes o enlaces válidos.

## Supabase
- Supabase contiene datos de productos, precios, stock, textos y configuración.
- Las fotos deben continuar siendo referencias externas.
- No insertar blobs, base64 ni archivos de imagen en Supabase.
- No modificar datos de producción directamente sin autorización expresa.
- No eliminar productos, usuarios, pedidos o configuraciones sin confirmación.
- Nunca imprimir, revelar ni guardar claves, tokens, contraseñas o credenciales.
- Nunca agregar secretos a `AGENTS.md`, al código, commits o logs.
- Las claves deben utilizar variables de entorno.
- La clave de servicio solo puede utilizarse en código servidor protegido.

## Contenido y comportamiento que debe conservarse
- `TEENS` y `HOMBRES` muestran “Próximamente” intencionalmente.
- La categoría `Cargos` puede mostrar un estado vacío intencional.
- El botón “Cargar más” debe conservar el número de productos ya cargados aunque se actualice el catálogo.
- El catálogo debe conservar filtros por categoría, fit y búsqueda.
- Las páginas de producto deben tener galería, tallas, precios y enlace para volver al catálogo.
- Las referencias inexistentes deben mostrar una página 404 clara en español.
- El rastreo debe validar el formato de guía antes de consultar la transportadora.
- Los formularios deben validar todos los campos obligatorios, incluida ciudad y tipo de documento.
- No enviar formularios reales de contacto, pedidos o leads durante las pruebas.
- Los datos de correo, teléfono, dirección y horarios deben ser consistentes entre portada, contacto y footer. Si existe duda sobre cuál dato comercial es correcto, preguntar antes de cambiarlo.

## Desarrollo y pruebas
Después de cada cambio relevante ejecutar:

```bash
npm run build
git diff --check
```

Cuando sea necesario probar visualmente:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Verificar:

- rutas públicas principales;
- navegación del header y footer;
- filtros y búsqueda;
- “Cargar más”;
- detalle de producto;
- galería de imágenes;
- carrito sin enviar pedidos;
- formulario sin transmitir datos;
- rastreo con datos inválidos;
- página 404;
- vista móvil;
- ausencia de errores de consola;
- que las imágenes de Drive no utilicen `/_next/image` cuando deban cargarse directamente.

No considerar una advertencia de imagen lazy-loading como bug sin confirmar que la imagen realmente no carga.

## Cambios de código
- Respetar los cambios existentes del usuario.
- No sobrescribir trabajo ajeno.
- Mantener TypeScript estricto.
- Reutilizar helpers existentes.
- Evitar duplicar lógica.
- Preferir cambios pequeños y reversibles.
- No modificar la arquitectura de Supabase, Vercel o Drive sin explicar el impacto.
- No actualizar dependencias importantes sin autorización.
- No ejecutar comandos destructivos como:
  - `git reset --hard`
  - `git checkout --`
  - eliminaciones recursivas
  - borrar carpetas amplias del proyecto

## Git y producción
- Crear commits descriptivos en español o inglés claro.
- Nunca incluir secretos, `.env`, imágenes descargadas ni archivos temporales.
- Antes del commit revisar `git diff --cached`.
- No hacer `push`, redeploy o cambios en producción salvo que el usuario lo solicite expresamente.
- Después de un push, verificar:
  - hash del commit;
  - rama remota;
  - despliegue de Vercel;
  - ruta pública afectada.

## Respuesta final obligatoria
Al terminar cada tarea informar:

1. Qué se corrigió.
2. Qué archivos se modificaron.
3. Qué pruebas se ejecutaron.
4. Si se descargaron o no imágenes.
5. Si se modificó o no Supabase.
6. Si se hizo o no push/redeploy.
7. Cualquier problema pendiente o decisión que requiera al usuario.

Responder siempre en español, con lenguaje claro y sin ocultar limitaciones.
