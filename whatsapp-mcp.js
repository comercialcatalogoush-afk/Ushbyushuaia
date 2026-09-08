// Servidor MCP (stdio) para operar el WhatsApp de Ush By Ushuaia.
// Lee las bases del bridge (messages.db y whatsapp.db) con node:sqlite (Node >= 22.5)
// y envía mensajes vía el REST API del bridge en http://localhost:8080/api.
// Protocolo: MCP over stdio (JSON-RPC 2.0, una línea JSON por mensaje).
const nodeSqlite = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const STORE = process.env.WHATSAPP_STORE_DIR || path.join(__dirname, '..', '..', 'WINDOWS', 'system32', 'whatsapp-mcp', 'whatsapp-bridge', 'store');
// Limpieza: si la ruta derivada no existe, probar la ruta absoluta canónica del bridge.
const FALLBACKS = [
  STORE,
  'C:/Windows/System32/whatsapp-mcp/whatsapp-bridge/store',
  'C:/WINDOWS/system32/whatsapp-mcp/whatsapp-bridge/store',
];
const BRIDGE = process.env.WHATSAPP_API_URL || 'http://localhost:8080/api';

function findStore() {
  for (const p of FALLBACKS) {
    if (fs.existsSync(path.join(p, 'messages.db'))) return p;
  }
  return null;
}
const STORE_DIR = findStore();
const MESSAGES_DB = STORE_DIR ? path.join(STORE_DIR, 'messages.db') : null;
const WHATSAPP_DB = STORE_DIR ? path.join(STORE_DIR, 'whatsapp.db') : null;

function openMessages() {
  return new nodeSqlite.DatabaseSync(MESSAGES_DB, { readOnly: true });
}
function openWhatsapp() {
  return new nodeSqlite.DatabaseSync(WHATSAPP_DB, { readOnly: true });
}

// ---- Acceso a datos del bridge ----
function listChats(query, limit = 20, page = 0, includeLast = true, sortBy = 'last_active') {
  const db = openMessages();
  const order = sortBy === 'name' ? 'ORDER BY c.name COLLATE NOCASE' : 'ORDER BY c.last_message_time DESC';
  let where = 'WHERE 1=1';
  const whereParams = [];
  if (query) { where = 'WHERE (c.name LIKE ? OR c.jid LIKE ?)'; whereParams.push(`%${query}%`, `%${query}%`); }
  const rows = db.prepare(`SELECT c.jid, c.name, c.last_message_time
      FROM chats c ${where} ${order} LIMIT ? OFFSET ?`).all(...whereParams, limit, page * limit);
  const lids = new Map();
  let lidRows = [];
  try {
    const w = openWhatsapp();
    lidRows = w.prepare('SELECT lid, pn FROM whatsmeow_lid_map').all();
    w.close();
  } catch (e) { /* lid map no disponible */ }
  for (const r of lidRows) lids.set(r.lid, r.pn);
  const chats = rows.map((c) => {
    const m = /^([0-9]+)@lid$/.exec(c.jid);
    const phone = m && lids.get(m[1]) ? lids.get(m[1]) : null;
    return { jid: c.jid, name: c.name, last_active: c.last_message_time, phone };
  });
  let total;
  if (query) total = db.prepare('SELECT COUNT(*) c FROM chats c WHERE (c.name LIKE ? OR c.jid LIKE ?)').get(`%${query}%`, `%${query}%`).c;
  else total = db.prepare('SELECT COUNT(*) c FROM chats').get().c;
  db.close();
  let out = chats;
  if (includeLast) {
    out = chats.map((ch) => {
      const last = getLastInteraction(ch.jid);
      return { ...ch, last_message: last };
    });
  }
  return { chats: out, total, limit, page };
}

function listMessages(opts = {}) {
  const db = openMessages();
  const conds = [];
  const params = [];
  function add(cond, val) { if (val !== undefined && val !== null && val !== '') { conds.push(cond); params.push(val); } }
  add('chat_jid = ?', opts.chat_jid);
  add('sender LIKE ?', opts.sender_phone_number ? `%${opts.sender_phone_number}%` : null);
  add('content LIKE ?', opts.query ? `%${opts.query}%` : null);
  if (opts.after) { conds.push("timestamp >= ?"); params.push(opts.after); }
  if (opts.before) { conds.push("timestamp <= ?"); params.push(opts.before); }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const limit = Math.max(1, opts.limit || 20);
  const page = Math.max(0, opts.page || 0);
  const rows = db.prepare(`SELECT id, chat_jid, sender, content, timestamp, is_from_me, media_type, filename
      FROM messages ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(...params, limit, page * limit);
  db.close();
  return { messages: rows, count: rows.length };
}

function searchContacts(query) {
  const db = openWhatsapp();
  const like = `%${query}%`;
  let rows = [];
  try {
    rows = db.prepare(`SELECT their_jid, first_name, full_name, push_name, business_name, redacted_phone
        FROM whatsmeow_contacts
        WHERE full_name LIKE ? OR first_name LIKE ? OR business_name LIKE ? OR their_jid LIKE ?
        ORDER BY full_name LIMIT 50`).all(like, like, like, like);
  } catch (e) { rows = []; }
  const lids = db.prepare('SELECT lid, pn FROM whatsmeow_lid_map').all();
  db.close();
  const pnOfLid = new Map();
  for (const l of lids) pnOfLid.set(l.lid, l.pn);
  const fromContacts = rows.map((c) => {
    const m = /^([0-9]+)@lid$/.exec(c.their_jid);
    const pn = (m && pnOfLid.get(m[1])) || c.redacted_phone || null;
    return { jid: c.their_jid, name: c.full_name || c.push_name || c.first_name || c.business_name, phone: pn, business_name: c.business_name, redacted_phone: c.redacted_phone, source: 'contacts' };
  }).filter((c) => c.name || c.phone);
  // Búsqueda complementaria sobre chats (nombres y números del último mensaje)
  const cdb = openMessages();
  let chatRows = [];
  try {
    chatRows = cdb.prepare('SELECT jid, name, last_message_time FROM chats WHERE name LIKE ? OR jid LIKE ? ORDER BY last_message_time DESC LIMIT 50').all(like, like);
  } catch (e) { chatRows = []; }
  cdb.close();
  const fromChats = chatRows.map((c) => {
    const m = /^([0-9]+)@lid$/.exec(c.jid);
    const pn = (m && pnOfLid.get(m[1])) || (c.name && /^\d+$/.test(c.name) ? c.name : null) || null;
    return { jid: c.jid, name: c.name, phone: pn, business_name: null, redacted_phone: null, last_active: c.last_message_time, source: 'chats' };
  }).filter((c) => c.name !== c.jid);
  const seen = new Set();
  const merged = [];
  for (const item of [...fromContacts, ...fromChats]) {
    const key = item.jid + '|' + item.phone;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, 50);
}

function getDirectChatByContact(senderPhone) {
  const db = openMessages();
  const row = db.prepare('SELECT jid, name, last_message_time FROM chats WHERE jid LIKE ? ORDER BY last_message_time DESC LIMIT 1').get(`%${senderPhone}%`);
  db.close();
  if (!row) return { found: false };
  return { found: true, jid: row.jid, name: row.name, last_active: row.last_message_time };
}

function getLastInteraction(jid) {
  const db = openMessages();
  const row = db.prepare('SELECT content, timestamp, is_from_me, sender FROM messages WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT 1').get(jid);
  db.close();
  if (!row) return null;
  return { content: row.content, timestamp: row.timestamp, is_from_me: !!row.is_from_me, sender: row.sender };
}

function resolveRecipient(recipient) {
  // Ya es un JID completo (@s.whatsapp.net o @g.us)
  if (recipient.includes('@')) return recipient;
  // Formato colombiano normalizado
  let digits = recipient.replace(/\D+/g, '');
  if (digits.length > 10) return digits;
  return digits;
}

async function sendViaBridge(recipient, message, mediaPath) {
  const r = resolveRecipient(recipient);
  const body = { recipient: r, message: message || '', media_path: mediaPath || '' };
  const res = await fetch(BRIDGE + '/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { success: false, message: (data && data.message) || `HTTP ${res.status}` };
  return data;
}

// ---- Rutina inicial (health + conteos) ----
function initCheck() {
  let health = null;
  let chatCount = 0;
  let msgCount = 0;
  let bridgeOk = false;
  try { const db = openMessages(); chatCount = db.prepare('SELECT COUNT(*) c FROM chats').get().c; msgCount = db.prepare('SELECT COUNT(*) c FROM messages').get().c; db.close(); } catch (e) { /* */ }
  return { store_dir: STORE_DIR, messages_db: !!MESSAGES_DB, whatsapp_db: !!WHATSAPP_DB, chats: chatCount, messages: msgCount, bridge: STORE_DIR ? 'ok' : 'missing' };
}

// ================= Protocolo MCP (stdio, JSON-RPC 2.0) =================
const tools = [
  {
    name: 'list_chats',
    description: 'Lista los chats de WhatsApp del negocio (cada chat incluye jid, nombre, último mensaje y teléfono cuando se puede resolver).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Texto a buscar por nombre o jid' },
        limit: { type: 'number', description: 'Máximo de chats (default 20)' },
        page: { type: 'number', description: 'Página (default 0)' },
        include_last_message: { type: 'boolean', description: 'Incluir el último mensaje de cada chat (default true)' },
        sort_by: { type: 'string', enum: ['last_active', 'name'], description: 'Orden (default last_active)' },
      },
    },
  },
  {
    name: 'list_messages',
    description: 'Busca mensajes en el historial (después de cierta fecha, de un remitente, de un chat, o por texto).',
    inputSchema: {
      type: 'object',
      properties: {
        after: { type: 'string', description: 'Fecha ISO (YYYY-MM-DD) desde la cual buscar' },
        before: { type: 'string', description: 'Fecha ISO (YYYY-MM-DD) hasta la cual buscar' },
        sender_phone_number: { type: 'string', description: 'Número de teléfono del remitente' },
        chat_jid: { type: 'string', description: 'JID del chat' },
        query: { type: 'string', description: 'Texto a buscar en el contenido' },
        limit: { type: 'number', description: 'Máximo de mensajes (default 20)' },
        page: { type: 'number', description: 'Página (default 0)' },
      },
    },
  },
  {
    name: 'search_contacts',
    description: 'Busca contactos por nombre o número de teléfono.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  {
    name: 'get_direct_chat_by_contact',
    description: 'Obtiene el chat de un contacto a partir de su número de teléfono.',
    inputSchema: { type: 'object', properties: { sender_phone_number: { type: 'string' } }, required: ['sender_phone_number'] },
  },
  {
    name: 'get_last_interaction',
    description: 'Obtiene el último mensaje de un chat dado su JID.',
    inputSchema: { type: 'object', properties: { jid: { type: 'string' } }, required: ['jid'] },
  },
  {
    name: 'send_message',
    description: 'Envía un mensaje de texto de WhatsApp a un número (solo dígitos, con código de país, sin +) o a un JID de grupo.',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: { type: 'string', description: 'Número, p. ej. 573011393902, o JID de grupo' },
        message: { type: 'string', description: 'Texto del mensaje' },
      },
      required: ['recipient', 'message'],
    },
  },
  {
    name: 'send_file',
    description: 'Envía un archivo (imagen, audio, video o documento) por WhatsApp.',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: { type: 'string', description: 'Número o JID de grupo' },
        media_path: { type: 'string', description: 'Ruta absoluta del archivo a enviar' },
        caption: { type: 'string', description: 'Texto de acompañamiento' },
      },
      required: ['recipient', 'media_path'],
    },
  },
  {
    name: 'whatsapp_status',
    description: 'Estado de la conexión: ruta de bases, conteo de chats/mensajes y si el store está accesible.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let idCounter = 1000;

function respond(msg, result, isError = false) {
  const obj = { jsonrpc: '2.0', id: msg.id, result };
  if (isError) obj.error = { code: -32000, message: typeof result === 'string' ? result : 'Error de ejecución' };
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function notify(msg) {
  const obj = { jsonrpc: '2.0', method: msg.method || 'notifications/message', params: msg.params || {} };
  process.stdout.write(JSON.stringify(obj) + '\n');
}

async function executeTool(name, args) {
  switch (name) {
    case 'whatsapp_status': {
      const s = initCheck();
      return { content: [{ type: 'text', text: JSON.stringify(s, null, 2) }] };
    }
    case 'list_chats': {
      const a = args || {};
      const out = listChats(a.query, a.limit, a.page, a.include_last_message !== false, a.sort_by);
      return { content: [{ type: 'text', text: JSON.stringify(out) }] };
    }
    case 'list_messages': {
      const a = args || {};
      const out = listMessages(a);
      return { content: [{ type: 'text', text: JSON.stringify(out) }] };
    }
    case 'search_contacts': {
      const out = searchContacts((args || {}).query || '');
      return { content: [{ type: 'text', text: JSON.stringify({ contacts: out }) }] };
    }
    case 'get_direct_chat_by_contact': {
      const out = getDirectChatByContact((args || {}).sender_phone_number || '');
      return { content: [{ type: 'text', text: JSON.stringify(out) }] };
    }
    case 'get_last_interaction': {
      const out = getLastInteraction((args || {}).jid || '');
      return { content: [{ type: 'text', text: JSON.stringify(out) }] };
    }
    case 'send_message': {
      const a = args || {};
      if (!a.recipient || !a.message) return { content: [{ type: 'text', text: JSON.stringify({ success: false, message: 'recipient y message son obligatorios' }) }] };
      const r = await sendViaBridge(a.recipient, a.message, null);
      return { content: [{ type: 'text', text: JSON.stringify(r) }] };
    }
    case 'send_file': {
      const a = args || {};
      if (!a.recipient || !a.media_path) return { content: [{ type: 'text', text: JSON.stringify({ success: false, message: 'recipient y media_path son obligatorios' }) }] };
      const p = a.media_path;
      const abs = typeof p === 'string' && p.includes(':') ? p : path.resolve(p);
      if (!fs.existsSync(abs)) return { content: [{ type: 'text', text: JSON.stringify({ success: false, message: `No existe el archivo: ${abs}` }) }] };
      const r = await sendViaBridge(a.recipient, a.caption || '', abs);
      return { content: [{ type: 'text', text: JSON.stringify(r) }] };
    }
    default:
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, message: `Herramienta desconocida: ${name}` }) }] };
  }
}

rl.on('close', () => { process.exit(0); });

rl.on('line', async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch (e) { return; }
  const method = msg.method;
  if (method === 'initialize') {
    respond(msg, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'whatsapp-ush', version: '1.0.0' },
    });
  } else if (method === 'notifications/initialized') {
    // sin respuesta
  } else if (method === 'ping') {
    respond(msg, {});
  } else if (method === 'tools/list') {
    respond(msg, { tools });
  } else if (method === 'tools/call') {
    try {
      const out = await executeTool(msg.params.name, msg.params.arguments || {});
      respond(msg, out);
    } catch (e) {
      respond(msg, { content: [{ type: 'text', text: JSON.stringify({ success: false, message: e.message || String(e) }) }] });
    }
  } else {
    // Respuesta a un id que enviamos (no necesitamos en el lado servidor)
    if (msg.id !== undefined) respond(msg, {});
  }
});