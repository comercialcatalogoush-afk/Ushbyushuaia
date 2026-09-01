# Pendiente del catálogo PDF para mayoristas

## Decisión tomada (2026-09-01)

- **Implementación definitiva: unificar las dos en una.** `src/app/catalogo-digital` es la
  página del catálogo digital y **reutiliza el generador editorial** `generateLookbookPdf` de
  `src/lib/lookbookPdf.ts` (el mismo de `LookbookPdfEditor`/admin y de `/contenido-audiovisual`).
  Se eliminó el generador inline con jsPDF propio del digital.
- Se añadió el modo `wholesale` (precio mayorista) al generador compartido para conservar los
  cuatro modos del digital (mayorista, e-commerce, personalizado, sin precios).
- Imágenes del digital: las `<Image>` ahora usan `unoptimized` para URLs externas porque el
  optimizador de Vercel (`/_next/image`) devuelve HTTP 402 con las imágenes de Google Drive.

## Trabajo que falta

1. Probar visualmente el PDF descargado del digital (completo, selección y los cuatro modos de precio).
2. Verificar en producción con una cuenta registrada y con el administrador después del despliegue.

## Límites que se deben conservar

- No crear otra página de catálogo.
- No modificar la página pública ni las imágenes del catálogo.
- No descargar ni almacenar permanentemente las fotos.
- No crear APIs, buckets ni tablas nuevas para generar el PDF.
- No hacer commit o push adicional sin revisar primero el PDF resultante.