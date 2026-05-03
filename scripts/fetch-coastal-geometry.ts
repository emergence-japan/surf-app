/**
 * 海岸地形データ自動取得スクリプト
 *
 * Overpass API（OpenStreetMap）から各サーフスポット周辺の海岸線・岬データを取得し、
 * 湾の開口角度・方向・回折係数を計算して surf-points.ts に反映する値を出力する。
 *
 * 使い方:
 *   npx tsx scripts/fetch-coastal-geometry.ts
 *
 * 出力:
 *   各スポットの bayGeometry パラメータを JSON で標準出力に表示
 */

import { surfPoints } from '../lib/surf-points';

// --- 型定義 ---

interface LatLon {
  lat: number;
  lon: number;
}

interface Obstacle {
  type: 'island' | 'islet' | 'reef';
  bearing: number;
  distanceKm: number;
  name?: string;
}

interface BayGeometry {
  type: 'open' | 'semi-enclosed' | 'enclosed';
  openingAngle: number;   // 湾口の開き角度（度）
  openingDir: number;     // 湾口の向き（度、0=北）
  openingDirStr: string;  // 湾口の向き（16方位文字列）
  diffractionFactor: number; // 回折係数 0.0〜1.0
  convergenceFactor: number; // 収束係数（>1.0=波が集まる、<1.0=分散）
  headlands: Array<{ bearing: number; distanceKm: number; name?: string }>;
  obstacles: Obstacle[];  // 沖の島・岩礁（スウェルを部分的にブロック）
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
  nodes?: number[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// --- 地理計算ユーティリティ ---

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 2点間の距離（km）: Haversine公式 */
function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** from から to への方位角（度、0=北、時計回り）*/
function bearing(from: LatLon, to: LatLon): number {
  const dLon = toRad(to.lon - from.lon);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** 度数を16方位文字列に変換 */
function degreesToDir16(deg: number): string {
  const dirs = [
    'N','NNE','NE','ENE','E','ESE','SE','SSE',
    'S','SSW','SW','WSW','W','WNW','NW','NNW',
  ];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

/**
 * 海岸線ポイント群から湾の開口角度・方向を求める
 *
 * アルゴリズム:
 * 1. スポットから各海岸線ポイントへの方位角を計算
 * 2. 方位角のリストで「最大のギャップ」を探す
 *    → ギャップ = 海岸線ポイントが存在しない方向 = 海がある方向
 * 3. ギャップの中心が openingDir（ビーチから見た海の向き）
 * 4. beachFacingDir を渡して整合性を確認し、180°ずれている場合は反転する
 *    （海岸線データが海側ではなく内陸側に偏っている場合の補正）
 */
function findBayOpening(
  coastlinePoints: LatLon[],
  spot: LatLon,
  beachFacingDeg: number
): { openingAngle: number; openingDir: number } {
  if (coastlinePoints.length < 3) {
    return { openingAngle: 360, openingDir: beachFacingDeg };
  }

  // 方位角を計算してソート
  const bearings = coastlinePoints
    .map((c) => bearing(spot, c))
    .sort((a, b) => a - b);

  // 連続する方位角の差（ギャップ）を計算
  let maxGap = 0;
  let gapStart = 0;

  for (let i = 0; i < bearings.length; i++) {
    const next = bearings[(i + 1) % bearings.length];
    const gap = i === bearings.length - 1
      ? (bearings[0] + 360 - bearings[i])
      : next - bearings[i];
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = bearings[i];
    }
  }

  let openingDir = (gapStart + maxGap / 2) % 360;

  // beachFacingDeg との角度差を確認
  // 海の向き（openingDir）はビーチの向き（beachFacingDeg）とほぼ一致するはず
  // 90°以上ずれている場合は海岸線データが逆になっているので反転する
  let diff = Math.abs(openingDir - beachFacingDeg);
  if (diff > 180) diff = 360 - diff;
  if (diff > 90) {
    openingDir = (openingDir + 180) % 360;
  }

  return { openingAngle: Math.round(maxGap), openingDir: Math.round(openingDir) };
}

/** 開口角度から湾タイプを判定 */
function classifyBayType(
  openingAngle: number
): 'open' | 'semi-enclosed' | 'enclosed' {
  if (openingAngle > 240) return 'open';
  if (openingAngle > 120) return 'semi-enclosed';
  return 'enclosed';
}

/**
 * 回折係数を計算
 *
 * 湾の閉塞度と岬の存在に基づく係数:
 * - open beach: 1.0（減衰なし）
 * - semi-enclosed: 0.6〜0.9（岬による回り込み減衰）
 * - enclosed: 0.3〜0.6（大きく減衰するが回折で届く）
 */
function calcDiffractionFactor(
  openingAngle: number,
  nearestHeadlandDistKm: number | null
): number {
  const baseFactor = Math.min(1.0, openingAngle / 180);

  // 岬が近いほど回折の影響が大きい（逆説的に波が回り込む）
  if (nearestHeadlandDistKm !== null && nearestHeadlandDistKm < 2) {
    return Math.max(0.2, baseFactor * 0.6);
  }
  if (nearestHeadlandDistKm !== null && nearestHeadlandDistKm < 5) {
    return Math.max(0.3, baseFactor * 0.8);
  }
  return Math.max(0.4, baseFactor);
}

/**
 * 収束係数を計算
 *
 * 湾の形状によって波エネルギーが集中・分散する:
 * - 湾奥に向かって狭まる形状 → 収束（>1.0）
 * - 湾奥に向かって広がる形状 → 分散（<1.0）
 * 開口角度から簡易推定
 */
function calcConvergenceFactor(openingAngle: number): number {
  if (openingAngle < 60) return 1.2;   // 深い湾: 波が集中
  if (openingAngle < 120) return 1.1;
  if (openingAngle < 180) return 1.0;
  if (openingAngle < 270) return 0.9;  // 開けたビーチ: 分散
  return 0.85;
}

// --- Overpass API クエリ ---

/** 指定座標周辺の海岸線・岬・島・岩礁データを取得 */
async function fetchCoastalData(
  spot: LatLon,
  radiusM = 8000
): Promise<OverpassResponse> {
  const query = `
[out:json][timeout:30];
(
  way["natural"="coastline"](around:${radiusM},${spot.lat},${spot.lon});
  node["natural"="cape"](around:${radiusM},${spot.lat},${spot.lon});
  way["natural"="cape"](around:${radiusM},${spot.lat},${spot.lon});
  node["place"="islet"](around:${radiusM},${spot.lat},${spot.lon});
  node["place"="island"](around:${radiusM},${spot.lat},${spot.lon});
  way["place"="island"](around:${radiusM},${spot.lat},${spot.lon});
  way["place"="islet"](around:${radiusM},${spot.lat},${spot.lon});
  node["natural"="reef"](around:${radiusM},${spot.lat},${spot.lon});
  way["natural"="reef"](around:${radiusM},${spot.lat},${spot.lon});
);
out body geom;
  `.trim();

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'wave-forecast-app/1.0 (coastal geometry analysis)',
    },
  });

  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<OverpassResponse>;
}

/** Overpass レスポンスから海岸線ポイントと岬を抽出 */
function extractCoastalFeatures(
  data: OverpassResponse,
  spot: LatLon,
  radiusKm: number
): {
  coastlinePoints: LatLon[];
  headlands: Array<{ bearing: number; distanceKm: number; name?: string }>;
  obstacles: Obstacle[];
} {
  const coastlinePoints: LatLon[] = [];
  const headlands: Array<{ bearing: number; distanceKm: number; name?: string }> = [];
  const obstacles: Obstacle[] = [];

  for (const el of data.elements) {
    // 海岸線ウェイ
    if (el.type === 'way' && el.tags?.['natural'] === 'coastline' && el.geometry) {
      // 均等サンプリング（多すぎると計算が重い）
      const step = Math.max(1, Math.floor(el.geometry.length / 20));
      for (let i = 0; i < el.geometry.length; i += step) {
        const pt = el.geometry[i];
        const dist = haversineKm(spot, pt);
        if (dist <= radiusKm && dist > 0.05) {
          coastlinePoints.push(pt);
        }
      }
    }

    // 岬ノード
    if (
      el.type === 'node' &&
      el.tags?.['natural'] === 'cape' &&
      el.lat !== undefined &&
      el.lon !== undefined
    ) {
      const pt = { lat: el.lat, lon: el.lon };
      const dist = haversineKm(spot, pt);
      if (dist <= radiusKm && dist > 0.05) {
        headlands.push({
          bearing: Math.round(bearing(spot, pt)),
          distanceKm: Math.round(dist * 10) / 10,
          name: el.tags['name'] ?? el.tags['name:ja'],
        });
      }
    }

    // 岬ウェイ（重心を使う）
    if (
      el.type === 'way' &&
      el.tags?.['natural'] === 'cape' &&
      el.geometry &&
      el.geometry.length > 0
    ) {
      const centroid: LatLon = {
        lat: el.geometry.reduce((s, p) => s + p.lat, 0) / el.geometry.length,
        lon: el.geometry.reduce((s, p) => s + p.lon, 0) / el.geometry.length,
      };
      const dist = haversineKm(spot, centroid);
      if (dist <= radiusKm && dist > 0.05) {
        headlands.push({
          bearing: Math.round(bearing(spot, centroid)),
          distanceKm: Math.round(dist * 10) / 10,
          name: el.tags?.['name'] ?? el.tags?.['name:ja'],
        });
      }
    }

    // 島・小島・岩礁（ノード）
    const placeTag = el.tags?.['place'];
    const naturalTag = el.tags?.['natural'];
    const obstacleType: Obstacle['type'] | null =
      placeTag === 'islet' ? 'islet' :
      placeTag === 'island' ? 'island' :
      naturalTag === 'reef' ? 'reef' : null;

    if (
      obstacleType &&
      el.type === 'node' &&
      el.lat !== undefined &&
      el.lon !== undefined
    ) {
      const pt = { lat: el.lat, lon: el.lon };
      const dist = haversineKm(spot, pt);
      if (dist <= radiusKm && dist > 0.05) {
        obstacles.push({
          type: obstacleType,
          bearing: Math.round(bearing(spot, pt)),
          distanceKm: Math.round(dist * 100) / 100,
          name: el.tags?.['name'] ?? el.tags?.['name:ja'],
        });
      }
    }

    // 島・岩礁（ウェイ、重心を使う）
    if (
      obstacleType &&
      el.type === 'way' &&
      el.geometry &&
      el.geometry.length > 0
    ) {
      const centroid: LatLon = {
        lat: el.geometry.reduce((s, p) => s + p.lat, 0) / el.geometry.length,
        lon: el.geometry.reduce((s, p) => s + p.lon, 0) / el.geometry.length,
      };
      const dist = haversineKm(spot, centroid);
      if (dist <= radiusKm && dist > 0.05) {
        obstacles.push({
          type: obstacleType,
          bearing: Math.round(bearing(spot, centroid)),
          distanceKm: Math.round(dist * 100) / 100,
          name: el.tags?.['name'] ?? el.tags?.['name:ja'],
        });
      }
    }
  }

  return { coastlinePoints, headlands, obstacles };
}

const DIRS16 = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'] as const;
function dirToDeg(dir: string): number {
  const i = DIRS16.indexOf(dir as typeof DIRS16[number]);
  return i === -1 ? 0 : i * 22.5;
}

/** 1スポットの bayGeometry を計算 */
async function analyzeBayGeometry(
  spot: { id: string; name: string; lat: number; lon: number; beachFacing: string }
): Promise<BayGeometry> {
  console.error(`  Fetching: ${spot.name} (${spot.lat}, ${spot.lon})`);

  const data = await fetchCoastalData({ lat: spot.lat, lon: spot.lon });
  const { coastlinePoints, headlands, obstacles } = extractCoastalFeatures(
    data,
    { lat: spot.lat, lon: spot.lon },
    8
  );

  console.error(`    coastline points: ${coastlinePoints.length}, headlands: ${headlands.length}, obstacles: ${obstacles.length}`);

  const beachFacingDeg = dirToDeg(spot.beachFacing);
  const { openingAngle, openingDir } = findBayOpening(
    coastlinePoints,
    { lat: spot.lat, lon: spot.lon },
    beachFacingDeg
  );

  const nearestHeadland = headlands.length > 0
    ? Math.min(...headlands.map((h) => h.distanceKm))
    : null;

  const diffractionFactor = calcDiffractionFactor(openingAngle, nearestHeadland);
  const convergenceFactor = calcConvergenceFactor(openingAngle);
  const type = classifyBayType(openingAngle);

  return {
    type,
    openingAngle,
    openingDir,
    openingDirStr: degreesToDir16(openingDir),
    diffractionFactor: Math.round(diffractionFactor * 100) / 100,
    convergenceFactor: Math.round(convergenceFactor * 100) / 100,
    headlands: headlands.sort((a, b) => a.distanceKm - b.distanceKm),
    obstacles: obstacles.sort((a, b) => a.distanceKm - b.distanceKm),
  };
}

// --- メイン処理 ---

async function main() {
  console.error('=== 海岸地形データ取得開始 ===\n');

  const results: Record<string, BayGeometry> = {};

  for (const spot of surfPoints) {
    try {
      const geo = await analyzeBayGeometry(spot);
      results[spot.id] = geo;

      // Overpass API への負荷を避けるため 1.5 秒待機
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ERROR for ${spot.name}:`, err);
    }
  }

  console.error('\n=== 取得完了 ===\n');

  // surf-points.ts に貼り付けられる形式で出力
  console.log('// ===== fetch-coastal-geometry.ts の出力結果 =====');
  console.log('// 以下を surf-points.ts の各スポットに bayGeometry として追加してください\n');

  for (const spot of surfPoints) {
    const geo = results[spot.id];
    if (!geo) continue;
    console.log(`// ${spot.name} (${spot.id})`);
    console.log(`bayGeometry: ${JSON.stringify(geo, null, 2)},`);
    console.log('');
  }

  // JSON 形式でも出力（プログラム的に使いやすい）
  console.error('\n=== JSON出力 ===');
  console.error(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
