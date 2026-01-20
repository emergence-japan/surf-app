# Surf Vibe Check (サーフ波情報アプリ)

日本全国の主要サーフポイントの波情報（波高、うねり向き、風、天気）をリアルタイムで確認できるアプリです。
Open-Meteo APIを使用しており、特定の風向きやうねりにマッチするポイントを自動判定します。

## 機能

*   🌊 **リアルタイム波情報**: 波の高さ、周期、方向を表示
*   🧭 **ベストスウェル判定**: 各ポイントに最適なうねりの向きを判定し「MATCHING SWELL」バッジを表示
*   🗾 **全国対応**: 北海道から沖縄まで主要ポイントを網羅
*   💨 **気象情報**: 風向・風速、気温、視程、雲量なども表示

## 実行方法

このアプリをお手元のPCで動かすための手順です。

### 1. 前提条件

*   [Node.js](https://nodejs.org/) がインストールされていること (v18以上推奨)

### 2. ダウンロード (Clone)

ターミナルで以下のコマンドを実行して、コードをダウンロードします。

```bash
git clone https://github.com/emergence-japan/surf-app.git
cd surf-app
```

### 3. インストール

必要なライブラリをインストールします。

```bash
npm install
# または pnpm install / yarn install
```

### 4. 起動

開発サーバーを立ち上げます。

```bash
npm run dev
```

コマンド実行後、ブラウザで [http://localhost:3000](http://localhost:3000) を開くとアプリが使えます。

## 技術スタック

*   Next.js (App Router)
*   TypeScript
*   Tailwind CSS
*   Lucide React (Icons)
*   Open-Meteo API (Free Weather Data)
