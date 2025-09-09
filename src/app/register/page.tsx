export const dynamic = 'force-dynamic';

import AuthForm from '@/components/AuthForm';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);
  
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm mode="register" />
    </div>
  );
}