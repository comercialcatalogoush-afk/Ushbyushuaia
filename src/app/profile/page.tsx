'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, LogIn, AlertCircle, CheckCircle2, Settings, Eye, EyeOff, KeyRound, LogOut, ShieldCheck, Loader2, Film, FileText, UserCircle, CheckSquare, Calculator } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CustomerAccountBenefits } from '@/components/CustomerAccountBenefits';
import { CustomerAudiovisualContent } from '@/components/CustomerAudiovisualContent';
import { Product } from '@/types';
import { CalculadoraClient } from '../calculadora-ganancias/CalculadoraClient';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';
const CANONICAL_SITE_URL = 'https://ushbyushuaia.vercel.app';

function getAuthRedirectUrl(path: string) {
  const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  // Producción siempre retorna al dominio canónico, aunque el usuario haya abierto un alias antiguo.
  const baseUrl = isLocal ? window.location.origin : CANONICAL_SITE_URL;
  return `${baseUrl}${path}`;
}

function friendlyAuthError(err: any): string {
  if (!err?.message) return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  const m = err.message.toLowerCase();
  if (m.includes('failed to fetch') || m.includes('fetch failed') || m.includes('networkerror') || m.includes('network error') || m.includes('load failed')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
  }
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos. Verifica e intenta de nuevo.';
  if (m.includes('email not confirmed')) return 'Aún no confirmas tu correo. Revisa tu bandeja y confirma tu cuenta.';
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
  if (m.includes('signups not allowed')) return 'El registro no está habilitado en este momento.';
  return err.message;
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.1 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

export default function ProfilePage() {
  const [mode, setMode] = useState<'login' | 'register' | 'recover' | 'newpass'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [returnTo, setReturnTo] = useState('/');
  const [activeTab, setActiveTab] = useState<'perfil' | 'contenido' | 'calculadora'>('perfil');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash.includes('type=recovery')) {
      setIsRecovery(true);
      setMode('newpass');
    }
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get('mode');
    if (requestedMode === 'register' || requestedMode === 'recover' || requestedMode === 'login') {
      setMode(requestedMode);
    }
    const requestedReturnTo = params.get('returnTo');
    if (requestedReturnTo && requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//')) {
      setReturnTo(requestedReturnTo);
    }
    const requestedTab = params.get('tab');
    if (requestedTab === 'calculadora' || requestedTab === 'perfil' || requestedTab === 'contenido') {
      setActiveTab(requestedTab);
    }

    const sync = (session: any) => {
      const u = session?.user ?? null;
      setUser(u);
      setChecking(false);

      if (u && u.email && u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        // Notifica el registro UNA sola vez por usuario y navegador: antes se
        // enviaba en cada evento de sesión (incluido TOKEN_REFRESHED cada hora),
        // saturando al admin y re-marcando usuarios antiguos como "nuevos".
        try {
          const flagKey = `ush_register_notified_${u.id}`;
          if (localStorage.getItem(flagKey)) return;
          localStorage.setItem(flagKey, '1');
        } catch (_) {}
        const fullName = u.user_metadata?.full_name || u.user_metadata?.name || '';
        fetch('/api/auth/register-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: u.email.trim().toLowerCase(), name: fullName, marketingOptIn: !!u.user_metadata?.marketing_opt_in }),
        }).catch(() => {});
      }
    };

    supabase.auth.getSession()
      .then(({ data }) => sync(data.session))
      .catch((err) => {
        setChecking(false);
        setError(friendlyAuthError(err));
      });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session);
      if (session && window.location.hash.includes('type=recovery')) {
        setIsRecovery(true);
        setMode('newpass');
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isAdminUser = !!user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!user || isAdminUser) return;
    let cancelled = false;
    const loadProfileData = async () => {
      setLoadingProfile(true);
      try {
        const catalogResponse = await fetch('/api/catalog', { cache: 'no-store' });
        if (cancelled) return;
        if (!catalogResponse.ok) throw new Error('No se pudo cargar el catálogo.');
        const payload = await catalogResponse.json();
        setProducts(Array.isArray(payload) ? payload : (payload.products || []));
      } catch (_) {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    loadProfileData();
    return () => { cancelled = true; };
  }, [user, isAdminUser]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(''); setPasswordErr('');
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordErr('Por favor completa todos los campos.'); return; }
    if (newPassword.length < 6) { setPasswordErr('La nueva contraseña debe tener mínimo 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPasswordErr('La confirmación de la nueva contraseña no coincide.'); return; }
    if (!user?.email) { setPasswordErr('No se pudo identificar tu cuenta.'); return; }
    setLoadingProfile(true);
    // Doble verificación: primero comprobamos que la contraseña actual es correcta.
    const verify = await supabase.auth.signInWithPassword({ email: user.email.trim().toLowerCase(), password: currentPassword });
    if (verify.error) { setPasswordErr(friendlyAuthError(verify.error)); setLoadingProfile(false); return; }
    const res = await supabase.auth.updateUser({ password: newPassword });
    setLoadingProfile(false);
    if (res.error) { setPasswordErr(friendlyAuthError(res.error)); return; }
    setPasswordMsg('✅ Contraseña actualizada correctamente.');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const switchMode = (m: 'login' | 'register' | 'recover') => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email || !password) { setError('Por favor completa todos los campos.'); return; }
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (err) { setError(friendlyAuthError(err)); setLoading(false); return; }
    setSuccess('✅ ¡Bienvenido! Iniciaste sesión correctamente.');
    const isAdmin = data.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    setTimeout(() => { window.location.href = isAdmin ? '/admin' : returnTo; }, 1200);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name || !email || !password) { setError('Por favor completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres.'); return; }
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error: err } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { full_name: name, marketing_opt_in: marketingOptIn, marketing_consent_at: marketingOptIn ? new Date().toISOString() : null } },
    });
    if (err) { setError(friendlyAuthError(err)); setLoading(false); return; }

    // Notifica al admin en tiempo real (fire-and-forget, no bloquea al usuario)
    fetch('/api/auth/register-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, name, marketingOptIn }),
    }).catch(() => {});

    if (data.session) {
      setSuccess('✅ ¡Cuenta creada! Ya iniciaste sesión.');
      setTimeout(() => { window.location.href = returnTo; }, 1200);
    } else {
      setSuccess(`✅ Te enviamos un correo de confirmación a ${normalizedEmail}. Revísalo para activar tu cuenta.`);
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email) { setError('Por favor ingresa tu correo.'); return; }
    setLoading(true);

    try {
      // Notifica y registra la solicitud en el backend (fire-and-forget).
      // El envío real del email de recuperación lo gestiona Supabase Auth.
      fetch('/api/auth/recovery-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      }).catch(() => {});

      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: getAuthRedirectUrl('/profile'),
      });

      if (err) {
        setError(friendlyAuthError(err));
        setLoading(false);
        return;
      }

      setSuccess(`✅ Te enviamos un enlace para recuperar tu contraseña a ${email}. Revisa tu bandeja de entrada o spam.`);
    } catch (err: any) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!password || password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(friendlyAuthError(err)); setLoading(false); return; }
    setSuccess('✅ Contraseña actualizada correctamente.');
    setLoading(false);
    setTimeout(() => {
      window.location.hash = '';
      window.location.href = '/';
    }, 2000);
  };

  const handleGoogle = async () => {
    setError(''); setSuccess('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAuthRedirectUrl(`/profile?returnTo=${encodeURIComponent(returnTo)}`) },
    });
    if (err) setError(friendlyAuthError(err));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMode('login');
    setSuccess('');
    setError('');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#d88193]" />
      </div>
    );
  }

  // ── Sesión activa ──
  if (user && !isRecovery) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <title>Mi Cuenta | Ush By Ushuaia</title>
        <div className="bg-[#d88193] text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-6 sm:px-6">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="h-14 w-14 rounded-full border-2 border-white/40 object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/40 bg-white/20"><User size={26} /></div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-black uppercase sm:text-2xl">Mi Cuenta</h1>
              <p className="truncate text-xs text-white/80">{user.email}</p>
            </div>
            {isAdminUser && (
              <a href="/admin" className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#1b2333] transition hover:bg-[#f3b3c0]"><Settings size={15} /> Panel de Administrador</a>
            )}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
          {/* Menú lateral sticky */}
          <aside className="shrink-0 lg:w-64 lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-row gap-2 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
              <button type="button" onClick={() => setActiveTab('perfil')} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-left text-xs font-black uppercase tracking-wide transition ${activeTab === 'perfil' ? 'bg-[#1b2333] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}><UserCircle size={16} /> Mi perfil</button>
              <button type="button" onClick={() => setActiveTab('calculadora')} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-left text-xs font-black uppercase tracking-wide transition ${activeTab === 'calculadora' ? 'bg-[#d88193] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}><Calculator size={16} /> Calculadora</button>
              <button type="button" onClick={() => setActiveTab('contenido')} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-left text-xs font-black uppercase tracking-wide transition ${activeTab === 'contenido' ? 'bg-[#1b2333] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}><Film size={16} /> Contenido audiovisual</button>
            </div>
            <div className="mt-4 space-y-2">
              <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-600 transition hover:bg-gray-50"><LogOut size={15} /> Cerrar Sesión</button>
              <Link href="/" className="block text-center text-xs text-neutral-400 hover:text-neutral-700">← Volver al catálogo</Link>
            </div>
          </aside>

          {/* Contenido de la pestaña activa */}
          <main className="min-w-0 flex-1">
            {activeTab === 'perfil' && (
              <div className="space-y-5 text-left">
                <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1b2333]"><UserCircle size={17} className="text-[#d88193]" /> Mis datos</h2>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div><dt className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Nombre</dt><dd className="mt-1 text-sm font-bold text-[#1b2333]">{user.user_metadata?.full_name || user.user_metadata?.name || '—'}</dd></div>
                    <div><dt className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Correo electrónico</dt><dd className="mt-1 text-sm font-bold text-[#1b2333]">{user.email}</dd></div>
                  </dl>
                </section>

                <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1b2333]"><ShieldCheck size={17} className="text-[#d88193]" /> Cambiar contraseña</h2>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">Para proteger tu cuenta, primero confirmamos tu contraseña actual antes de aplicar un cambio.</p>
                  <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                    {passwordMsg && <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /><span>{passwordMsg}</span></div>}
                    {passwordErr && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{passwordErr}</span></div>}
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-700">Contraseña actual *</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full border border-gray-300 py-3 pl-9 pr-10 text-xs outline-none focus:border-[#d88193]" />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">{showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-700">Nueva contraseña * <span className="font-normal normal-case text-neutral-400">(mín. 6)</span></label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full border border-gray-300 py-3 pl-9 pr-10 text-xs outline-none focus:border-[#d88193]" />
                          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-neutral-700">Confirmar nueva *</label>
                        <div className="relative">
                          <CheckSquare size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full border border-gray-300 py-3 pl-9 pr-10 text-xs outline-none focus:border-[#d88193]" />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={loadingProfile} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1b2333] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#d88193] disabled:opacity-60"><KeyRound size={15} />{loadingProfile ? 'Verificando...' : 'Actualizar contraseña'}</button>
                  </form>
                </section>

                <CustomerAccountBenefits user={user} products={products} />
              </div>
            )}

            {activeTab === 'calculadora' && (
              <div className="w-full text-left">
                <CalculadoraClient embedded />
              </div>
            )}

            {activeTab === 'contenido' && (
              <div className="w-full text-left">
                <CustomerAudiovisualContent products={products} fullPage />
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // ── Auth card ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f9] via-rose-50/20 to-[#fbf9f9] py-12 px-4 flex items-center justify-center">
      <meta name="robots" content="noindex,nofollow" />
      <title>Mi Cuenta | Ush By Ushuaia</title>
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl border border-rose-100/80 overflow-hidden transition-all duration-300">

        {/* Encabezado suave y moderno */}
        <div className="bg-gradient-to-br from-white via-rose-50/30 to-white px-6 pt-8 pb-6 text-center border-b border-rose-100/60 relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d88193] to-[#e8a3b2] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-rose-300/40 ring-4 ring-rose-50">
            <User size={28} />
          </div>
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193] mb-1">
            Catálogo Mayorista Oficial
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1b2333]">
            Mi Cuenta
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Precios de fábrica, existencias inmediatas y contenidos
          </p>
        </div>

        {/* Selector de pestañas tipo cápsula interactiva */}
        {!isRecovery && (
          <div className="px-6 pt-5">
            <div className="p-1 bg-neutral-100/90 rounded-2xl flex border border-neutral-200/60 shadow-2xs">
              {([
                { key: 'login',    label: 'Iniciar Sesión' },
                { key: 'register', label: 'Crear Cuenta' },
                { key: 'recover',  label: 'Recuperar' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMode(key)}
                  className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer ${
                    mode === key
                      ? 'bg-white text-[#1b2333] shadow-xs font-extrabold scale-[1.02]'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-3.5 py-3 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-[#d88193] focus:ring-4 focus:ring-[#d88193]/15 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-10 py-3 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-[#d88193] focus:ring-4 focus:ring-[#d88193]/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1b2333] hover:bg-[#d88193] text-white font-black py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                <LogIn size={16} />
                <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">o</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full rounded-xl border border-neutral-200 hover:border-[#d88193] bg-white hover:bg-neutral-50 text-neutral-700 font-bold py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
              >
                <GoogleIcon size={16} />
                <span>Continuar con Google</span>
              </button>

              <div className="pt-2 text-center space-y-1">
                <p className="text-xs text-neutral-500">
                  ¿No tienes cuenta?{' '}
                  <button type="button" onClick={() => switchMode('register')} className="text-[#d88193] font-bold hover:underline cursor-pointer">
                    Crea una gratis →
                  </button>
                </p>
                <p className="text-xs text-neutral-500">
                  ¿Olvidaste tu contraseña?{' '}
                  <button type="button" onClick={() => switchMode('recover')} className="text-[#d88193] font-bold hover:underline cursor-pointer">
                    Recupérala aquí →
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Tu nombre y apellido"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-3.5 py-3 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-[#d88193] focus:ring-4 focus:ring-[#d88193]/15 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-3.5 py-3 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-[#d88193] focus:ring-4 focus:ring-[#d88193]/15 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  Contraseña * <span className="text-neutral-400 font-normal normal-case">(mín. 6 caracteres)</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-10 py-3 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-[#d88193] focus:ring-4 focus:ring-[#d88193]/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-2.5 text-[11px] leading-relaxed text-neutral-600 bg-rose-50/40 border border-rose-100/60 p-3 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 accent-[#d88193] rounded"
                />
                <span>Acepto recibir novedades del catálogo, reposiciones y fotos de producto en alta resolución por correo.</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#d88193] hover:bg-[#c06579] text-white font-black py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                <ArrowRight size={16} />
                <span>{loading ? 'Creando cuenta...' : 'Crear Mi Cuenta Gratis'}</span>
              </button>

              <p className="text-center text-xs text-neutral-500 pt-2">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-[#d88193] font-bold hover:underline cursor-pointer">
                  Inicia sesión aquí →
                </button>
              </p>
            </form>
          )}

          {/* ── RECOVER ── */}
          {mode === 'recover' && (
            <form onSubmit={handleRecover} className="space-y-4">
              <p className="text-xs text-neutral-600 leading-relaxed text-center">
                Ingresa tu correo y te enviamos un enlace seguro para restablecer tu contraseña.
              </p>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-3.5 py-3 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-[#d88193] focus:ring-4 focus:ring-[#d88193]/15 transition"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1b2333] hover:bg-[#d88193] text-white font-black py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                <KeyRound size={16} />
                <span>{loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}</span>
              </button>
              <p className="text-center text-xs text-neutral-500 pt-2">
                ¿Recordaste tu contraseña?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-[#d88193] font-bold hover:underline cursor-pointer">
                  Inicia sesión →
                </button>
              </p>
            </form>
          )}

          {/* ── NEW PASSWORD (recovery) ── */}
          {mode === 'newpass' && (
            <form onSubmit={handleNewPassword} className="space-y-4">
              <p className="text-xs text-neutral-600 leading-relaxed text-center">
                Ingresa tu nueva contraseña. {user && <span className="font-bold text-neutral-800">Cuenta: {user.email}</span>}
              </p>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-700 mb-1.5">
                  Nueva Contraseña * <span className="text-neutral-400 font-normal normal-case">(mín. 6 caracteres)</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 pl-10 pr-10 py-3 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:border-[#d88193] focus:ring-4 focus:ring-[#d88193]/15 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#1b2333] hover:bg-[#d88193] text-white font-black py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>{loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}</span>
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-neutral-100 text-center">
            <Link href="/" className="text-xs font-bold text-neutral-400 hover:text-[#d88193] transition">
              ← Volver al catálogo principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
