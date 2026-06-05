import { redirect } from 'next/navigation';
import Header from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import LoginForm from './login-form';

function safeNext(next: string | undefined): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const dest = safeNext(next);

  // 既にログイン済みなら戻り先へ
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(dest);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="max-w-md mx-auto px-4 md:px-6 py-12">
        <h1
          className="text-[#0d1b2a] uppercase mb-2"
          style={{ fontFamily: "'Barlow Condensed', Helvetica, Arial, sans-serif", fontWeight: 700, fontSize: 38, lineHeight: 1 }}
        >
          ようこそ
        </h1>
        <p className="text-[14px] text-[#707072] mb-8">
          ログインすると、お気に入りスポットを登録できます。
        </p>

        <div className="rounded-2xl border border-[#E5E5E5] p-6">
          <LoginForm next={dest} />
        </div>
      </div>
    </main>
  );
}
