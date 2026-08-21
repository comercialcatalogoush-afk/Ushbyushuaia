import { supabase, triggerRevalidate } from './supabase';

// ============================================================
// CMS LIGERO DE CONTENIDO (tipo Wix)
// El contenido se guarda en la tabla site_config (key/value) como JSON.
//   - key = page_<pageId>  → JSON plano { campo: valor }
//   - key = theme          → JSON de colores globales
// Cada página define un "schema" de campos editables con defaults.
// ============================================================

export type FieldType = 'text' | 'textarea' | 'color' | 'image' | 'url';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  group: string;
  default: string;
  placeholder?: string;
}

export interface PageSchema {
  id: string;
  label: string;
  description: string;
  fields: FieldDef[];
}

export type ContentValues = Record<string, string>;

// ── GUARDADO LOCAL (caché del navegador) ────────────────────
const CONTENT_CACHE_PREFIX = 'ush_content_';
const THEME_CACHE_KEY = 'ush_theme_cache';

export const CONTENT_EVENT = 'ush_content_updated';
export const THEME_EVENT = 'ush_theme_updated';

// ── ESQUEMAS DE CONTENIDO POR PÁGINA ────────────────────────

export const PAGE_SCHEMAS: PageSchema[] = [
  {
    id: 'home',
    label: 'Inicio',
    description: 'Portada del sitio: hero, barra de confianza, banner de políticas, sección distribuidores y outlet.',
    fields: [
      // Hero
      { key: 'heroBadge', label: 'Texto del badge superior', type: 'text', group: 'Hero', default: 'COLOMBIAN JEANS - CATÁLOGO OFICIAL' },
      { key: 'heroHeadline1', label: 'Título (línea 1)', type: 'text', group: 'Hero', default: 'No cambiamos,' },
      { key: 'heroHeadline2', label: 'Título (línea 2, degradado)', type: 'text', group: 'Hero', default: 'EVOLUCIONAMOS' },
      { key: 'heroSubtitle', label: 'Subtítulo (opcional)', type: 'textarea', group: 'Hero', default: 'Jeans, shorts y faldas en mezclilla rígida de alta confección nacional, con descuentos por volumen para tu negocio.' },
      { key: 'heroCta1Text', label: 'Botón 1 — texto', type: 'text', group: 'Hero', default: 'VER CATÁLOGO MAYORISTA' },
      { key: 'heroCta1Link', label: 'Botón 1 — enlace', type: 'url', group: 'Hero', default: '/catalogo' },
      { key: 'heroCta2Text', label: 'Botón 2 — texto', type: 'text', group: 'Hero', default: 'Solicitar Asesoría' },
      { key: 'heroCta2Link', label: 'Botón 2 — enlace', type: 'url', group: 'Hero', default: '/contacto' },
      { key: 'heroImage', label: 'Imagen de fondo', type: 'image', group: 'Hero', default: '/images/official-cover.jpg' },
      { key: 'heroGradient1', label: 'Degradado título — color 1', type: 'color', group: 'Hero', default: '#ffffff' },
      { key: 'heroGradient2', label: 'Degradado título — color 2', type: 'color', group: 'Hero', default: '#fecdd3' },
      { key: 'heroGradient3', label: 'Degradado título — color 3', type: 'color', group: 'Hero', default: '#fef3c7' },
      { key: 'heroOverlayFrom', label: 'Overlay — color inicial', type: 'color', group: 'Hero', default: '#b5586c' },
      { key: 'heroOverlayVia', label: 'Overlay — color central', type: 'color', group: 'Hero', default: '#d88193' },

      // Barra de confianza
      { key: 'trust1Label', label: 'Item 1 — título', type: 'text', group: 'Barra de confianza', default: 'Garantía 45 días' },
      { key: 'trust1Sub', label: 'Item 1 — subtítulo', type: 'text', group: 'Barra de confianza', default: 'En defectos de calidad' },
      { key: 'trust2Label', label: 'Item 2 — título', type: 'text', group: 'Barra de confianza', default: 'Envío Gratis' },
      { key: 'trust2Sub', label: 'Item 2 — subtítulo', type: 'text', group: 'Barra de confianza', default: 'Pedidos de 12+ unidades' },
      { key: 'trust3Label', label: 'Item 3 — título', type: 'text', group: 'Barra de confianza', default: 'Cambios 15 días' },
      { key: 'trust3Sub', label: 'Item 3 — subtítulo', type: 'text', group: 'Barra de confianza', default: 'Satisfacción garantizada' },
      { key: 'trust4Label', label: 'Item 4 — título', type: 'text', group: 'Barra de confianza', default: 'Confección Nacional' },
      { key: 'trust4Sub', label: 'Item 4 — subtítulo', type: 'text', group: 'Barra de confianza', default: 'Itagüí, Antioquia' },

      // Banner políticas
      { key: 'policiesEyebrow', label: 'Banner — etiqueta superior', type: 'text', group: 'Banner políticas', default: 'Transparencia y Confianza' },
      { key: 'policiesTitle', label: 'Banner — título', type: 'text', group: 'Banner políticas', default: 'Cambios · Garantías · Devoluciones · Envíos' },
      { key: 'policiesText', label: 'Banner — descripción', type: 'textarea', group: 'Banner políticas', default: 'Consulta nuestras políticas oficiales de cambios (15 días), garantía (45 días), derecho de retracto y política de envíos a todo Colombia.' },
      { key: 'policiesButtonText', label: 'Banner — texto botón', type: 'text', group: 'Banner políticas', default: 'Ver Políticas Completas →' },
      { key: 'policiesButtonLink', label: 'Banner — enlace botón', type: 'url', group: 'Banner políticas', default: '/politicas' },

      // Distribuidores
      { key: 'distEyebrow', label: 'Distribuidores — etiqueta', type: 'text', group: 'Distribuidores', default: 'Atención a Distribuidores' },
      { key: 'distTitle', label: 'Distribuidores — título', type: 'textarea', group: 'Distribuidores', default: '¿Buscas despachos continuos para tu negocio o boutique?' },
      { key: 'distText', label: 'Distribuidores — descripción', type: 'textarea', group: 'Distribuidores', default: 'Trabajamos de la mano con comerciantes de toda Colombia. Te brindamos asesoría directa en la selección de referencias con mayor rotación y logística de envío segura desde Itagüí, Antioquia.' },
      { key: 'distFeat1Title', label: 'Ventaja 1 — título', type: 'text', group: 'Distribuidores', default: 'Envíos Nacionales' },
      { key: 'distFeat1Text', label: 'Ventaja 1 — descripción', type: 'text', group: 'Distribuidores', default: 'Coordinación con tu empresa transportadora preferida.' },
      { key: 'distFeat2Title', label: 'Ventaja 2 — título', type: 'text', group: 'Distribuidores', default: 'Mezclilla Premium' },
      { key: 'distFeat2Text', label: 'Ventaja 2 — descripción', type: 'text', group: 'Distribuidores', default: 'Telas rígidas y acabados de alta confección nacional.' },

      // Beneficios (componente compartido con Cómo Comprar)
      { key: 'benefitsEyebrow', label: 'Beneficios — etiqueta', type: 'text', group: 'Beneficios', default: 'Ventajas para Mayoristas' },
      { key: 'benefitsTitle', label: 'Beneficios — título', type: 'text', group: 'Beneficios', default: 'Beneficios Mayoristas' },
      { key: 'benefitsSub', label: 'Beneficios — subtítulo', type: 'text', group: 'Beneficios', default: 'Ventajas competitivas para impulsar tu negocio' },
      { key: 'benefitsCard1Title', label: 'Tarjeta 1 — título', type: 'text', group: 'Beneficios', default: 'Prendas a Mayorista' },
      { key: 'benefitsCard1Text', label: 'Tarjeta 1 — descripción', type: 'textarea', group: 'Beneficios', default: 'Descuentos exclusivos en precios de volumen para su negocio.' },
      { key: 'benefitsCard2Title', label: 'Tarjeta 2 — título', type: 'text', group: 'Beneficios', default: 'Descuentos por Volumen' },
      { key: 'benefitsCard2Text', label: 'Tarjeta 2 — descripción', type: 'textarea', group: 'Beneficios', default: 'Mejor escala de precios desde 12 unidades por referencia elegida.' },
      { key: 'benefitsCard3Title', label: 'Tarjeta 3 — título', type: 'text', group: 'Beneficios', default: 'Compra por Referencia' },
      { key: 'benefitsCard3Text', label: 'Tarjeta 3 — descripción', type: 'textarea', group: 'Beneficios', default: 'Seleccione cantidades específicas de cada referencia.' },
      { key: 'benefitsCard4Title', label: 'Tarjeta 4 — título', type: 'text', group: 'Beneficios', default: 'Atención Personalizada' },
      { key: 'benefitsCard4Text', label: 'Tarjeta 4 — descripción', type: 'textarea', group: 'Beneficios', default: 'Asesoría exclusiva para su logística y pedidos.' },
    ],
  },
  {
    id: 'outlet',
    label: 'Outlet',
    description: 'Sección de ubicación, horarios y contacto del punto de venta.',
    fields: [
      { key: 'outletEyebrow', label: 'Etiqueta superior', type: 'text', group: 'Encabezado', default: 'Visítanos' },
      { key: 'outletTitle', label: 'Título', type: 'text', group: 'Encabezado', default: 'Nuestro Outlet' },
      { key: 'outletEm', label: 'Palabra destacada', type: 'text', group: 'Encabezado', default: 'Outlet' },
      { key: 'outletName', label: 'Nombre del punto', type: 'text', group: 'Tarjeta principal', default: 'Outlet USH BY USHUAIA' },
      { key: 'outletTag', label: 'Etiqueta del punto', type: 'text', group: 'Tarjeta principal', default: 'Principal · Atención Mayorista' },
      { key: 'outletAddress', label: 'Dirección', type: 'text', group: 'Tarjeta principal', default: 'Cll. 85 Sur #50-72, Itagüí, Antioquia' },
      { key: 'outletSchedule', label: 'Horario', type: 'text', group: 'Tarjeta principal', default: 'Lunes a Viernes: 8:00 AM – 5:30 PM' },
      { key: 'outletScheduleNote', label: 'Nota de horario', type: 'text', group: 'Tarjeta principal', default: 'Sábados, domingos y festivos no hay atención presencial.' },
      { key: 'outletMapUrl', label: 'Enlace al mapa', type: 'url', group: 'Tarjeta principal', default: 'https://maps.google.com/?q=Cll+85+Sur+%2350-72,+Itagui' },
      { key: 'outletPhone', label: 'Teléfono', type: 'text', group: 'Tarjeta principal', default: '+57 301 139 3902' },
      { key: 'outletVideoUrl', label: 'URL del video (vacío = pronto)', type: 'url', group: 'Tarjeta principal', default: '' },
      { key: 'outletPoster', label: 'Imagen poster del video', type: 'image', group: 'Tarjeta principal', default: '' },
      { key: 'outletButtonMap', label: 'Botón mapa — texto', type: 'text', group: 'Botones', default: 'Ver en Mapa' },
      { key: 'outletButtonVisit', label: 'Botón visita — texto', type: 'text', group: 'Botones', default: 'Agendar Visita' },
      { key: 'outletOpen', label: 'Horario — apertura', type: 'text', group: 'Horario destacado', default: '8:00 AM' },
      { key: 'outletClose', label: 'Horario — cierre', type: 'text', group: 'Horario destacado', default: '5:30 PM' },
    ],
  },
  {
    id: 'como-comprar',
    label: 'Cómo Comprar',
    description: 'Página de beneficios y proceso de compra mayorista.',
    fields: [
      { key: 'ccEyebrow', label: 'Etiqueta superior', type: 'text', group: 'Encabezado', default: 'Escala & Condiciones' },
      { key: 'ccTitle', label: 'Título principal', type: 'text', group: 'Encabezado', default: 'Beneficios & Cómo Comprar' },
      { key: 'ccIntro', label: 'Párrafo introductorio', type: 'textarea', group: 'Encabezado', default: 'Te ofrecemos un modelo comercial ágil y transparente diseñado especialmente para maximizar el margen de ganancia de tu tienda.' },
      { key: 'ccProcessTitle', label: 'Título del proceso', type: 'text', group: 'Proceso', default: 'Proceso de Compra Mayorista' },
      { key: 'ccProcessSub', label: 'Subtítulo del proceso', type: 'text', group: 'Proceso', default: 'En 4 sencillos pasos' },
      { key: 'ccStep1Title', label: 'Paso 1 — título', type: 'text', group: 'Proceso', default: 'Selecciona tus Referencias' },
      { key: 'ccStep1Text', label: 'Paso 1 — descripción', type: 'textarea', group: 'Proceso', default: 'Navega por nuestro catálogo y elige los productos de tu preferencia (shorts, faldas, jeans wide leg).' },
      { key: 'ccStep2Title', label: 'Paso 2 — título', type: 'text', group: 'Proceso', default: 'Elige Tallas y Cantidades' },
      { key: 'ccStep2Text', label: 'Paso 2 — descripción', type: 'textarea', group: 'Proceso', default: 'Puedes combinar diferentes referencias y desglosar las tallas necesarias para tu negocio. Compra mínima mayorista: 8 a 11 unidades con 20% de descuento; desde 12 unidades aplica el precio mayorista.' },
      { key: 'ccStep3Title', label: 'Paso 3 — título', type: 'text', group: 'Proceso', default: 'Confirma con tu Asesor' },
      { key: 'ccStep3Text', label: 'Paso 3 — descripción', type: 'textarea', group: 'Proceso', default: 'Tramita el pedido en la web o directamente por WhatsApp con nuestro equipo en Itagüí, Antioquia.' },
      { key: 'ccStep4Title', label: 'Paso 4 — título', type: 'text', group: 'Proceso', default: 'Despacho Seguro' },
      { key: 'ccStep4Text', label: 'Paso 4 — descripción', type: 'textarea', group: 'Proceso', default: 'Realizamos el empaque y despacho inmediato mediante la empresa transportadora de tu confianza a cualquier lugar de Colombia.' },
      { key: 'ccCtaText', label: 'Botón CTA — texto', type: 'text', group: 'Proceso', default: 'Ver Productos Disponibles' },
      { key: 'ccCtaLink', label: 'Botón CTA — enlace', type: 'url', group: 'Proceso', default: '/catalogo' },
    ],
  },
  {
    id: 'contacto',
    label: 'Contacto',
    description: 'Página de contacto con datos oficiales y WhatsApp.',
    fields: [
      { key: 'ctEyebrow', label: 'Etiqueta superior', type: 'text', group: 'Encabezado', default: 'Atención al Cliente & Mayoristas' },
      { key: 'ctTitle', label: 'Título principal', type: 'text', group: 'Encabezado', default: 'Ponte en Contacto con Nosotros' },
      { key: 'ctIntro', label: 'Párrafo introductorio', type: 'textarea', group: 'Encabezado', default: 'Estamos listos para resolver tus inquietudes y guiarte en el pedido de tus referencias.' },
      { key: 'ctInfoTitle', label: 'Título de datos', type: 'text', group: 'Datos oficiales', default: 'Información Oficial' },
      { key: 'ctEmail', label: 'Correo electrónico', type: 'text', group: 'Datos oficiales', default: 'info@ushbyushuaia.com.co' },
      { key: 'ctLocation', label: 'Ubicación', type: 'text', group: 'Datos oficiales', default: 'Itagüí, Antioquia - Colombia' },
      { key: 'ctSchedule1', label: 'Horario semana', type: 'text', group: 'Datos oficiales', default: 'Lunes a Viernes: 8:00 AM - 6:00 PM' },
      { key: 'ctSchedule2', label: 'Horario sábado', type: 'text', group: 'Datos oficiales', default: 'Sábados: 8:00 AM - 1:00 PM' },
      { key: 'ctWhatsappTitle', label: 'Título WhatsApp', type: 'text', group: 'WhatsApp', default: 'Atención WhatsApp' },
      { key: 'ctWhatsappText', label: 'Descripción WhatsApp', type: 'textarea', group: 'WhatsApp', default: 'Respuesta inmediata para pedidos urgentes y confirmación de stock.' },
      { key: 'ctWhatsappButton', label: 'Botón — texto', type: 'text', group: 'WhatsApp', default: 'Abrir WhatsApp' },
      { key: 'ctWhatsappMessage', label: 'Mensaje pre-escrito', type: 'textarea', group: 'WhatsApp', default: 'Hola USH BY USHUAIA, quisiera solicitar información mayorista' },
    ],
  },
  {
    id: 'rastreo',
    label: 'Rastreo',
    description: 'Página de seguimiento de envíos.',
    fields: [
      { key: 'trTitle', label: 'Título principal', type: 'text', group: 'Encabezado', default: 'Rastrear mi Pedido' },
      { key: 'trTitleEm', label: 'Palabra destacada', type: 'text', group: 'Encabezado', default: 'mi Pedido' },
      { key: 'trIntro', label: 'Descripción', type: 'textarea', group: 'Encabezado', default: 'Ingresa tu número de guía y sigue el recorrido de tu pedido en tiempo real con actualización automática.' },
      { key: 'trLabel', label: 'Etiqueta del campo', type: 'text', group: 'Formulario', default: 'Número de Guía' },
      { key: 'trPlaceholder', label: 'Placeholder', type: 'text', group: 'Formulario', default: 'Ingresa tu número de guía (11 dígitos)' },
      { key: 'trButton', label: 'Botón — texto', type: 'text', group: 'Formulario', default: 'Rastrear' },
      { key: 'trAutoNote', label: 'Nota de actualización', type: 'text', group: 'Formulario', default: 'El estado se actualiza automáticamente cada 30 segundos.' },
      { key: 'trHelp1Title', label: 'Ayuda 1 — título', type: 'text', group: 'Ayuda', default: '¿Dónde está mi guía?' },
      { key: 'trHelp1Text', label: 'Ayuda 1 — texto', type: 'textarea', group: 'Ayuda', default: 'Tu asesor te la envía por WhatsApp al confirmar el despacho.' },
      { key: 'trHelp2Title', label: 'Ayuda 2 — título', type: 'text', group: 'Ayuda', default: 'Tiempos de entrega' },
      { key: 'trHelp2Text', label: 'Ayuda 2 — texto', type: 'textarea', group: 'Ayuda', default: 'Entrega estimada de 5 a 8 días hábiles en ciudades principales e intermedias, y de 8 a 15 días hábiles en municipios.' },
      { key: 'trHelp3Title', label: 'Ayuda 3 — título', type: 'text', group: 'Ayuda', default: '¿Problemas?' },
      { key: 'trHelp3Text', label: 'Ayuda 3 — texto', type: 'textarea', group: 'Ayuda', default: 'Escríbenos por WhatsApp y te ayudamos de inmediato.' },
    ],
  },
  {
    id: 'catalogo',
    label: 'Catálogo',
    description: 'Encabezado de la página del catálogo completo.',
    fields: [
      { key: 'catTitle', label: 'Título principal', type: 'text', group: 'Encabezado', default: 'Catálogo Completo' },
      { key: 'catTitleEm', label: 'Palabra destacada', type: 'text', group: 'Encabezado', default: 'Completo' },
      { key: 'catIntro', label: 'Descripción', type: 'textarea', group: 'Encabezado', default: 'Explora todas las referencias mayoristas de USH BY USHUAIA. Filtra por categoría y fit para encontrar las prendas ideales para tu boutique.' },
    ],
  },
  {
    id: 'politicas',
    label: 'Políticas',
    description: 'Textos principales de la página de políticas, garantías y envíos.',
    fields: [
      { key: 'plEyebrow', label: 'Etiqueta superior', type: 'text', group: 'Encabezado', default: 'Términos y Políticas Oficiales' },
      { key: 'plTitle', label: 'Título principal', type: 'textarea', group: 'Encabezado', default: 'Políticas de Cambios, Garantías, Envíos y Habeas Data' },
      { key: 'plIntro', label: 'Párrafo introductorio', type: 'textarea', group: 'Encabezado', default: 'En USH BY USHUAIA garantizamos tus derechos como consumidor conforme a la Ley 1480 de 2011, Decreto 587 de 2016 y Ley 1581 de 2012 de la República de Colombia.' },

      { key: 'plShipBadge', label: 'Envíos — badge', type: 'text', group: 'Envíos', default: 'Envíos Nacionales' },
      { key: 'plShipTitle', label: 'Envíos — título', type: 'text', group: 'Envíos', default: '5. POLÍTICA DE ENVÍO' },
      { key: 'plShipText', label: 'Envíos — descripción', type: 'textarea', group: 'Envíos', default: 'En Ush By Ushuaia queremos entregar tu pedido en el menor tiempo posible, por eso nuestra promesa de entrega es de:' },
      { key: 'plShipDaysMain', label: 'Ciudades — días', type: 'text', group: 'Envíos', default: '5 a 8' },
      { key: 'plShipMainLabel', label: 'Ciudades — etiqueta', type: 'text', group: 'Envíos', default: 'Días Hábiles' },
      { key: 'plShipMainScope', label: 'Ciudades — alcance', type: 'text', group: 'Envíos', default: 'Ciudades principales e intermedias' },
      { key: 'plShipDaysOther', label: 'Municipios — días', type: 'text', group: 'Envíos', default: '8 a 15' },
      { key: 'plShipOtherLabel', label: 'Municipios — etiqueta', type: 'text', group: 'Envíos', default: 'Días Hábiles' },
      { key: 'plShipOtherScope', label: 'Municipios — alcance', type: 'text', group: 'Envíos', default: 'Municipios y demás poblaciones' },
      { key: 'plShipNote', label: 'Envíos — nota al pie', type: 'textarea', group: 'Envíos', default: '* Contados a partir del momento en que el consumidor reciba la confirmación de su pedido.' },

      { key: 'plDataBadge', label: 'Habeas Data — badge', type: 'text', group: 'Habeas Data', default: 'Ley 1581 de 2012' },
      { key: 'plDataTitle', label: 'Habeas Data — título', type: 'text', group: 'Habeas Data', default: '6. PRIVACIDAD Y TRATAMIENTO DE DATOS (HABEAS DATA)' },
      { key: 'plDataText', label: 'Habeas Data — descripción', type: 'textarea', group: 'Habeas Data', default: 'En cumplimiento de la Ley 1581 de 2012 y demás normas concordantes, USH BY USHUAIA / USHUAIA JEANS actúa como responsable del tratamiento de los datos personales que usted suministre a través de nuestra tienda web, formularios y canales de atención.' },

      { key: 'plChannelsTitle', label: 'Canales — título', type: 'text', group: 'Canales de atención', default: 'Canales de Atención' },
      { key: 'plChannelsWaSchedule1', label: 'WhatsApp — horario 1', type: 'text', group: 'Canales de atención', default: 'Lunes a jueves: 7:00 a. m. a 4:00 p. m.' },
      { key: 'plChannelsWaSchedule2', label: 'WhatsApp — horario 2', type: 'text', group: 'Canales de atención', default: 'Viernes: 7:00 a. m. a 3:30 p. m.' },
      { key: 'plChannelsEmail', label: 'Correo — dirección', type: 'text', group: 'Canales de atención', default: 'comercialmayoristas@ushuaiajeans.com.co' },
      { key: 'plChannelsAddress', label: 'Punto de despacho', type: 'text', group: 'Canales de atención', default: 'Cll. 85 Sur #50-72, Itagüí, Antioquia — Colombia' },
    ],
  },
  {
    id: 'footer',
    label: 'Pie de Página',
    description: 'Contenido global del pie de página que aparece en todo el sitio.',
    fields: [
      { key: 'footerDescription', label: 'Descripción de la marca', type: 'textarea', group: 'Marca', default: 'Marca líder en confección y distribución mayorista de prendas en mezclilla rígida. Calidad, tendencia y volumen para tiendas y distribuidores en Colombia.' },
      { key: 'footerCopyright', label: 'Texto de copyright', type: 'text', group: 'Marca', default: 'USH BY USHUAIA. Marca Tu Identidad. Todos los derechos reservados.' },

      { key: 'footerNoticeTitle', label: 'Aviso mayorista — título', type: 'text', group: 'Mayoristas', default: 'Atención a Mayoristas' },
      { key: 'footerNoticeText', label: 'Aviso mayorista — texto', type: 'textarea', group: 'Mayoristas', default: 'Escala de precios especiales aplicable a partir de 12 unidades combinadas por pedido. Envío gratis incluido.' },
      { key: 'footerCtaText', label: 'Botón — texto', type: 'text', group: 'Mayoristas', default: 'Pedir Asesoría' },

      { key: 'footerHoursTitle', label: 'Horario — título', type: 'text', group: 'Contacto', default: 'Horario de Atención' },
      { key: 'footerHoursWeek', label: 'Horario — semana', type: 'text', group: 'Contacto', default: '8:00 AM – 5:30 PM' },
      { key: 'footerHoursNote', label: 'Horario — nota', type: 'text', group: 'Contacto', default: 'Sábados, domingos y festivos no hay atención.' },
    ],
  },
];

// ── TEMA GLOBAL (colores de marca) ──────────────────────────
export interface SiteTheme {
  pink: string;
  pinkDark: string;
  pinkHover: string;
  pinkLight: string;
  pinkSoft: string;
  navy: string;
  navyDark: string;
  accent: string;
  bodyBg: string;
  topNoticeText: string;
}

export const DEFAULT_THEME: SiteTheme = {
  pink: '#d88193',
  pinkDark: '#c06579',
  pinkHover: '#b5586c',
  pinkLight: '#fdf3f5',
  pinkSoft: '#f8e4e8',
  navy: '#1b2333',
  navyDark: '#121824',
  accent: '#d88193',
  bodyBg: '#ffffff',
  topNoticeText: '45 DÍAS DE GARANTÍA POR DEFECTOS DE FÁBRICA · 15 DÍAS PARA CAMBIOS · ENVÍO GRATIS DESDE 12 UNIDADES · CONFECCIÓN NACIONAL — ITAGÜÍ, ANTIOQUIA ✦',
};

// ── LECTURA / ESCRITURA EN Supabase ─────────────────────────

const contentKey = (pageId: string) => `page_${pageId}`;

export async function fetchContentFromRemote(pageId: string): Promise<ContentValues | null> {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', contentKey(pageId))
      .maybeSingle();
    if (!error && data?.value) {
      const parsed = JSON.parse(data.value);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.error('Error fetching content', pageId, e);
  }
  return null;
}

export async function fetchThemeFromRemote(): Promise<SiteTheme | null> {
  // En el editor del admin se prioriza el borrador local para preview en vivo.
  const editorLive = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ush_editor_live') === '1';
  if (editorLive && typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(THEME_CACHE_KEY);
      if (cached) return { ...DEFAULT_THEME, ...JSON.parse(cached) };
    } catch (e) {}
  }
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'theme')
      .maybeSingle();
    if (!error && data?.value) {
      const parsed = JSON.parse(data.value);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_THEME, ...parsed };
    }
  } catch (e) {
    console.error('Error fetching theme', e);
  }
  return null;
}

// Valores finales para una página: guardado (nube/caché) + defaults
export function mergeContent(pageId: string, stored: ContentValues | null): ContentValues {
  const schema = PAGE_SCHEMAS.find((s) => s.id === pageId);
  const out: ContentValues = {};
  if (schema) {
    for (const f of schema.fields) out[f.key] = f.default;
  }
  if (stored) {
    for (const [k, v] of Object.entries(stored)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        out[k] = String(v);
      }
    }
  }
  return out;
}

// Lectura para SERVER components (Next server-side)
export async function getPageContentServer(pageId: string): Promise<ContentValues> {
  const stored = await fetchContentFromRemote(pageId);
  return mergeContent(pageId, stored);
}

export async function getThemeServer(): Promise<SiteTheme> {
  const t = await fetchThemeFromRemote();
  return t || DEFAULT_THEME;
}

// Lectura para CLIENT components (con caché local)
export async function getPageContentClient(pageId: string): Promise<ContentValues> {
  let stored: ContentValues | null = null;
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CONTENT_CACHE_PREFIX + pageId);
      if (cached) stored = JSON.parse(cached);
    } catch (e) {}
  }
  // En el editor del admin (sesión "live") se prioriza el borrador local para
  // que el preview refleje los cambios sin publicar.
  const editorLive = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ush_editor_live') === '1';
  if (!editorLive) {
    const remote = await fetchContentFromRemote(pageId);
    if (remote) {
      stored = remote;
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(CONTENT_CACHE_PREFIX + pageId, JSON.stringify(remote)); } catch (e) {}
      }
    }
  }
  return mergeContent(pageId, stored);
}

// Guardado desde el panel admin (requiere sesión autenticada)
export async function savePageContent(pageId: string, values: ContentValues): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('site_config').upsert(
      { key: contentKey(pageId), value: JSON.stringify(values), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) return { success: false, error: error.message };
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(CONTENT_CACHE_PREFIX + pageId, JSON.stringify(values)); } catch (e) {}
      window.dispatchEvent(new Event(CONTENT_EVENT));
    }
    // Reflejo inmediato en el sitio público (purga ISR + edge)
    triggerRevalidate();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function saveTheme(theme: SiteTheme): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('site_config').upsert(
      { key: 'theme', value: JSON.stringify(theme), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) return { success: false, error: error.message };
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme)); } catch (e) {}
      window.dispatchEvent(new Event(THEME_EVENT));
    }
    // Reflejo inmediato en el sitio público (purga ISR + edge)
    triggerRevalidate();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// Aplica el tema en CSS variables del navegador (cliente)
export function applyTheme(theme: SiteTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--ush-pink', theme.pink);
  root.style.setProperty('--ush-pink-dark', theme.pinkDark);
  root.style.setProperty('--ush-pink-hover', theme.pinkHover);
  root.style.setProperty('--ush-pink-light', theme.pinkLight);
  root.style.setProperty('--ush-pink-soft', theme.pinkSoft);
  root.style.setProperty('--ush-navy', theme.navy);
  root.style.setProperty('--ush-navy-dark', theme.navyDark);
  root.style.setProperty('--ush-accent', theme.accent);
  root.style.setProperty('--ush-body-bg', theme.bodyBg);
}

export function isAdminAuthenticated(): Promise<boolean> {
  return supabase.auth.getSession().then(({ data }) => {
    const user = data.session?.user;
    return !!user && !!user.email && user.email.toLowerCase() === 'comercialmayoristas@ushuaiajeans.com.co'.toLowerCase();
  }).catch(() => false);
}