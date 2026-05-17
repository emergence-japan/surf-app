import type { TideStationKey } from '../tide-predictor';

export interface Obstacle {
  type: 'island' | 'islet' | 'reef';
  bearing: number;       // スポットからの方位（度）
  distanceKm: number;    // スポットからの距離（km）
  name?: string;
}

export interface BayGeometry {
  type: 'open' | 'semi-enclosed' | 'enclosed';
  openingAngle: number;      // 湾口の開き角度（度）: 360=完全オープン, 60=深い湾
  openingDir: number;        // 湾口の向き（度、0=北）
  openingDirStr: string;     // 湾口の向き（16方位）
  diffractionFactor: number; // 回折係数 0.0〜1.0（岬の影でも波が回り込む度合い）
  convergenceFactor: number; // 収束係数（>1.0=湾奥に波が集まる、<1.0=分散）
  headlands: Array<{
    bearing: number;
    distanceKm: number;
    name?: string;
  }>;
  obstacles?: Obstacle[];    // 沖の島・岩礁（スウェルを部分的に遮蔽）
}

export interface SurfPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bestSwell?: string;
  note?: string;
  beachFacing: string;
  tideStation: TideStationKey;
  bayGeometry?: BayGeometry; // fetch-coastal-geometry.ts で自動取得・確認済みの値
}
