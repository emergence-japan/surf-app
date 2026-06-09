# 🏄 Surf Vibe Check

西日本のサーフスポット26か所のリアルタイム波予報アプリ。
波高・うねり方向・潮汐・風況を独自アルゴリズムで評価し、今日サーフィンできるかを S/A/B/C/D で判定します。

## 機能

- 🌊 **リアルタイム波情報**: 波の高さ・周期・方向を表示
- 🎯 **コンディション評価**: S/A/B/C/D の5段階グレード（波高 × 風向き × うねり方向 × 潮汐）
- 🏄 **ボード切替**: ショート / ロングで評価基準を切り替え（クライアント側で再計算）
- 🧭 **ベストスウェル判定**: 各スポットに最適なうねりの向きをマッチングしてバッジ表示
- 🗺️ **湾地形モデル**: 湾口角・岬の回折・沖の島の遮蔽を考慮した有効波高計算
- 🌊 **潮汐グラフ**: 気象庁の調和定数による天文潮汐計算（外部 API 不要）
- 📊 **時間別・週間予報**: 詳細チャートとカード形式で予報を表示
- 💨 **気象情報**: 風向・風速、水温、雲量
- ⭐ **お気に入り**: Supabase 認証＋お気に入り登録（無料プランは3件まで）

## 技術スタック

| カテゴリ | 採用技術 |
|---------|---------|
| フレームワーク | Next.js 16 (App Router) |
| フロントエンド | React 19, Tailwind CSS 4, Recharts |
| 波・気象データ | [Open-Meteo API](https://open-meteo.com/)（風: JMA MSM + GFS、波: best_match + GWAM の2モデル平均） |
| 潮汐計算 | 気象庁調和定数による天文潮汐計算（ローカル） |
| 認証・DB | Supabase（ログイン・お気に入り） |
| キャッシュ | Upstash Redis（SWR 方式・Cron で定期更新） |
| エラー監視 | Sentry（オプション） |
| テスト | Vitest（154テスト） |

---

## ローカル開発

### 前提条件

- Node.js 22 以上
- npm 10 以上

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/emergence-japan/surf-app.git
cd surf-app

# 依存パッケージをインストール
npm install

# 環境変数ファイルを作成（Sentry 以外は設定不要）
cp .env.example .env.local

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 開発コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
npm start          # 本番サーバー起動（build 後）
npm test           # ユニットテスト実行
npm run test:watch # テストのウォッチモード
npm run typecheck  # TypeScript 型チェック
```

---

## デプロイ

### Vercel（推奨）

最も簡単な方法です。

1. [Vercel](https://vercel.com) にアカウントを作成してリポジトリをインポート
2. 環境変数を設定（「環境変数」セクション参照。Supabase / Upstash / `CRON_SECRET` など）
3. デプロイ

```bash
# Vercel CLI を使う場合
npm i -g vercel
vercel --prod
```

### Docker

```bash
# イメージをビルドして起動
docker compose up --build

# バックグラウンドで起動
docker compose up -d --build

# ログを確認
docker compose logs -f

# 停止
docker compose down
```

Docker 単体でも実行できます:

```bash
docker build -t surf-app .
docker run -p 3000:3000 --env-file .env.local surf-app
```

### セルフホスト（Node.js）

```bash
npm run build
npm start
```

---

## 環境変数

`.env.example` をコピーして `.env.local` を作成してください。

| 変数名 | 必須 | 説明 |
|-------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 認証利用時 | Supabase プロジェクト URL（CSP の connect-src にも反映） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 認証利用時 | Supabase anon 公開キー |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | 推奨 | 予報キャッシュとレート制限の共有ストア。未設定でも動作するが毎リクエストが Open-Meteo を直撃する |
| `CRON_SECRET` | Cron 利用時 | `/api/cron/refresh-forecast` の認証トークン。未設定だと cron エンドポイントは 503 で無効 |
| `SENTRY_DSN` | 任意 | Sentry の DSN。未設定でも動作します |
| `NEXT_PUBLIC_APP_URL` | 任意 | デプロイ先 URL（例: `https://example.com`） |

---

## アーキテクチャ

```
surf-app/
├── app/
│   ├── api/forecast/route.ts            # 波予報 API（Redis SWR キャッシュ参照）
│   ├── api/cron/refresh-forecast/       # 全スポットのキャッシュ定期更新（要 CRON_SECRET）
│   ├── page.tsx                         # ホーム（スポット一覧）
│   ├── point/[id]/page.tsx              # スポット詳細
│   ├── login/・favorites/               # 認証・お気に入り（Supabase）
│   ├── error.tsx                        # ルートレベルエラーページ
│   └── global-error.tsx                 # グローバルエラーページ
├── components/
│   ├── error-boundary.tsx               # React エラーバウンダリ（再利用可能）
│   ├── forecast-chart.tsx               # 時間別波高チャート
│   ├── tide-chart.tsx                   # 潮汐グラフ
│   └── weekly-forecast.tsx              # 週間予報
├── context/
│   └── forecast-context.tsx             # 波データの状態管理（sessionStorage キャッシュ付き）
├── lib/
│   ├── wave-calculations.ts             # 波高・品質計算（純粋関数・テスト済み）
│   ├── tide-predictor.ts                # 天文潮汐計算（JMA 調和定数）
│   ├── forecast-fetcher.ts              # Open-Meteo 取得＋予報組み立て
│   ├── forecast-cache.ts                # Upstash Redis キャッシュ（SWR）
│   ├── open-meteo-schema.ts             # Open-Meteo レスポンスの Zod 検証
│   ├── rate-limit.ts                    # レート制限（Redis / インメモリ）
│   ├── board-recompute.ts               # ボード切替時のクライアント再計算
│   ├── surf-points/                     # サーフスポット定義（都道府県別・26か所）
│   └── converters.ts                    # 方位変換ユーティリティ
├── middleware.ts                         # レート制限（60 req/分/IP）＋ Supabase セッション更新
├── instrumentation.ts                   # Sentry 初期化
├── Dockerfile                           # マルチステージビルド
├── docker-compose.yml
└── __tests__/                           # ユニットテスト（154テスト）
```

### データフロー

```
Vercel Cron（1時間ごと・要設定）
  └─→ GET /api/cron/refresh-forecast → 全スポットを取得して Redis に書き込み

ブラウザ
  └─→ GET /api/forecast
        └─→ Redis キャッシュ（1時間以内なら fresh をそのまま返す）
              ├─ stale/欠損 → その場でフェッチ（SWR フォールバック）
              │    ├─→ Open-Meteo 気象 API（風向・風速・気象コード）
              │    ├─→ Open-Meteo 海洋 API（波高・波向・周期・水温）
              │    └─→ 天文潮汐計算（ローカル・JMA 調和定数）
              └─ レスポンスは Zod でスキーマ検証
                    ↓
        波高計算 → 品質評価（S/A/B/C/D） → JSON レスポンス（スポット単位の fresh/stale/error 付き）
```

### 品質評価アルゴリズム

波のコンディションを以下の要素で S/A/B/C/D に評価します:

1. **波高スコア**（0.2m 未満=D 固定、0.8〜1.6m が最高スコア）
2. **有効波高補正**（うねり角度・周期による cos 減衰）
3. **風の影響**（オフショア=+1、強オンショア=-3）
4. **ベストうねりボーナス**（方向一致かつ周期 8 秒以上で +1）
5. **周期ペナルティ**（6 秒以下の風波は -1）

---

## テスト

```bash
# 全テスト実行
npm test

# ウォッチモード（開発中）
npm run test:watch
```

**テスト対象**（全154テスト）:
- `__tests__/wave-calculations.test.ts` — 波高計算・品質評価・方位変換
- `__tests__/tide-predictor.test.ts` — 潮汐計算・気象庁公式予測との一致検証・微小潮汐判定
- `__tests__/board-recompute.test.ts` — ボード切替の再計算（時間別・週間）
- `__tests__/open-meteo-schema.test.ts` — 外部 API レスポンスのスキーマ検証
- `__tests__/rate-limit.test.ts` — レート制限
- そのほか認証・お気に入り・プラン上限・キャッシュ等

---

## セキュリティ

| 対策 | 詳細 |
|------|------|
| レート制限 | `/api/*` に 60 req/分/IP。Upstash Redis 設定時はインスタンス間で共有（`lib/rate-limit.ts`） |
| セキュリティヘッダー | CSP・HSTS・X-Frame-Options 等（`next.config.mjs`）。`unsafe-eval` は開発時のみ |
| 入力バリデーション | Zod によるクエリパラメータ検証＋ Open-Meteo レスポンスのスキーマ検証 |
| Cron 認証 | `CRON_SECRET` 必須（未設定時はエンドポイント無効） |
| エラー監視 | Sentry（`SENTRY_DSN` 設定時のみ有効） |
| Docker 非 root 実行 | 専用ユーザー `nextjs` で起動 |

---

## CI/CD

GitHub Actions で以下を自動実行（`.github/workflows/ci.yml`）:

1. TypeScript 型チェック（`tsc --noEmit`）
2. ESLint（`next lint`）
3. ユニットテスト（`vitest run`）
4. 本番ビルド（`next build`）

`main` ブランチへの push / PR でトリガーされます。
