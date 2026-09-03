# AGENTS.md — Reglas permanentes del proyecto Ush By Ushuaia

## Memoria obligatoria
- ANTES de CUALQUIER acción (leer, editar, ejecutar comandos, responder al usuario),
  consulta **MEMORIA.md** en la raíz del proyecto. Es la memoria persistente del proyecto.
- Todos los comentarios de código en **español**.
- Si haces cambios relevantes, actualiza **MEMORIA.md** al final del turno.

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
