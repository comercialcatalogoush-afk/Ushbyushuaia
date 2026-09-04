import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CatalogoDigitalPage() {
  // Redirigir al catálogo principal ya que el catálogo PDF fue retirado
  redirect('/catalogo');
}
