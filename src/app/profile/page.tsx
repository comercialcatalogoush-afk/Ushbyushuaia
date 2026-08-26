'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, LogIn, AlertCircle, CheckCircle2, Settings, Eye, EyeOff, KeyRound, LogOut, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';

function friendlyAuthError(err: any): string {
  if (!err?.message) return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  const m = err.message.toLowerCase();
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash.includes('type=recovery')) {
      setIsRecovery(true);
      setMode('newpass');
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
          body: JSON.stringify({ email: u.email.trim().toLowerCase(), name: fullName }),
        }).catch(() => {});
      }
    };

    supabase.auth.getSession().then(({ data }) => sync(data.session));
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
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(friendlyAuthError(err)); setLoading(false); return; }
    setSuccess('✅ ¡Bienvenido! Iniciaste sesión correctamente.');
    const isAdmin = data.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    setTimeout(() => { window.location.href = isAdmin ? '/admin' : '/'; }, 1200);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name || !email || !password) { setError('Por favor completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres.'); return; }
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (err) { setError(friendlyAuthError(err)); setLoading(false); return; }

    // Notifica al admin en tiempo real (fire-and-forget, no bloquea al usuario)
    fetch('/api/auth/register-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), name }),
    }).catch(() => {});

    if (data.session) {
      setSuccess('✅ ¡Cuenta creada! Ya iniciaste sesión.');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } else {
      setSuccess(`✅ Te enviamos un correo de confirmación a ${email}. Revísalo para activar tu cuenta.`);
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
        redirectTo: `${window.location.origin}/profile`,
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
      options: { redirectTo: `${window.location.origin}/profile` },
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white shadow-xl border border-gray-200 overflow-hidden animate-fadeIn text-center">
          <div className="bg-[#d88193] text-white p-8">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/40 object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-2 border-white/40">
                <User size={28} />
              </div>
            )}
            <h1 className="text-xl font-black uppercase">Mi Cuenta</h1>
            <p className="text-xs text-white/80 mt-1 break-all">{user.email}</p>
          </div>
          <div className="p-8 space-y-3 text-left">
            <p className="text-sm text-neutral-600">
              <span className="font-bold text-neutral-800">Nombre:</span> {user.user_metadata?.full_name || user.user_metadata?.name || '—'}
            </p>
            {isAdminUser && (
              <a href="/admin" className="flex items-center justify-center gap-2 w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest transition-colors">
                <Settings size={16} /> Ir al Panel de Administrador
              </a>
            )}
            <button onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full border border-gray-300 text-neutral-600 font-bold py-3 text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors">
              <LogOut size={15} /> Cerrar Sesión
            </button>
            <Link href="/" className="block text-center text-xs text-neutral-400 hover:text-neutral-700 mt-1">← Volver al catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth card ──
  return (
    <div className="min-h-screen bg-neutral-50 py-16 px-4 flex items-center justify-center">
      <meta name="robots" content="noindex,nofollow" />
      <title>Mi Cuenta | Ush By Ushuaia</title>
      <div className="w-full max-w-md bg-white shadow-xl border border-gray-200 overflow-hidden animate-fadeIn">

        <div className="bg-[#d88193] text-white p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-2 border-white/40">
            <User size={28} />
          </div>
          <h1 className="text-xl font-black uppercase">Mi Cuenta</h1>
          <p className="text-xs text-white/80 mt-1">USH BY USHUAIA — Mayoristas</p>
        </div>

        {!isRecovery && (
          <div className="flex border-b border-gray-200">
            {([
              { key: 'login',    label: 'Iniciar Sesión' },
              { key: 'register', label: 'Crear Cuenta' },
              { key: 'recover',  label: 'Recuperar Clave' },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => switchMode(key)}
                className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-r last:border-r-0 border-gray-200 ${
                  mode === key ? 'bg-[#d88193] text-white' : 'text-neutral-500 hover:bg-gray-50'
                }`}>
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" /><span>{success}</span>
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Correo *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Contraseña *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full border border-gray-300 pl-9 pr-10 py-3 text-xs focus:outline-none focus:border-[#d88193]" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <LogIn size={16} />{loading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">o</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button type="button" onClick={handleGoogle} disabled={loading}
                className="w-full border border-gray-300 hover:border-[#d88193] hover:bg-gray-50 text-neutral-700 font-bold py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <GoogleIcon size={16} /> Continuar con Google
              </button>

              <p className="text-center text-xs text-neutral-500">
                ¿No tienes cuenta? <button type="button" onClick={() => switchMode('register')} className="text-[#d88193] font-bold hover:underline">Crea una →</button>
              </p>
              <p className="text-center text-xs text-neutral-500">
                ¿Olvidaste tu contraseña? <button type="button" onClick={() => switchMode('recover')} className="text-[#d88193] font-bold hover:underline">Recupérala →</button>
              </p>
            </form>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Nombre Completo *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Correo *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Contraseña * <span className="text-neutral-400 font-normal normal-case">(mín. 6 caracteres)</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full border border-gray-300 pl-9 pr-10 py-3 text-xs focus:outline-none focus:border-[#d88193]" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#d88193] hover:bg-[#c06579] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <ArrowRight size={16} />{loading ? 'Creando cuenta...' : 'Crear Mi Cuenta'}
              </button>
              <p className="text-center text-xs text-neutral-500">
                ¿Ya tienes cuenta? <button type="button" onClick={() => switchMode('login')} className="text-[#d88193] font-bold hover:underline">Inicia sesión →</button>
              </p>
            </form>
          )}

          {/* ── RECOVER ── */}
          {mode === 'recover' && (
            <form onSubmit={handleRecover} className="space-y-4">
              <p className="text-xs text-neutral-500 leading-relaxed text-center">
                Ingresa tu correo y te enviamos un enlace seguro para restablecer tu contraseña.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Correo *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <KeyRound size={16} />{loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
              </button>
              <p className="text-center text-xs text-neutral-500">
                ¿Recordaste tu contraseña? <button type="button" onClick={() => switchMode('login')} className="text-[#d88193] font-bold hover:underline">Inicia sesión →</button>
              </p>
            </form>
          )}

          {/* ── NEW PASSWORD (recovery) ── */}
          {mode === 'newpass' && (
            <form onSubmit={handleNewPassword} className="space-y-4">
              <p className="text-xs text-neutral-500 leading-relaxed text-center">
                Ingresa tu nueva contraseña. {user && <span className="font-bold text-neutral-700">Cuenta: {user.email}</span>}
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Nueva Contraseña * <span className="text-neutral-400 font-normal normal-case">(mín. 6 caracteres)</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full border border-gray-300 pl-9 pr-10 py-3 text-xs focus:outline-none focus:border-[#d88193]" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <ShieldCheck size={16} />{loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-700">← Volver al catálogo</Link>
          </div>
        </div>
      </div>
    </div>
  );
}