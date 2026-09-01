# Pendiente del catálogo PDF para mayoristas

## Estado que queda guardado

- La funcionalidad vive en `src/app/catalogo-digital` y conserva el catálogo digital existente.
- El acceso está restringido a usuarios con sesión y al administrador.
- El cliente puede descargar el catálogo completo o únicamente las referencias seleccionadas.
- La descarga exige confirmación previa y no usa la ventana de impresión del navegador.
- Los modos disponibles son: precio mayorista, precio e-commerce, sin precios y precio modificable por referencia.
- Las imágenes continúan usando las URLs existentes de Google Drive; no se suben fotos a Supabase Storage ni a Vercel.
- La imagen ya se incrusta en el PDF generado localmente mediante el optimizador existente de Next.js.

## Trabajo que falta

1. Rediseñar únicamente el generador PDF de `LookbookClient.tsx` para que el archivo descargado se parezca al PDF de referencia `CATÁLOGO DIGITAL.pdf`.
2. Usar formato horizontal 16:9, una referencia por página, composición editorial con fotografías y panel de información del producto.
3. Mantener en ese diseño los datos dinámicos: referencias escogidas, nombre, categoría y el modo de precio confirmado.
4. Probar visualmente una referencia, una selección y el catálogo completo; comprobar también los cuatro modos de precio.
5. Verificar en producción con una cuenta registrada y con el administrador después del despliegue.

## Límites que se deben conservar

- No crear otra página de catálogo.
- No modificar la página pública ni las imágenes del catálogo.
- No descargar ni almacenar permanentemente las fotos.
- No crear APIs, buckets ni tablas nuevas para generar el PDF.
- No hacer commit o push adicional sin revisar primero el PDF resultante.
