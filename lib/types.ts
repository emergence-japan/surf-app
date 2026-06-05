// Shared TypeScript type definitions for the Surf Forecast App
import type { BreakProfile } from './surf-points';

export type QualityLevel = 'S' | 'A' | 'B' | 'C' | 'D';

export type BoardType = 'short' | 'long';

// 評価（Quality）の内訳要因。なぜその評価になったかをUIで説明するために使う。
// delta が正なら加点、負なら減点。0 は中立（影響なし）。
export interface QualityFactor {
    label: string;  // 例: '腰〜腹のサイズ' / '短周期の風波' / '満潮（ワイド気味）'
    delta: number;  // スコアへの寄与（+4, -1, 0 など）
}

// Basic surf point summary (used in list view)
export interface SurfPointSummary {
    id: string;
    beach: string;
    height: string; // e.g. "hip - chest"
    heightValue: number;
    period?: number;
    windSpeed?: number;
    windDirection: string;
    temperature: number | null; // 水温 [℃]。データ欠損時は null（不明）
    quality: QualityLevel;
}

// Hourly forecast data
export interface HourlyForecastData {
    time: string;
    waveHeight: number;
    rawWaveHeight?: number;
    waveLabel: string;
    waveRange: string;
    period: number;
    windSpeed: number;
    windDir: string;
    quality: QualityLevel;
    tide?: number;
    // スウェル分離データ
    swellHeight?: number;       // グラウンドスウェル有効波高 [m]
    windWaveHeight?: number;    // 風波有効波高 [m]
    isSwellDominant?: boolean;  // スウェルが風波より支配的か
}

// Daily forecast data
export interface DailyForecastData {
    time: string;
    waveHeight: number;
    rawWaveHeight: number;
    waveLabel: string;
    windSpeedMax: number;
    windDir: string;
    temperatureMax: number | null; // 水温 [℃]。データ欠損時は null（不明）
    temperatureMin: number | null;
    weatherCode: number;
    quality: QualityLevel;
}

// Detailed surf point data (used in detail view)
export interface SurfPointDetail extends SurfPointSummary {
    heightMeters: number;
    heightRange: string;
    rawSwellHeight: number;
    waveDirectionStr: string;
    waveDirectionDeg: number;
    isBestSwell: boolean;
    beachFacing: string;
    breakProfile?: BreakProfile;
    qualityFactors?: QualityFactor[]; // 現在の評価の内訳（なぜこの評価か）
    visibility?: number;
    cloudCover?: number;
    conditionSummary: string;
    hourly: HourlyForecastData[];
    daily: DailyForecastData[];
    // スウェル分離データ
    swellHeight?: number;       // グラウンドスウェル有効波高 [m]
    swellDirStr?: string;       // スウェル方向
    swellPeriod?: number;       // スウェル周期 [s]
    windWaveHeight?: number;    // 風波有効波高 [m]
    isSwellDominant?: boolean;  // スウェルが風波より支配的か
}

// Tide chart data point
export interface TideDataPoint {
    time: string;
    height: number;
}

// API: forecast レスポンスの 1 スポット分エンベロープ
export type SpotFetchStatus = 'fresh' | 'stale' | 'error';

export interface SpotForecastEnvelope {
    id: string;
    name: string;
    status: SpotFetchStatus;
    fetchedAt: number | null;  // epoch ms（error 時は null）
    data: SurfPointDetail | null;
    error?: string;
}

export interface ForecastApiResponse {
    spots: SpotForecastEnvelope[];
    meta: {
        total: number;
        fresh: number;
        stale: number;
        error: number;
        servedAt: number; // epoch ms
    };
}
