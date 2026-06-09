import { z } from 'zod';

/**
 * Open-Meteo レスポンスの実行時バリデーション。
 *
 * 外部 API のレスポンスを無検証で使わないためのスキーマ。
 * hourly / daily は「time + モデル別サフィックス付きの nullable 数値配列」
 * という一様な形なので、フィールドを個別に列挙せず catchall で検証する。
 * current は実際に使うフィールドだけ明示的に検証する（それ以外は捨てる）。
 *
 * 型は template literal type でモデルサフィックス展開を表現し、
 * 呼び出し側が `hourly.wave_height_gwam` のように型安全にアクセスできる。
 */

type NumArr = (number | null)[];

// ---- 型定義（アクセス用） ----

type WeatherSuffix = '' | '_jma_msm' | '_gfs_seamless';
type MarineHourlySuffix = '' | '_marine_best_match' | '_gwam';
type MarineDailySuffix = '' | '_best_match' | '_gwam';

type WeatherHourlyField = `${'wind_speed_10m' | 'wind_direction_10m'}${WeatherSuffix}`;
type WeatherDailyField =
  `${'wind_speed_10m_max' | 'wind_direction_10m_dominant' | 'weather_code'}${WeatherSuffix}`;
type MarineHourlyField = `${
  | 'wave_height' | 'wave_direction' | 'wave_period'
  | 'swell_wave_height' | 'swell_wave_direction' | 'swell_wave_period'
  | 'wind_wave_height' | 'wind_wave_direction' | 'wind_wave_period'
  | 'sea_surface_temperature'}${MarineHourlySuffix}`;
type MarineDailyField = `${'wave_height_max' | 'wave_direction_dominant'}${MarineDailySuffix}`;

export type WeatherHourly = { time: string[] } & Partial<Record<WeatherHourlyField, NumArr>>;
export type WeatherDaily = { time: string[] } & Partial<Record<WeatherDailyField, NumArr>>;
export type MarineHourly = { time: string[] } & Partial<Record<MarineHourlyField, NumArr>>;
export type MarineDaily = { time: string[] } & Partial<Record<MarineDailyField, NumArr>>;

export interface WeatherCurrent {
  wind_speed_10m?: number | null;
  wind_direction_10m?: number | null;
  visibility?: number | null;
  cloud_cover?: number | null;
}

export interface MarineCurrent {
  wave_height?: number | null;
  wave_direction?: number | null;
  wave_period?: number | null;
  swell_wave_height?: number | null;
  swell_wave_direction?: number | null;
  swell_wave_period?: number | null;
  wind_wave_height?: number | null;
  wind_wave_direction?: number | null;
  wind_wave_period?: number | null;
}

export interface WeatherResponse {
  current?: WeatherCurrent;
  hourly?: WeatherHourly;
  daily?: WeatherDaily;
}

export interface MarineResponse {
  current?: MarineCurrent;
  hourly: MarineHourly; // 必須: hourly.time が無いレスポンスはエラーにする
  daily?: MarineDaily;
}

// ---- 実行時スキーマ ----

const nullableNumberArray = z.array(z.number().nullable());

// time（文字列配列・1件以上）＋ 残りはすべて nullable 数値配列
const timeSeriesBlock = z
  .object({ time: z.array(z.string()).min(1) })
  .catchall(nullableNumberArray);

const weatherCurrentSchema = z.object({
  wind_speed_10m: z.number().nullish(),
  wind_direction_10m: z.number().nullish(),
  visibility: z.number().nullish(),
  cloud_cover: z.number().nullish(),
});

const marineCurrentSchema = z.object({
  wave_height: z.number().nullish(),
  wave_direction: z.number().nullish(),
  wave_period: z.number().nullish(),
  swell_wave_height: z.number().nullish(),
  swell_wave_direction: z.number().nullish(),
  swell_wave_period: z.number().nullish(),
  wind_wave_height: z.number().nullish(),
  wind_wave_direction: z.number().nullish(),
  wind_wave_period: z.number().nullish(),
});

const weatherResponseSchema = z.object({
  current: weatherCurrentSchema.optional(),
  hourly: timeSeriesBlock.optional(),
  daily: timeSeriesBlock.optional(),
});

const marineResponseSchema = z.object({
  current: marineCurrentSchema.optional(),
  hourly: timeSeriesBlock,
  daily: timeSeriesBlock.optional(),
});

// Open-Meteo のエラーレスポンス: { error: true, reason: "..." }
const apiErrorSchema = z.object({
  error: z.literal(true),
  reason: z.string().optional(),
});

function formatIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'unknown schema error';
  return `${issue.path.join('.') || '(root)'}: ${issue.message}`;
}

/** 気象（風）API レスポンスを検証する。形が想定外なら明確なエラーで失敗する。 */
export function parseWeatherResponse(json: unknown): WeatherResponse {
  const apiError = apiErrorSchema.safeParse(json);
  if (apiError.success) {
    throw new Error(`wind API error: ${apiError.data.reason ?? 'unknown'}`);
  }
  const parsed = weatherResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`wind API: unexpected response shape (${formatIssue(parsed.error)})`);
  }
  return parsed.data as WeatherResponse;
}

/** 海洋（波）API レスポンスを検証する。hourly.time が無い・空ならエラー。 */
export function parseMarineResponse(json: unknown): MarineResponse {
  const apiError = apiErrorSchema.safeParse(json);
  if (apiError.success) {
    throw new Error(`wave API error: ${apiError.data.reason ?? 'unknown'}`);
  }
  const parsed = marineResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`wave API: unexpected response shape (${formatIssue(parsed.error)})`);
  }
  return parsed.data as MarineResponse;
}
