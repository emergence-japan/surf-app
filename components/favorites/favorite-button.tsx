'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toggleFavorite } from '@/app/favorites/actions';

// スポット詳細のヒーローに置く★ボタン。
// 未ログイン: ログイン画面へのリンク（元スポットに戻る）。
// ログイン中: お気に入りのトグル（楽観的UI）。
export default function FavoriteButton({ spotId }: { spotId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 認証状態を解決
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setResolved(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setResolved(true);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  // ログイン確定後、初期のお気に入り状態を取得
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let active = true;
    supabase
      .from('favorites')
      .select('spot_id')
      .eq('user_id', userId)
      .eq('spot_id', spotId)
      .maybeSingle()
      .then(({ data }) => { if (active) setFavorited(data !== null); });
    return () => { active = false; };
  }, [userId, spotId]);

  const baseClass =
    'inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/20 transition-all duration-150 active:scale-95';

  // 解決前: レイアウトシフト防止のプレースホルダ
  if (!resolved) return <div className="w-10 h-10" aria-hidden />;

  // 未ログイン: ログインへ誘導
  if (!userId) {
    return (
      <Link
        href={`/login?next=/point/${spotId}`}
        aria-label="お気に入りに追加（ログインが必要）"
        className={`${baseClass} text-white hover:bg-black/50`}
      >
        <Star size={18} />
      </Link>
    );
  }

  // ログイン中: トグル
  function handleToggle() {
    const optimistic = !favorited;
    setFavorited(optimistic);
    startTransition(async () => {
      try {
        const { favorited: settled } = await toggleFavorite(spotId);
        setFavorited(settled);
      } catch {
        setFavorited(!optimistic); // ロールバック
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={favorited}
      aria-label={favorited ? 'お気に入りから外す' : 'お気に入りに追加'}
      className={`${baseClass} disabled:opacity-70 ${favorited ? 'text-[#06b6d4]' : 'text-white hover:bg-black/50'}`}
    >
      <Star size={18} fill={favorited ? '#06b6d4' : 'none'} />
    </button>
  );
}
