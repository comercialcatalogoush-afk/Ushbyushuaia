'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, LogIn, AlertCircle, CheckCircle2, Settings, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';
const MAX_ADMIN_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Simple localStorage-based user store (replace with Supabase auth later)
function getUsers(): Record<string, { name: string; password: string }> {
  try { return JSON.parse(localStorage.getItem('ush_users') || '{}'); } catch { return {}; }
}
function saveUser(email: string, name: string, password: string) {
  const users = getUsers();
  users[email.toLowerCase()] = { name, password };
  localStorage.setItem('ush_users', JSON.stringify(users));
}
function verifyUser(email: string, password: string): boolean {
  const users = getUsers();
  const u = users[email.toLowerCase()];
  return !!u && u.password === password;
}
function userExists(email: string): boolean {
  return !!getUsers()[email.toLowerCase()];
}

export default function ProfilePage() {
  const [mode, setMode] = useState<'login' | 'register' | 'magic' | 'admin'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isAdminSession, setIsAdminSession] = useState(false);

  // Admin lockout state
  const [adminAttempts, setAdminAttempts] = useState(0);
  const [adminBlocked, setAdminBlocked] = useState(false);
  const [adminBlockUntil, setAdminBlockUntil] = useState(0);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (sessionUser && sessionUser.email && sessionUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdminSession(true);
      }
    })();

    // Restore lockout state
    const blocked = localStorage.getItem('ush_admin_blocked');
    const until = Number(localStorage.getItem('ush_admin_block_until') || '0');
    const attempts = Number(localStorage.getItem('ush_admin_attempts') || '0');
    if (blocked === 'true' && Date.now() < until) {
      setAdminBlocked(true);
      setAdminBlockUntil(until);
    } else {
      localStorage.removeItem('ush_admin_blocked');
      localStorage.removeItem('ush_admin_block_until');
    }
    setAdminAttempts(attempts);
  }, []);

  // Check if block has expired
  const remainingBlockMinutes = () => Math.max(0, Math.ceil((adminBlockUntil - Date.now()) / 60000));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    const emailVal = email.trim().toLowerCase();

    // Regular user login
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      setLoading(false); return;
    }
    if (!userExists(emailVal)) {
      setError('No encontramos una cuenta con ese correo. ¿Ya te registraste?');
      setLoading(false); return;
    }
    if (!verifyUser(emailVal, password)) {
      setError('La contraseña es incorrecta. Verifica e intenta de nuevo.');
      setLoading(false); return;
    }

    setSuccess(`✅ ¡Bienvenido! Iniciaste sesión correctamente.`);
    setLoading(false);
    setTimeout(() => { window.location.href = '/'; }, 1200);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name || !email || !password) { setError('Por favor completa todos los campos.'); return; }
    if (password.length < 8) { setError('La contraseña debe tener mínimo 8 caracteres.'); return; }
    const emailVal = email.trim().toLowerCase();
    if (userExists(emailVal)) { setError('Ya existe una cuenta con ese correo. Prueba a iniciar sesión.'); return; }
    setLoading(true);
    setTimeout(() => {
      saveUser(emailVal, name, password);
      setSuccess('✅ ¡Cuenta creada! Ahora puedes iniciar sesión.');
      setLoading(false);
      setTimeout(() => { setMode('login'); setSuccess(''); }, 2000);
    }, 600);
  };

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email) { setError('Por favor ingresa tu correo.'); return; }
    setLoading(true);
    setTimeout(() => {
      setSuccess(`✅ Te enviamos un enlace de acceso a ${email}. Revisa tu bandeja.`);
      setLoading(false);
    }, 800);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (adminBlocked && Date.now() < adminBlockUntil) {
      setError(`🔒 Panel bloqueado. Intenta en ${remainingBlockMinutes()} minuto(s).`);
      return;
    }

    const emailOk = adminEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (emailOk) {
      // Success
      localStorage.removeItem('ush_admin_attempts');
      localStorage.removeItem('ush_admin_blocked');
      localStorage.removeItem('ush_admin_block_until');
      setSuccess('✅ Acceso de administrador concedido. Redirigiendo al panel...');
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPass,
      });

      if (!error) {
        setTimeout(() => { window.location.href = '/admin'; }, 1000);
      } else {
        setLoading(false);
        setSuccess('');
        setError('❌ Credenciales incorrectas. Verifica la contraseña de tu cuenta admin.');
      }
    } else {
      const newAttempts = adminAttempts + 1;
      setAdminAttempts(newAttempts);
      localStorage.setItem('ush_admin_attempts', String(newAttempts));

      if (newAttempts >= MAX_ADMIN_ATTEMPTS) {
        const until = Date.now() + BLOCK_DURATION_MS;
        localStorage.setItem('ush_admin_blocked', 'true');
        localStorage.setItem('ush_admin_block_until', String(until));
        setAdminBlocked(true);
        setAdminBlockUntil(until);
        setError(`🔒 Demasiados intentos fallidos. Panel bloqueado por 15 minutos.`);
      } else {
        const remaining = MAX_ADMIN_ATTEMPTS - newAttempts;
        setError(`❌ Credenciales incorrectas. ${remaining} intento(s) restante(s) antes del bloqueo.`);
      }
    }
  };

  // Already logged in as admin
  if (isAdminSession) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white shadow-xl border border-gray-200 overflow-hidden animate-fadeIn text-center">
          <div className="bg-[#d88193] text-white p-8">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-2 border-white/40">
              <Settings size={28} />
            </div>
            <h1 className="text-xl font-black uppercase">Panel de Administrador</h1>
            <p className="text-xs text-white/80 mt-1">Sesión activa</p>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm text-neutral-600 font-light">Ya iniciaste sesión como administrador.</p>
            <a href="/admin" className="block w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest text-center transition-colors">
              Ir al Panel de Edición →
            </a>
            <button onClick={async () => { await supabase.auth.signOut(); setIsAdminSession(false); }}
              className="block w-full border border-gray-300 text-neutral-600 font-bold py-3 text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors">
              Cerrar Sesión de Admin
            </button>
            <Link href="/" className="block text-xs text-neutral-400 hover:text-neutral-700 mt-2">← Volver al catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16 px-4 flex items-center justify-center">
      <meta name="robots" content="noindex,nofollow" />
      <title>Mi Cuenta | Ush By Ushuaia</title>
      <div className="w-full max-w-md bg-white shadow-xl border border-gray-200 overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="bg-[#d88193] text-white p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-2 border-white/40">
            <User size={28} />
          </div>
          <h1 className="text-xl font-black uppercase">Mi Cuenta</h1>
          <p className="text-xs text-white/80 mt-1">USH BY USHUAIA — Mayoristas</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {([
            { key: 'login',    label: 'Iniciar Sesión' },
            { key: 'register', label: 'Crear Cuenta' },
            { key: 'magic',    label: 'Solo Correo' },
            { key: 'admin',    label: '🔑 Admin' },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => { setMode(key); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-r last:border-r-0 border-gray-200 ${
                mode === key ? 'bg-[#d88193] text-white' : 'text-neutral-500 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

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
              <p className="text-center text-xs text-neutral-500">
                ¿Sin contraseña? <button type="button" onClick={() => setMode('magic')} className="text-[#d88193] font-bold hover:underline">Entra solo con tu correo →</button>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Contraseña * <span className="text-neutral-400 font-normal normal-case">(mín. 8 caracteres)</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
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
            </form>
          )}

          {/* ── MAGIC LINK ── */}
          {mode === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-xs text-neutral-500 leading-relaxed text-center">Ingresa tu correo y te enviamos un enlace de acceso seguro sin contraseña.</p>
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
                <Mail size={16} />{loading ? 'Enviando...' : 'Enviarme Enlace de Acceso'}
              </button>
            </form>
          )}

          {/* ── ADMIN ── */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <ShieldAlert size={16} className="flex-shrink-0" />
                <span>Acceso exclusivo para administrador. Máx. {MAX_ADMIN_ATTEMPTS} intentos.</span>
              </div>

              {adminBlocked && Date.now() < adminBlockUntil ? (
                <div className="p-4 bg-red-50 border border-red-200 text-center space-y-2">
                  <ShieldAlert size={28} className="mx-auto text-red-500" />
                  <p className="text-xs font-bold text-red-700">Panel bloqueado</p>
                  <p className="text-xs text-red-600">Demasiados intentos fallidos. Intenta en <strong>{remainingBlockMinutes()} min</strong>.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Confirmar Correo Admin *</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="correo de administrador"
                        className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs focus:outline-none focus:border-amber-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Clave Admin * {adminAttempts > 0 && <span className="text-red-500 font-normal normal-case">({MAX_ADMIN_ATTEMPTS - adminAttempts} intento(s) restantes)</span>}
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type={showAdminPass ? 'text' : 'password'} required value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="••••••••••"
                        className="w-full border border-gray-300 pl-9 pr-10 py-3 text-xs focus:outline-none focus:border-amber-400" />
                      <button type="button" onClick={() => setShowAdminPass(!showAdminPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                        {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full bg-[#1b2333] hover:bg-amber-600 text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                    <ShieldAlert size={16} /> Acceder como Administrador
                  </button>
                </>
              )}
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
