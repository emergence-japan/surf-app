-- Phase B: favorites テーブル
-- このSQLは Supabase の SQL Editor で一度だけ手動実行する（本プロジェクトにマイグレーション実行基盤は無い）。

create table if not exists public.favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  spot_id    text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

-- 「自分のお気に入りを新しい順に取得」を高速化するインデックス。
create index if not exists favorites_user_id_created_at_idx
  on public.favorites (user_id, created_at desc);

-- 行レベルセキュリティ（RLS）を有効化。RLS有効＋ポリシー無しの状態では全アクセスが拒否される。
alter table public.favorites enable row level security;

-- 自分のお気に入りだけ参照できる。
create policy "favorites_select_own"
  on public.favorites
  for select
  using (auth.uid() = user_id);

-- 自分の行だけ追加できる。
create policy "favorites_insert_own"
  on public.favorites
  for insert
  with check (auth.uid() = user_id);

-- 自分の行だけ削除できる。
create policy "favorites_delete_own"
  on public.favorites
  for delete
  using (auth.uid() = user_id);
