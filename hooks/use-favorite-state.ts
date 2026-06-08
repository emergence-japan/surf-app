'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleFavorite } from '@/app/favorites/actions';

// スポット1件分のお気に入り状態を、認証解決〜トグル（上限処理込み）まで一括で扱うフック。
// FavoriteButton と 閲覧ロックのオーバーレイで共有する。
//
// 注: isPremium はクライアントから server-only の判定を呼べないため、現状は常に false。
// フェーズD(課金)でサーバー解決した値をページから渡す形に差し替える。
export interface FavoriteState {
  /** 認証状態の解決が済んだか（解決前はUIを出さずちらつきを防ぐ） */
  resolved: boolean;
  /** ログイン中ユーザーのID。未ログインなら null */
  userId: string | null;
  /** このスポットがお気に入り済みか */
  favorited: boolean;
  /** トグル送信中か */
  isPending: boolean;
  /** 無料プランの上限に達して追加できなかった直近の結果 */
  limitReached: boolean;
  /** 上限案内を手動で閉じる */
  clearLimitReached: () => void;
  /** お気に入りをトグルする */
  toggle: () => void;
}

export function useFavoriteState(spotId: string): FavoriteState {
  const [userId, setUserId] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
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
    if (!userId) { setFavorited(false); return; }
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

  const clearLimitReached = useCallback(() => setLimitReached(false), []);

  const toggle = useCallback(() => {
    setLimitReached(false);
    const optimistic = !favorited;
    setFavorited(optimistic);
    startTransition(async () => {
      try {
        const result = await toggleFavorite(spotId);
        if (result.ok) {
          setFavorited(result.favorited);
        } else {
          // 無料プランの上限 → 楽観的UIを戻して案内を立てる
          setFavorited(false);
          setLimitReached(true);
        }
      } catch {
        setFavorited(!optimistic); // 想定外の失敗はロールバック
      }
    });
  }, [favorited, spotId]);

  return { resolved, userId, favorited, isPending, limitReached, clearLimitReached, toggle };
}
