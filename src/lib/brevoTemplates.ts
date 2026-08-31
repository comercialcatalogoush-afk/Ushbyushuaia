function esc(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const navy = '#1b2333';
const pink = '#d88193';
const pale = '#fff5f7';
const defaultSiteUrl = 'https://ushbyushuaia-catalogo-mayorista.vercel.app';

function emailLayout(input: { preheader: string; eyebrow: string; title: string; content: string; cta?: { label: string; url: string } }) {
  const cta = input.cta ? `<p style="margin:28px 0 8px;text-align:center"><a href="${esc(input.cta.url)}" style="background:${pink};border-radius:6px;color:#ffffff;display:inline-block;font-size:13px;font-weight:700;letter-spacing:.6px;padding:15px 24px;text-decoration:none;text-transform:uppercase">${esc(input.cta.label)}</a></p>` : '';
  const siteOrigin = input.cta ? new URL(input.cta.url, defaultSiteUrl).origin : defaultSiteUrl;
  const logoUrl = `${siteOrigin}/images/ush-logo.jpg`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#f5f6f8;margin:0;padding:0;color:${navy};font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(input.preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:620px;overflow:hidden"><tr><td style="background:${navy};padding:23px 30px 21px;text-align:center"><img src="${esc(logoUrl)}" alt="USH BY USHUAIA" width="58" height="58" style="display:block;margin:0 auto 12px;border:2px solid ${pink};border-radius:50%;object-fit:contain;background:#ffffff"><div style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:2px">USH <span style="color:#f3b3c0">BY USHUAIA</span></div><div style="color:#d7dbe4;font-size:10px;font-weight:700;letter-spacing:2px;margin-top:5px;text-transform:uppercase">Catálogo mayorista</div></td></tr><tr><td style="border-top:5px solid ${pink};padding:32px 30px 28px"><div style="color:${pink};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${esc(input.eyebrow)}</div><h1 style="color:${navy};font-size:27px;line-height:1.15;margin:10px 0 18px">${esc(input.title)}</h1>${input.content}${cta}</td></tr><tr><td style="background:${pale};border-top:1px solid #f0dce1;padding:20px 30px;text-align:center"><p style="color:${navy};font-size:12px;font-weight:700;margin:0">Tu boutique cuenta con nosotros 💗</p><p style="color:#6b7280;font-size:11px;line-height:1.5;margin:7px 0 0">USH BY USHUAIA · Itagüí, Antioquia · Colombia</p><p style="color:#9ca3af;font-size:10px;line-height:1.5;margin:9px 0 0">Recibes este correo por una acción realizada en nuestro catálogo. Puedes gestionar tus preferencias de marketing desde Brevo.</p></td></tr></table></td></tr></table></body></html>`;
}

export function welcomeEmail(name: string, catalogUrl: string) {
  const firstName = (name || 'cliente').trim().split(/\s+/)[0];
  const content = `<p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0">Hola <strong style="color:${navy}">${esc(firstName)}</strong>, qué alegría tenerte aquí. Tu cuenta mayorista ya está lista para ayudarte a comprar mejor.</p><div style="background:${pale};border-left:4px solid ${pink};margin:22px 0;padding:17px 18px"><p style="color:${navy};font-size:13px;font-weight:700;margin:0 0 10px">Ahora puedes disfrutar de</p><p style="color:#4b5563;font-size:12px;line-height:1.7;margin:0">✓ Repetir pedidos anteriores en segundos<br>✓ Guardar referencias, colores y tallas para recibir avisos<br>✓ Consultar tu historial desde cualquier dispositivo</p></div><p style="color:#4b5563;font-size:13px;line-height:1.7;margin:0">Cuando haya una reposición importante para ti, te avisaremos para que puedas surtir tu boutique con más tranquilidad y rapidez.</p>`;
  return emailLayout({ preheader: 'Tu cuenta mayorista ya está activa.', eyebrow: 'Bienvenido a la comunidad mayorista', title: 'Estamos felices de tenerte', content, cta: { label: 'Explorar catálogo', url: catalogUrl } });
}

export function orderConfirmationEmail(order: any, catalogUrl: string) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const rows = items.map((item: any) => `<tr><td style="border-bottom:1px solid #eeeeee;padding:10px 0"><strong style="color:${navy};font-size:12px">REF. ${esc(item.reference || item.product_id || '—')}</strong><br><span style="color:#6b7280;font-size:11px">${esc(item.name || 'Prenda')}${item.color ? ` · ${esc(item.color)}` : ''}${item.size ? ` · Talla ${esc(item.size)}` : ''} · ${esc(item.quantity || 0)} und</span></td><td align="right" style="border-bottom:1px solid #eeeeee;color:${navy};font-size:12px;font-weight:700;padding:10px 0">$ ${new Intl.NumberFormat('es-CO').format(Math.round(Number(item.unit_price || 0) * Number(item.quantity || 0)))}</td></tr>`).join('');
  const content = `<p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0">Hola <strong style="color:${navy}">${esc(String(order?.customer_name || 'cliente').split('/')[0].trim())}</strong>, muchas gracias. Recibimos tu pedido y ya está en revisión.</p><div style="background:${pale};margin:22px 0;padding:16px 18px"><p style="color:${pink};font-size:11px;font-weight:700;letter-spacing:1px;margin:0 0 5px;text-transform:uppercase">Pedido #${esc(order?.id || '—')}</p><p style="color:#6b7280;font-size:11px;margin:0">Fecha: ${esc(order?.order_date || new Date().toISOString().slice(0, 10))}</p></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table><p style="border-top:2px solid ${navy};color:${navy};font-size:16px;font-weight:900;margin:15px 0 0;padding-top:13px;text-align:right">Total: $ ${new Intl.NumberFormat('es-CO').format(Math.round(Number(order?.total || 0)))}</p><p style="color:#6b7280;font-size:12px;line-height:1.6;margin:20px 0 0">Nuestro equipo te contactará para confirmar disponibilidad, pago y despacho. Gracias por confiar en USH BY USHUAIA; conserva este correo como comprobante de recepción.</p>`;
  return emailLayout({ preheader: `Recibimos tu pedido #${order?.id || ''}.`, eyebrow: 'Pedido recibido', title: '¡Gracias por confiar en nosotros!', content, cta: { label: 'Ver catálogo', url: catalogUrl } });
}
