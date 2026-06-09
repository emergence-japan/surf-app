import { redirect } from 'next/navigation';
import Header from '@/components/header';
import { createClient } from '@/lib/supabase/server';
import { listFavoriteSpotIds } from '@/lib/favorites/favorites';
import FavoritesList from '@/components/favorites/favorites-list';

// ユーザーのログイン状態に依存するため、ビルド時の静的生成を無効化し
// リクエストごとに動的レンダリングする（プリレンダリングでの env 参照を防ぐ）。
export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  // 認証ガード（未ログインはログインへ、戻り先は /favorites）
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login?next=/favorites');

  const spotIds = await listFavoriteSpotIds();

  return (
    <main className="min-h-screen bg-white pb-20">
      <Header />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <h1
          className="text-[#0d1b2a] uppercase mb-6"
          style={{ fontFamily: "'Barlow Condensed', Helvetica, Arial, sans-serif", fontWeight: 700, fontSize: 34, lineHeight: 1 }}
        >
          お気に入り
        </h1>
        <FavoritesList spotIds={spotIds} />
      </div>
    </main>
  );
}
