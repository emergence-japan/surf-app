import { describe, it, expect } from 'vitest';
import { parseWeatherResponse, parseMarineResponse } from '@/lib/open-meteo-schema';

const validMarine = {
  latitude: 33.5,
  longitude: 134.3,
  current: { wave_height: 1.2, wave_direction: 180, wave_period: 9.5 },
  hourly: {
    time: ['2026-06-10T00:00', '2026-06-10T01:00'],
    wave_height_marine_best_match: [1.2, 1.3],
    wave_height_gwam: [1.1, null],
  },
  daily: {
    time: ['2026-06-10'],
    wave_height_max_best_match: [1.5],
  },
};

const validWeather = {
  current: { wind_speed_10m: 12.5, wind_direction_10m: 200, cloud_cover: 40 },
  hourly: {
    time: ['2026-06-10T00:00'],
    wind_speed_10m_jma_msm: [10.0],
  },
};

describe('parseMarineResponse', () => {
  it('正常なレスポンスを受け付ける', () => {
    const result = parseMarineResponse(validMarine);
    expect(result.current?.wave_height).toBe(1.2);
    expect(result.hourly.time).toHaveLength(2);
    expect(result.hourly.wave_height_gwam?.[1]).toBeNull();
  });

  it('未知のフィールド（メタデータ等）は無視される', () => {
    const result = parseMarineResponse(validMarine);
    expect(result).not.toHaveProperty('latitude');
  });

  it('Open-Meteo のエラーレスポンスは reason 付きで失敗する', () => {
    expect(() => parseMarineResponse({ error: true, reason: 'invalid coordinates' }))
      .toThrow(/wave API error: invalid coordinates/);
  });

  it('hourly が無い場合は失敗する', () => {
    expect(() => parseMarineResponse({ current: {} })).toThrow(/unexpected response shape/);
  });

  it('hourly.time が空配列の場合は失敗する', () => {
    expect(() => parseMarineResponse({ hourly: { time: [] } }))
      .toThrow(/unexpected response shape/);
  });

  it('hourly の数値配列に文字列が混入していたら失敗する', () => {
    const broken = {
      hourly: { time: ['2026-06-10T00:00'], wave_height: ['high'] },
    };
    expect(() => parseMarineResponse(broken)).toThrow(/unexpected response shape/);
  });
});

describe('parseWeatherResponse', () => {
  it('正常なレスポンスを受け付ける', () => {
    const result = parseWeatherResponse(validWeather);
    expect(result.current?.wind_speed_10m).toBe(12.5);
    expect(result.hourly?.wind_speed_10m_jma_msm?.[0]).toBe(10.0);
  });

  it('current / hourly / daily がすべて無くても受け付ける（全フィールド任意）', () => {
    expect(() => parseWeatherResponse({})).not.toThrow();
  });

  it('エラーレスポンスは失敗する', () => {
    expect(() => parseWeatherResponse({ error: true })).toThrow(/wind API error/);
  });
});
