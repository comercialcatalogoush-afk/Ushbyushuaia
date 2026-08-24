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
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.error('Error fetching orders for clients:', ordersErr);
    }

    // 2. Fetch wholesale leads (contact forms)
    const { data: leadsData } = await supabase
      .from('wholesale_leads')
      .select('*')
      .order('created_at', { ascending: false });

    // 2.1 Fetch registered users directly from Supabase Auth
    let authUsers: any[] = [];
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
    if (serviceRoleKey) {
      try {
        const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: authData } = await adminSupabase.auth.admin.listUsers();
        if (authData?.users) {
          authUsers = authData.users;
        }
      } catch (e) {
        console.warn('Auth admin listUsers notice in GET:', e);
      }
    }

    // 2.2 Fallback RPC to fetch all auth users directly from Postgres auth.users
    if (authUsers.length === 0) {
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_admin_users');
        if (!rpcErr && Array.isArray(rpcData)) {
          authUsers = rpcData.map((u: any) => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            user_metadata: u.raw_user_meta_data || {},
          }));
        }
      } catch (rpcCatch) {
        // RPC might not be created yet in Postgres
      }
    }

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
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
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
      // Trigger standard Supabase Auth reset password email
      const origin = req.headers.get('origin') || 'https://ushuaiajeans.com.co';
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

          // Find user by email
          const { data: usersData, error: listErr } = await adminSupabase.auth.admin.listUsers();
          if (!listErr && usersData?.users) {
            const targetUser = usersData.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
            if (targetUser) {
              const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(targetUser.id, {
                password: password,
              });
              if (!updateErr) {
                updatedViaAdminApi = true;
              }
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
