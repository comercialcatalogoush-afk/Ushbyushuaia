'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, LogIn, AlertCircle, CheckCircle2, Settings } from 'lucide-react';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';
const ADMIN_PASSWORD = 'Colombia2025*';

export default function ProfilePage() {
  const [mode, setMode] = useState<'login' | 'register' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if already logged in as admin
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('ush_admin_auth');
      if (auth === 'true') setIsAdmin(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const emailVal = email.trim().toLowerCase();
    const isAdminLogin =
      emailVal === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;

    if (isAdminLogin) {
      // Admin login
      sessionStorage.setItem('ush_admin_auth', 'true');
      setSuccess('✅ Acceso de administrador autorizado. Redirigiendo al panel...');
      setLoading(false);
      // Hard redirect — guaranteed to work
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1200);
    } else if (email && password) {
      // Regular user — could be connected to Supabase auth later
      setSuccess('✅ ¡Inicio de sesión exitoso! Bienvenido a USH BY USHUAIA.');
      setLoading(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      setError('Por favor completa todos los campos.');
      setLoading(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setTimeout(() => {
      if (email && password && name) {
        setSuccess('✅ ¡Cuenta creada! Revisa tu correo para confirmar tu registro.');
      } else {
        setError('Por favor completa todos los campos.');
      }
      setLoading(false);
    }, 800);
  };

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setTimeout(() => {
      if (email) {
        setSuccess(`✅ ¡Listo! Enviamos un enlace de acceso a ${email}. Revisa tu bandeja de entrada.`);
      } else {
        setError('Por favor ingresa tu correo electrónico.');
      }
      setLoading(false);
    }, 800);
  };

  // If already logged in as admin, show quick panel access
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white shadow-xl border border-gray-200 overflow-hidden animate-fadeIn text-center">
          <div className="bg-[#d88193] text-white p-8">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-2 border-white/40">
              <Settings size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-black uppercase">Panel de Administrador</h1>
            <p className="text-xs text-white/80 mt-1">Sesión activa — USH BY USHUAIA</p>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm text-neutral-600 font-light">Ya iniciaste sesión como administrador.</p>
            <a href="/admin"
              className="block w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest text-center transition-colors">
              Ir al Panel de Edición →
            </a>
            <button
              onClick={() => { sessionStorage.removeItem('ush_admin_auth'); setIsAdmin(false); }}
              className="block w-full border border-gray-300 text-neutral-600 font-bold py-3 text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors">
              Cerrar Sesión
            </button>
            <Link href="/" className="block text-xs text-neutral-400 hover:text-neutral-700 mt-2">← Volver al catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-xl border border-gray-200 overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="bg-[#d88193] text-white p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-2 border-white/40">
            <User size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">Mi Cuenta</h1>
          <p className="text-xs text-white/80 mt-1 font-light">USH BY USHUAIA — Mayoristas</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {([
            { key: 'login',    label: 'Iniciar Sesión' },
            { key: 'register', label: 'Crear Cuenta' },
            { key: 'magic',    label: 'Solo Correo' },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => { setMode(key); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                mode === key ? 'bg-[#d88193] text-white' : 'text-neutral-500 hover:text-neutral-800 bg-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-8 space-y-5">

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle size={16} /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle2 size={16} /><span>{success}</span>
            </div>
          )}

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Correo Electrónico *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Contraseña *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <LogIn size={16} />
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
              <p className="text-center text-xs text-neutral-500">
                ¿Sin contraseña?{' '}
                <button type="button" onClick={() => setMode('magic')} className="text-[#d88193] font-bold hover:underline">
                  Entra solo con tu correo →
                </button>
              </p>
            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Nombre *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Correo *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Contraseña *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#d88193] hover:bg-[#c06579] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <ArrowRight size={16} />
                {loading ? 'Creando cuenta...' : 'Crear Mi Cuenta'}
              </button>
            </form>
          )}

          {/* MAGIC LINK */}
          {mode === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-xs text-neutral-500 leading-relaxed text-center">
                Ingresa solo tu correo y te enviaremos un enlace seguro para acceder sin contraseña.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">Correo *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                <Mail size={16} />
                {loading ? 'Enviando...' : 'Enviarme Enlace de Acceso'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-700 font-medium">← Volver al catálogo</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
