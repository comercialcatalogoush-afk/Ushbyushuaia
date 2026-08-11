'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, ArrowRight, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const [mode, setMode] = useState<'login' | 'register' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic simulation — replace with Supabase auth.signInWithPassword
    setTimeout(() => {
      setLoading(false);
      if (email && password) {
        setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
      } else {
        setError('Por favor completa todos los campos.');
      }
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic simulation — replace with Supabase auth.signUp
    setTimeout(() => {
      setLoading(false);
      if (email && password && name) {
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu registro.');
      } else {
        setError('Por favor completa todos los campos.');
      }
    }, 1000);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Simulation — replace with Supabase auth.signInWithOtp
    setTimeout(() => {
      setLoading(false);
      if (email) {
        setSuccess(`¡Listo! Te enviamos un enlace mágico a ${email}. Úsalo para ingresar sin contraseña.`);
      } else {
        setError('Por favor ingresa tu correo electrónico.');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-[#d88193] text-white p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-2 border-white/40">
            <User size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">Mi Cuenta</h1>
          <p className="text-xs text-white/80 mt-1 font-light">USH BY USHUAIA — Clientes Mayoristas</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'login' ? 'bg-[#d88193] text-white' : 'text-neutral-500 hover:text-neutral-800 bg-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'register' ? 'bg-[#d88193] text-white' : 'text-neutral-500 hover:text-neutral-800 bg-white'
            }`}
          >
            Crear Cuenta
          </button>
          <button
            onClick={() => { setMode('magic'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'magic' ? 'bg-[#d88193] text-white' : 'text-neutral-500 hover:text-neutral-800 bg-white'
            }`}
          >
            Solo Correo
          </button>
        </div>

        <div className="p-8 space-y-5">

          {/* Feedback messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <LogIn size={16} />
                {loading ? 'Verificando...' : 'Iniciar Sesión con Correo y Contraseña'}
              </button>

              <p className="text-center text-xs text-neutral-500">
                ¿Sin contraseña?{' '}
                <button type="button" onClick={() => setMode('magic')} className="text-[#d88193] font-bold hover:underline">
                  Entra solo con tu correo →
                </button>
              </p>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d88193] hover:bg-[#c06579] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <ArrowRight size={16} />
                {loading ? 'Creando cuenta...' : 'Crear Mi Cuenta'}
              </button>
            </form>
          )}

          {/* MAGIC LINK FORM (Email Only) */}
          {mode === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-xs text-neutral-500 leading-relaxed text-center">
                Ingresa solo tu correo y te enviaremos un enlace seguro para acceder sin contraseña.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full border border-gray-300 pl-9 pr-3 py-3 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1b2333] hover:bg-[#d88193] text-white font-bold py-3.5 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Mail size={16} />
                {loading ? 'Enviando enlace...' : 'Enviarme Enlace Mágico por Correo'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-700 font-medium">
              ← Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
