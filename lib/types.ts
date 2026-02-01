// Shared TypeScript type definitions for the Surf Forecast App

export type QualityLevel = 'S' | 'A' | 'B' | 'C' | 'D';

// Basic surf point summary (used in list view)
export interface SurfPointSummary {
    id: string;
    beach: string;
    height: string; // e.g. "hip - chest"
    heightValue: number;
    period?: number;
    windSpeed?: number;
    windDirection: string;
    temperature: number;
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
}

// Daily forecast data
export interface DailyForecastData {
    time: string;
    waveHeight: number;
    rawWaveHeight: number;
    waveLabel: string;
    windSpeedMax: number;
    windDir: string;
    temperatureMax: number;
    temperatureMin: number;
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
    visibility?: number;
    cloudCover?: number;
    hourly: HourlyForecastData[];
    daily: DailyForecastData[];
}

// Tide chart data point
export interface TideDataPoint {
    time: string;
    height: number;
}
