import { redirect } from 'next/navigation';

// Grupos VIP page removed — redirect to homepage
export default function GruposPage() {
  redirect('/');
}
