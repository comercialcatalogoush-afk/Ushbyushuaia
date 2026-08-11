import React from 'react';
import Link from 'next/link';
import { User, LogIn, ShoppingBag } from 'lucide-react';

export const metadata = {
  title: 'Mi Cuenta | Ush By Ushuaia',
  description: 'Gestión de cuenta y seguimiento a pedidos mayoristas.',
};

export default function ProfilePage() {
  return (
    <div className="py-20 bg-neutral-50 min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white p-8 border border-gray-200 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 bg-neutral-100 text-neutral-800 rounded-full flex items-center justify-center mx-auto">
          <User size={32} />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            Acceso a Clientes
          </span>
          <h1 className="text-2xl font-black uppercase text-neutral-900 mt-1">
            Iniciar Sesión / Registro
          </h1>
          <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
            Ingresa para gestionar tus pedidos guardados, descargar facturas y consultar el historial de compras mayoristas.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/checkout"
            className="block w-full bg-neutral-900 text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors shadow-md"
          >
            Ver Mis Pedidos
          </Link>
          
          <Link
            href="/"
            className="block text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black py-2"
          >
            Volver a la Tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
