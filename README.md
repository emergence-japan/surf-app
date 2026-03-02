# 🏄 Surf Vibe Check

日本の主要サーフスポット11か所のリアルタイム波予報アプリ。
波高・うねり方向・潮汐・風況を独自アルゴリズムで評価し、今日サーフィンできるかを S/A/B/C/D で判定します。

## 機能

- 🌊 **リアルタイム波情報**: 波の高さ・周期・方向を表示
- 🎯 **コンディション評価**: S/A/B/C/D の5段階グレード（波高 × 風向き × うねり方向）
- 🧭 **ベストスウェル判定**: 各スポットに最適なうねりの向きをマッチングしてバッジ表示
- 🌊 **潮汐グラフ**: 気象庁の調和定数による天文潮汐計算（外部 API 不要）
- 📊 **時間別・週間予報**: 詳細チャートとカード形式で予報を表示
- 💨 **気象情報**: 風向・風速、水温、雲量

## 技術スタック

| カテゴリ | 採用技術 |
|---------|---------|
| フレームワーク | Next.js 16 (App Router) |
| フロントエンド | React 19, Tailwind CSS 4, Recharts |
| 波・気象データ | [Open-Meteo API](https://open-meteo.com/)（無料・認証不要） |
| 潮汐計算 | 気象庁調和定数による天文潮汐計算（ローカル） |
| エラー監視 | Sentry（オプション） |
| テスト | Vitest（49テスト） |

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
npm run lint       # ESLint
```

---

## デプロイ

### Vercel（推奨）

最も簡単な方法です。

1. [Vercel](https://vercel.com) にアカウントを作成してリポジトリをインポート
2. 環境変数を設定（`SENTRY_DSN` のみ。その他は不要）
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
| `SENTRY_DSN` | 任意 | Sentry の DSN。未設定でも動作します |
| `NEXT_PUBLIC_APP_URL` | 任意 | デプロイ先 URL（例: `https://example.com`） |

---

## アーキテクチャ

```
surf-app/
├── app/
│   ├── api/forecast/route.ts   # 波予報 API（Open-Meteo を集約・1時間キャッシュ）
│   ├── page.tsx                # ホーム（スポット一覧）
│   ├── point/[id]/page.tsx     # スポット詳細
│   ├── error.tsx               # ルートレベルエラーページ
│   └── global-error.tsx        # グローバルエラーページ
├── components/
│   ├── error-boundary.tsx      # React エラーバウンダリ（再利用可能）
│   ├── forecast-chart.tsx      # 時間別波高チャート
│   ├── tide-chart.tsx          # 潮汐グラフ
│   └── weekly-forecast.tsx     # 週間予報
├── context/
│   └── forecast-context.tsx    # 波データの状態管理（sessionStorage キャッシュ付き）
├── lib/
│   ├── wave-calculations.ts    # 波高・品質計算（純粋関数・テスト済み）
│   ├── tide-predictor.ts       # 天文潮汐計算（JMA 調和定数）
│   ├── surf-points.ts          # サーフスポット定義（11か所）
│   └── converters.ts           # 方位変換ユーティリティ
├── middleware.ts                # レート制限（60 req/分/IP）
├── instrumentation.ts          # Sentry 初期化
├── Dockerfile                  # マルチステージビルド
├── docker-compose.yml
└── __tests__/                  # ユニットテスト（49テスト）
```

### データフロー

```
ブラウザ
  └─→ GET /api/forecast（Next.js ISR・1時間キャッシュ）
        ├─→ Open-Meteo 気象 API（風向・風速・気象コード）
        ├─→ Open-Meteo 海洋 API（波高・波向・周期・水温）
        └─→ 天文潮汐計算（ローカル・JMA 調和定数）
              ↓
        波高計算 → 品質評価（S/A/B/C/D） → JSON レスポンス
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

**テスト対象**:
- `__tests__/wave-calculations.test.ts` — 波高計算・品質評価・方位変換（36テスト）
- `__tests__/tide-predictor.test.ts` — 潮汐計算・観測局別検証（13テスト）

---

## セキュリティ

| 対策 | 詳細 |
|------|------|
| レート制限 | `/api/*` に 60 req/分/IP（`middleware.ts`） |
| セキュリティヘッダー | CSP・HSTS・X-Frame-Options 等（`next.config.mjs`） |
| 入力バリデーション | Zod によるクエリパラメータ検証 |
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
