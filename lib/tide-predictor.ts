/**
 * 天文潮汐計算ライブラリ
 *
 * 調和定数（振幅 H・遅角 κ）と天文引数から潮汐高を計算する。
 * 調和定数は気象庁「分潮一覧表」(harms60.php, 2011-2020 解析) の公式値。
 * 遅角 κ は現地子午線（その観測所の経度）基準。
 *
 * 計算式:
 *   h(t) = MSL + Σ f_i × H_i × cos( V_i + u_i − κ_i )
 *
 *   V_i  : 平衡引数 [°] = n_T·T_local + n_s·s + n_h·h + n_p·p + 定数
 *   T_local : 現地平均太陽の時角 [°] = (GMST − h) + 観測所東経
 *   s,h,p : 月・太陽の平均黄経、月の近地点黄経 [°]
 *   u_i  : 交点補正角 [°]
 *   f_i  : 交点補正係数（無次元）
 *   κ_i  : 遅角（現地基準の位相遅れ）[°]
 *   H_i  : 振幅 [m]
 *
 * 検証: 室戸岬 2026-06-02 の満干時刻が気象庁公式予測
 *   （満潮 06:05/19:55, 干潮 00:43/13:00）と概ね ±15 分以内で一致する。
 */

// ---- 基準エポック (J2000.0) ----
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01T12:00:00Z

// ---- ユーティリティ ----
function mod360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ---- 分潮の Doodson 係数 ----
// 平衡引数 V = nT·T_local + ns·s + nh·h + np·p + c
//   T_local = 現地平均太陽時角, s=月平均黄経, h=太陽平均黄経, p=月近地点黄経
type DoodsonCoeff = { nT: number; ns: number; nh: number; np: number; c: number };

const DOODSON: Record<string, DoodsonCoeff> = {
  // 半日周潮
  M2: { nT: 2, ns: -2, nh: 2, np: 0, c: 0 },
  S2: { nT: 2, ns: 0, nh: 0, np: 0, c: 0 },
  N2: { nT: 2, ns: -3, nh: 2, np: 1, c: 0 },
  K2: { nT: 2, ns: 0, nh: 2, np: 0, c: 0 },
  // 日周潮
  K1: { nT: 1, ns: 0, nh: 1, np: 0, c: -90 },
  O1: { nT: 1, ns: -2, nh: 1, np: 0, c: 90 },
  P1: { nT: 1, ns: 0, nh: -1, np: 0, c: -90 },
  Q1: { nT: 1, ns: -3, nh: 1, np: 1, c: 90 },
};

/**
 * 天文平均黄経 s,h,p,N と現地平均太陽時角 T_local を計算
 * @param timeMs Unix timestamp [ms] (UTC)
 * @param lonDeg 観測所の東経 [°]
 */
function computeAstro(timeMs: number, lonDeg: number): {
  s: number; h: number; p: number; N: number; Tlocal: number;
} {
  const d = (timeMs - J2000_MS) / 86400000;   // J2000.0 からの経過日数
  const T = d / 36525;                         // ユリウス世紀

  const s = mod360(218.3164477 + 481267.88123421 * T); // 月の平均黄経
  const h = mod360(280.4664567 + 36000.76982779 * T);  // 太陽の平均黄経
  const p = mod360(83.3532465 + 4069.0137287 * T);     // 月の近地点黄経
  const N = mod360(125.0445479 - 1934.1362891 * T);    // 月の昇交点黄経

  // グリニッジ平均恒星時 [°]（IAU1982 簡略式, UT1≈UTC 近似）
  const GMST = mod360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
  // 平均太陽の時角 = GMST − 太陽平均黄経。現地時角は東経ぶん進める。
  const Tlocal = GMST - h + lonDeg;

  return { s, h, p, N, Tlocal };
}

/**
 * 交点補正 u [°] と f（無次元）を計算（Schureman 近似）
 */
function computeNodal(N: number): {
  u: Record<string, number>;
  f: Record<string, number>;
} {
  const Nr = toRad(N);
  const sinN = Math.sin(Nr), cosN = Math.cos(Nr);
  const sin2N = Math.sin(2 * Nr), cos2N = Math.cos(2 * Nr);

  const u: Record<string, number> = {
    M2: -2.14 * sinN,
    S2: 0,
    N2: -2.14 * sinN,
    K2: -17.74 * sinN + 0.68 * sin2N,
    K1: -8.86 * sinN + 0.68 * sin2N,
    O1: 10.80 * sinN - 1.34 * sin2N,
    P1: 0,
    Q1: 10.80 * sinN - 1.34 * sin2N,
  };

  const f: Record<string, number> = {
    M2: 1.0 - 0.037 * cosN,
    S2: 1.0,
    N2: 1.0 - 0.037 * cosN,
    K2: 1.024 + 0.286 * cosN + 0.008 * cos2N,
    K1: 1.006 + 0.115 * cosN - 0.009 * cos2N,
    O1: 1.009 + 0.187 * cosN - 0.015 * cos2N,
    P1: 1.0,
    Q1: 1.009 + 0.187 * cosN - 0.015 * cos2N,
  };

  return { u, f };
}

// ---- 調和定数 ----
type HConst = { H: number; G: number };

type Station = {
  label: string;
  lon: number; // 観測所の東経 [°]（遅角の現地子午線基準）
  msl: number; // 平均海面 [m]（グラフのゼロ基準）
  constituents: Record<string, HConst>;
};

/**
 * 各観測局の調和定数（気象庁 分潮一覧表 harms60.php, 2011-2020 解析）
 * H: 振幅 [m]（公式値 cm / 100）, G: 遅角 κ [°]（現地子午線基準）
 */
export const TIDE_STATIONS = {
  // ---- 日本海 ----
  maizuru: {
    label: '舞鶴',
    lon: 135.38,
    msl: 0,
    constituents: {
      M2: { H: 0.0620, G: 71.14 }, S2: { H: 0.0227, G: 89.58 },
      N2: { H: 0.0163, G: 58.62 }, K2: { H: 0.0064, G: 80.90 },
      K1: { H: 0.0534, G: 342.14 }, O1: { H: 0.0542, G: 314.56 },
      P1: { H: 0.0179, G: 340.26 }, Q1: { H: 0.0125, G: 296.73 },
    },
  },
  sakaiminato: {
    label: '境港',
    lon: 133.23,
    msl: 0,
    constituents: {
      M2: { H: 0.0552, G: 68.96 }, S2: { H: 0.0202, G: 82.23 },
      N2: { H: 0.0144, G: 60.87 }, K2: { H: 0.0061, G: 79.58 },
      K1: { H: 0.0491, G: 343.43 }, O1: { H: 0.0460, G: 312.48 },
      P1: { H: 0.0162, G: 339.64 }, Q1: { H: 0.0097, G: 295.09 },
    },
  },
  // ---- 太平洋 / 瀬戸内 ----
  toba: {
    label: '鳥羽',
    lon: 136.82,
    msl: 0,
    constituents: {
      M2: { H: 0.5436, G: 178.32 }, S2: { H: 0.2535, G: 204.22 },
      N2: { H: 0.0941, G: 174.80 }, K2: { H: 0.0703, G: 199.92 },
      K1: { H: 0.2317, G: 187.53 }, O1: { H: 0.1725, G: 167.12 },
      P1: { H: 0.0770, G: 184.46 }, Q1: { H: 0.0359, G: 157.28 },
    },
  },
  osaka: {
    label: '大阪',
    lon: 135.43,
    msl: 0,
    constituents: {
      M2: { H: 0.2989, G: 215.29 }, S2: { H: 0.1685, G: 227.89 },
      N2: { H: 0.0641, G: 210.30 }, K2: { H: 0.0422, G: 228.12 },
      K1: { H: 0.2603, G: 203.66 }, O1: { H: 0.1947, G: 181.35 },
      P1: { H: 0.0811, G: 200.42 }, Q1: { H: 0.0383, G: 169.14 },
    },
  },
  komatsushima: {
    label: '小松島',
    lon: 134.59,
    msl: 0,
    constituents: {
      M2: { H: 0.4169, G: 179.45 }, S2: { H: 0.2007, G: 203.81 },
      N2: { H: 0.0775, G: 176.08 }, K2: { H: 0.0537, G: 198.75 },
      K1: { H: 0.2221, G: 193.68 }, O1: { H: 0.1720, G: 172.82 },
      P1: { H: 0.0715, G: 190.30 }, Q1: { H: 0.0351, G: 159.96 },
    },
  },
  muroto: {
    label: '室戸',
    lon: 134.18,
    msl: 0,
    constituents: {
      M2: { H: 0.4901, G: 173.34 }, S2: { H: 0.2162, G: 197.36 },
      N2: { H: 0.0897, G: 168.32 }, K2: { H: 0.0596, G: 192.20 },
      K1: { H: 0.2205, G: 188.19 }, O1: { H: 0.1683, G: 168.41 },
      P1: { H: 0.0723, G: 185.34 }, Q1: { H: 0.0354, G: 156.94 },
    },
  },
  omaezaki: {
    label: '御前崎',
    lon: 138.23,
    msl: 0,
    constituents: {
      M2: { H: 0.4066, G: 166.19 }, S2: { H: 0.1882, G: 191.50 },
      N2: { H: 0.0691, G: 163.28 }, K2: { H: 0.0524, G: 186.79 },
      K1: { H: 0.2321, G: 185.29 }, O1: { H: 0.1782, G: 164.16 },
      P1: { H: 0.0751, G: 183.94 }, Q1: { H: 0.0371, G: 153.13 },
    },
  },
  aburatsu: {
    label: '油津',
    lon: 131.41,
    msl: 0,
    constituents: {
      M2: { H: 0.5191, G: 173.98 }, S2: { H: 0.2278, G: 198.29 },
      N2: { H: 0.0969, G: 168.52 }, K2: { H: 0.0630, G: 192.93 },
      K1: { H: 0.2250, G: 190.97 }, O1: { H: 0.1746, G: 170.18 },
      P1: { H: 0.0738, G: 187.95 }, Q1: { H: 0.0367, G: 158.89 },
    },
  },
} satisfies Record<string, Station>;

export type TideStationKey = keyof typeof TIDE_STATIONS;

/**
 * 指定時刻の潮汐高を計算する（丸めなしの生値）[m]
 * 満干の極値検出やフェーズ判定には丸めるとノイズが乗るため、こちらを使う。
 */
export function rawTideHeight(timeMs: number, stationKey: TideStationKey): number {
  const station = TIDE_STATIONS[stationKey];
  const { s, h, p, N, Tlocal } = computeAstro(timeMs, station.lon);
  const { u, f } = computeNodal(N);

  let height = station.msl;

  for (const [name, { H, G }] of Object.entries(station.constituents)) {
    const c = DOODSON[name];
    if (c === undefined) continue;

    const V = c.nT * Tlocal + c.ns * s + c.nh * h + c.np * p + c.c;
    const phaseRad = toRad(mod360(V + (u[name] ?? 0) - G));
    height += (f[name] ?? 1) * H * Math.cos(phaseRad);
  }

  return height;
}

/**
 * 指定時刻の潮汐高を計算する（cm単位で丸めた表示用の値）[m]
 */
export function computeTideHeight(timeMs: number, stationKey: TideStationKey): number {
  return Math.round(rawTideHeight(timeMs, stationKey) * 100) / 100;
}

export type TidePhase = 'rising' | 'falling' | 'high' | 'low';

/**
 * 潮汐フェーズと±30分の変化量から上げ/下げ/満潮/干潮を判定する
 * - 変化量が ±0.03m/h 未満 → 満潮または干潮（転換点）
 * - 正の変化量 → 上げ潮
 * - 負の変化量 → 下げ潮
 */
export function computeTidePhase(timeMs: number, stationKey: TideStationKey): TidePhase {
  const prev = rawTideHeight(timeMs - 30 * 60 * 1000, stationKey);
  const next = rawTideHeight(timeMs + 30 * 60 * 1000, stationKey);
  const rate = next - prev; // 1時間あたりの変化量 [m/h]

  if (Math.abs(rate) < 0.03) {
    const curr = rawTideHeight(timeMs, stationKey);
    const nearby = [
      rawTideHeight(timeMs - 2 * 3600 * 1000, stationKey),
      rawTideHeight(timeMs + 2 * 3600 * 1000, stationKey),
    ];
    const avg = (nearby[0] + nearby[1]) / 2;
    return curr >= avg ? 'high' : 'low';
  }

  return rate > 0 ? 'rising' : 'falling';
}

/**
 * 潮汐フェーズがサーフィンコンディションに与える影響スコアを返す
 * - 満潮直後の下げ始め: +1（多くのポイントで形が良くなりやすい）
 * - 干潮: +1（リーフ・サンドバー系ポイントで波が掘れやすい）
 * - 上げ潮: 0
 * - 急激な満潮: 0（カレントが強くなりやすいが判定が難しいため中立）
 */
export function getTideScoreEffect(phase: TidePhase): number {
  if (phase === 'low') return 1;    // 干潮: サンドバー・リーフが機能しやすい
  if (phase === 'falling') return 1; // 下げ潮: 波が掘れやすい
  return 0;
}

/**
 * 指定期間の時間別潮汐データを生成する
 * @param startMs  開始時刻 [ms]
 * @param hours    生成する時間数
 * @param station  観測局キー
 */
export function generateHourlyTides(
  startMs: number,
  hours: number,
  station: TideStationKey
): { time: string; height: number }[] {
  return Array.from({ length: hours }, (_, i) => {
    const t = startMs + i * 3600 * 1000;
    return {
      time:   new Date(t).toISOString(),
      height: computeTideHeight(t, station),
    };
  });
}
