import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';

// Helper to check admin authorization
async function verifyAdmin(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user || data.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

// Cliente con rol de servicio (bypasa RLS): necesario para administrar
// usuarios de auth y borrar datos del cliente (orders/leads/site_config).
function getAdminSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
  if (!serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // 1. Fetch all orders to extract customer info & order history
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (ordersErr) {
      console.error('Error fetching orders for clients:', ordersErr);
    }

    // 2. Fetch wholesale leads (contact forms)
    const { data: leadsData } = await supabase
      .from('wholesale_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    // 2.1 Fetch registered users directly from Supabase Auth (paginado:
    // sin paginación solo llegaba la primera página (~50 usuarios) y los
    // clientes posteriores no aparecían ni podían recibir contraseña).
    let authUsers: any[] = [];
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
    if (serviceRoleKey) {
      try {
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        for (let page = 1; page <= 20; page++) {
          const { data: authData } = await adminSupabase.auth.admin.listUsers({ page, perPage: 200 });
          if (!authData?.users || authData.users.length === 0) break;
          authUsers = authUsers.concat(authData.users);
          if (authData.users.length < 200) break;
        }
      } catch (e) {
        console.warn('Auth admin listUsers notice in GET:', e);
      }
    }
    // (Se eliminó el fallback RPC anónimo get_admin_users: si era ejecutable
    // por cualquiera exponía todos los emails de auth.users con la key pública.)

    // 3. Fetch password requests, client overrides and new registrations from site_config
    const { data: configData } = await supabase
      .from('site_config')
      .select('*')
      .in('key', ['password_reset_requests', 'client_password_records', 'new_user_registrations']);

    let resetRequests: any[] = [];
    let passwordRecords: Record<string, any> = {};
    let newRegistrations: any[] = [];

    configData?.forEach((c) => {
      if (c.key === 'password_reset_requests') {
        try { resetRequests = JSON.parse(c.value); } catch (_) {}
      }
      if (c.key === 'client_password_records') {
        try { passwordRecords = JSON.parse(c.value); } catch (_) {}
      }
      if (c.key === 'new_user_registrations') {
        try { newRegistrations = JSON.parse(c.value); } catch (_) {}
      }
    });

    // 4. Aggregate unique clients by normalized email (or phone/doc if no email)
    const clientsMap = new Map<string, {
      id: string;
      email: string;
      name: string;
      phone: string;
      doc: string;
      city: string;
      department: string;
      address: string;
      orders_count: number;
      total_spent: number;
      orders: any[];
      last_order_date: string | null;
      created_at: string;
      has_pending_reset: boolean;
      last_reset_request: string | null;
      password_assigned_at: string | null;
    }>();

    // Aggregate from orders
    (ordersData || []).forEach((order: any) => {
      const email = (order.customer_email || '').trim().toLowerCase();
      const phone = (order.customer_phone || '').trim();
      const doc = (order.customer_doc || '').trim();
      const key = email || phone || doc || order.id;

      if (!clientsMap.has(key)) {
        clientsMap.set(key, {
          id: key,
          email: email,
          name: order.customer_name || 'Cliente Mayorista',
          phone: phone,
          doc: doc,
          city: order.city || '',
          department: order.department || '',
          address: order.shipping_address || '',
          orders_count: 0,
          total_spent: 0,
          orders: [],
          last_order_date: order.created_at || order.order_date || null,
          created_at: order.created_at || new Date().toISOString(),
          has_pending_reset: false,
          last_reset_request: null,
          password_assigned_at: passwordRecords[email]?.assigned_at || null,
        });
      }

      const client = clientsMap.get(key)!;
      client.orders_count += 1;
      client.total_spent += Number(order.total) || 0;
      client.orders.push(order);

      // Keep latest order info
      if (!client.name && order.customer_name) client.name = order.customer_name;
      if (!client.phone && order.customer_phone) client.phone = order.customer_phone;
      if (!client.city && order.city) client.city = order.city;
      if (!client.address && order.shipping_address) client.address = order.shipping_address;
    });

    // Aggregate from wholesale leads
    (leadsData || []).forEach((lead: any) => {
      const email = (lead.email || '').trim().toLowerCase();
      const phone = (lead.phone || '').trim();
      const key = email || phone || lead.id;

      if (!clientsMap.has(key)) {
        clientsMap.set(key, {
          id: key,
          email: email,
          name: lead.name || 'Lead Mayorista',
          phone: phone,
          doc: lead.doc_number ? `${lead.doc_type || 'CC'} ${lead.doc_number}` : '',
          city: lead.city || '',
          department: '',
          address: '',
          orders_count: 0,
          total_spent: 0,
          orders: [],
          last_order_date: null,
          created_at: lead.created_at || new Date().toISOString(),
          has_pending_reset: false,
          last_reset_request: null,
          password_assigned_at: passwordRecords[email]?.assigned_at || null,
        });
      }
    });

    // Aggregate direct auth users
    authUsers.forEach((u: any) => {
      const email = (u.email || '').trim().toLowerCase();
      if (!email || email === ADMIN_EMAIL.toLowerCase()) return;
      const meta = u.user_metadata || {};
      const fullName = meta.full_name || meta.name || '';
      if (!clientsMap.has(email)) {
        clientsMap.set(email, {
          id: u.id || email,
          email: email,
          name: fullName || 'Cliente Registrado',
          phone: u.phone || meta.phone || '',
          doc: '',
          city: meta.city || '',
          department: '',
          address: '',
          orders_count: 0,
          total_spent: 0,
          orders: [],
          last_order_date: null,
          created_at: u.created_at || new Date().toISOString(),
          has_pending_reset: false,
          last_reset_request: null,
          password_assigned_at: passwordRecords[email]?.assigned_at || null,
        });
      } else {
        const client = clientsMap.get(email)!;
        if (!client.name && fullName) client.name = fullName;
      }
    });

    // Aggregate new user registrations
    newRegistrations.forEach((reg: any) => {
      const email = (reg.email || '').trim().toLowerCase();
      if (!email) return;
      if (!clientsMap.has(email)) {
        clientsMap.set(email, {
          id: email,
          email: email,
          name: reg.name || 'Cliente Registrado',
          phone: '',
          doc: '',
          city: '',
          department: '',
          address: '',
          orders_count: 0,
          total_spent: 0,
          orders: [],
          last_order_date: null,
          created_at: reg.registered_at || new Date().toISOString(),
          has_pending_reset: false,
          last_reset_request: null,
          password_assigned_at: passwordRecords[email]?.assigned_at || null,
        });
      }
    });

    // Cross-reference reset requests
    resetRequests.forEach((reqItem: any) => {
      const email = (reqItem.email || '').trim().toLowerCase();
      if (!email) return;
      let match = clientsMap.get(email);
      if (!match) {
        match = {
          id: email,
          email: email,
          name: reqItem.name || 'Cliente Solicitante',
          phone: reqItem.phone || '',
          doc: '',
          city: '',
          department: '',
          address: '',
          orders_count: 0,
          total_spent: 0,
          orders: [],
          last_order_date: null,
          created_at: reqItem.created_at || new Date().toISOString(),
          has_pending_reset: true,
          last_reset_request: reqItem.created_at || new Date().toISOString(),
          password_assigned_at: passwordRecords[email]?.assigned_at || null,
        };
        clientsMap.set(email, match);
      } else {
        match.has_pending_reset = true;
        match.last_reset_request = reqItem.created_at || new Date().toISOString();
      }
    });

    const clientsList = Array.from(clientsMap.values()).sort((a, b) => {
      // Prioritize clients with pending reset requests, then by orders count
      if (a.has_pending_reset && !b.has_pending_reset) return -1;
      if (!a.has_pending_reset && b.has_pending_reset) return 1;
      return b.orders_count - a.orders_count;
    });

    return NextResponse.json({
      clients: clientsList,
      total_clients: clientsList.length,
      pending_resets: resetRequests.length,
    });
  } catch (err: any) {
    console.error('API clients error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, password, action = 'set_password' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Correo de cliente requerido' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (action === 'send_reset_email') {
      // Trigger standard Supabase Auth reset password email.
      // Origin validado contra allowlist/mismo host (evita open redirect del enlace).
      const reqHost = new URL(req.url).host;
      const originHeader = req.headers.get('origin') || '';
      let origin = 'https://ushbyushuaia.vercel.app';
      try {
        if (originHeader && new URL(originHeader).host === reqHost) origin = originHeader;
      } catch (_) {}
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${origin}/profile`,
      });

      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 400 });
      }

      // Mark request as addressed in reset requests list
      await clearPendingReset(normalizedEmail);

      return NextResponse.json({
        success: true,
        message: `Enlace de recuperación enviado con éxito por correo a ${normalizedEmail}`,
      });
    }

    if (action === 'set_password') {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }

      // 1. Try updating via Supabase Service Role Key if available in server environment
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';

      let updatedViaAdminApi = false;
      if (serviceRoleKey) {
        try {
          const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          // Find user by email (paginado hasta encontrarlo; antes solo se
          // buscaba en la primera página y la contraseña no se actualizaba
          // para usuarios fuera de ella, respondiendo éxito igualmente)
          let targetUser: any = null;
          for (let page = 1; page <= 20 && !targetUser; page++) {
            const { data: usersData, error: listErr } = await adminSupabase.auth.admin.listUsers({ page, perPage: 200 });
            if (listErr || !usersData?.users?.length) break;
            targetUser = usersData.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
            if (usersData.users.length < 200) break;
          }
          if (targetUser) {
            const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(targetUser.id, {
              password: password,
            });
            if (!updateErr) {
              updatedViaAdminApi = true;
            }
          }
        } catch (e) {
          console.warn('Service role password update failed:', e);
        }
      }

      // 2. Record password assignment in site_config
      const { data: configRow } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'client_password_records')
        .maybeSingle();

      let records: Record<string, any> = {};
      if (configRow?.value) {
        try { records = JSON.parse(configRow.value); } catch (_) {}
      }

      records[normalizedEmail] = {
        email: normalizedEmail,
        assigned_at: new Date().toISOString(),
        assigned_by: admin.email,
        updated_in_auth: updatedViaAdminApi,
      };

      await supabase.from('site_config').upsert({
        key: 'client_password_records',
        value: JSON.stringify(records),
        updated_at: new Date().toISOString(),
      });

      // Clear any pending reset request for this client
      await clearPendingReset(normalizedEmail);

      return NextResponse.json({
        success: true,
        message: `Contraseña asignada correctamente para ${normalizedEmail}.${
          updatedViaAdminApi ? ' La cuenta ya puede ingresar inmediatamente con esta nueva contraseña.' : ' Registrada en el sistema.'
        }`,
      });
    }

    if (action === 'delete_user') {
      // Nunca se puede eliminar la cuenta del administrador del sistema.
      if (normalizedEmail === ADMIN_EMAIL) {
        return NextResponse.json({ error: 'No se puede eliminar la cuenta del administrador.' }, { status: 400 });
      }

      const adminSupabase = getAdminSupabase();
      if (!adminSupabase) {
        return NextResponse.json(
          { error: 'SUPABASE_SERVICE_ROLE_KEY no configurada. Configúrala en las variables de entorno para poder eliminar usuarios.' },
          { status: 500 }
        );
      }

      // 1. Localizar el usuario en auth.users por email (paginado).
      let targetUser: any = null;
      for (let page = 1; page <= 20 && !targetUser; page++) {
        const { data: usersData, error: listErr } = await adminSupabase.auth.admin.listUsers({ page, perPage: 200 });
        if (listErr || !usersData?.users?.length) break;
        targetUser = usersData.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
        if (usersData.users.length < 200) break;
      }

      if (!targetUser) {
        return NextResponse.json({ error: 'No se encontró ningún usuario registrado con ese correo.' }, { status: 404 });
      }

      // 2. Eliminar la cuenta de Supabase Auth (borra el usuario y sus datos de auth).
      const { error: deleteAuthErr } = await adminSupabase.auth.admin.deleteUser(targetUser.id);
      if (deleteAuthErr) {
        return NextResponse.json({ error: `No se pudo eliminar el usuario en Supabase: ${deleteAuthErr.message}` }, { status: 500 });
      }

      // 3. Limpiar los datos asociados del cliente (bypass RLS vía service role).
      let deletedOrders = 0;
      let deletedLeads = 0;
      const { data: ordersData } = await adminSupabase
        .from('orders')
        .select('id')
        .or(`customer_email.eq.${normalizedEmail},email.eq.${normalizedEmail}`);
      if (Array.isArray(ordersData) && ordersData.length) {
        const ids = ordersData.map((o) => o.id);
        const { data: delOrders } = await adminSupabase.from('orders').delete().in('id', ids);
        deletedOrders = ids.length;
      }

      // Filtrar a su vez en price_history por los pedidos borrados (si existe la tabla y columnas)
      try {
        await adminSupabase.from('price_history').delete().or(`customer_email.eq.${normalizedEmail}`);
      } catch (_) {}

      const { data: leadsData } = await adminSupabase
        .from('wholesale_leads')
        .select('id')
        .eq('email', normalizedEmail);
      if (Array.isArray(leadsData) && leadsData.length) {
        const leadIds = leadsData.map((l) => l.id);
        await adminSupabase.from('wholesale_leads').delete().in('id', leadIds);
        deletedLeads = leadIds.length;
      }

      // 4. Quitar al cliente de los registros de site_config (claves asignadas,
      //    solicitudes de reset y avisos de nuevo registro).
      await removeFromSiteConfigList(adminSupabase, normalizedEmail, 'client_password_records');
      await removeFromSiteConfigList(adminSupabase, normalizedEmail, 'new_user_registrations');
      await removeFromSiteConfigList(adminSupabase, normalizedEmail, 'password_reset_requests');

      return NextResponse.json({
        success: true,
        message: `Usuario ${normalizedEmail} eliminado correctamente. Se borró su cuenta, ${deletedOrders} pedido(s) y ${deletedLeads} solicitud(es) de contacto de Supabase.`,
      });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err: any) {
    console.error('API clients POST error:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}

async function clearPendingReset(email: string) {
  try {
    const { data: configRow } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'password_reset_requests')
      .maybeSingle();

    if (configRow?.value) {
      const list = JSON.parse(configRow.value);
      if (Array.isArray(list)) {
        const filtered = list.filter((item: any) => (item.email || '').toLowerCase() !== email.toLowerCase());
        await supabase.from('site_config').upsert({
          key: 'password_reset_requests',
          value: JSON.stringify(filtered),
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (_) {}
}

// Elimina un email de una lista JSON guardada en site_config, soportando tanto
// listas (array de objetos con .email) como mapas clave->objeto. Se le pasa el
// cliente de servicio (bypass RLS) para poder escribir sobre site_config.
async function removeFromSiteConfigList(client: any, email: string, key: string) {
  try {
    const { data: configRow } = await client
      .from('site_config')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (!configRow?.value) return;
    const parsed = JSON.parse(configRow.value);
    let changed = false;

    if (Array.isArray(parsed)) {
      const filtered = parsed.filter((item: any) => (item.email || '').toLowerCase() !== email.toLowerCase());
      changed = filtered.length !== parsed.length;
      if (changed) {
        await client.from('site_config').upsert({
          key,
          value: JSON.stringify(filtered),
          updated_at: new Date().toISOString(),
        });
      }
    } else if (parsed && typeof parsed === 'object') {
      const mapped = Object.keys(parsed).some((k) => k.toLowerCase() === email.toLowerCase());
      if (mapped) {
        const { [Object.keys(parsed).find((k) => k.toLowerCase() === email.toLowerCase())!]: _, ...rest } = parsed;
        await client.from('site_config').upsert({
          key,
          value: JSON.stringify(rest),
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (_) {}
}
