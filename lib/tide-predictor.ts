/**
 * 天文潮汐計算ライブラリ
 *
 * 調和定数（振幅 H・遅角 G）と天文引数から潮汐高を計算する。
 * 調和定数は気象庁「潮汐観測統計」掲載値に基づく近似値。
 *
 * 計算式:
 *   h(t) = MSL + Σ f_i × H_i × cos( ω_i × Δt + V0_i + u_i - G_i )
 *
 *   ω_i  : 分潮の角速度 [°/h]
 *   Δt   : J2000.0 からの経過時間 [h]
 *   V0_i : J2000.0 における天文引数 [°]
 *   u_i  : 交点補正角 [°]
 *   f_i  : 交点補正係数
 *   G_i  : 遅角（Greenwich 位相遅れ）[°]
 *   H_i  : 振幅 [m]
 */

// ---- 基準エポック (J2000.0) ----
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0); // 2000-01-01T12:00:00Z

// ---- 分潮の角速度 [°/h] ----
const SPEEDS: Record<string, number> = {
  M2: 28.9841042,
  S2: 30.0000000,
  N2: 28.4397295,
  K2: 30.0821373,
  K1: 15.0410686,
  O1: 13.9430356,
  P1: 14.9589314,
  Q1: 13.3986609,
};

// ---- ユーティリティ ----
function mod360(x: number): number {
  return ((x % 360) + 360) % 360;
}
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 天文引数 V0・交点補正 u・f を計算
 * @param timeMs Unix timestamp [ms]
 */
function computeAstro(timeMs: number): {
  V0: Record<string, number>;
  u: Record<string, number>;
  f: Record<string, number>;
} {
  // Julian centuries from J2000.0
  const T = (timeMs - J2000_MS) / (36525 * 24 * 3600 * 1000);

  // 基本天文変数 [°]
  const s  = mod360(218.3165 + 481267.8813 * T); // 月の平均経度
  const h  = mod360(280.4665 +  36000.7698 * T); // 太陽の平均経度
  const p  = mod360( 83.3532 +   4069.0137 * T); // 月の近地点経度
  const N  = mod360(125.0446 -   1934.1363 * T); // 月の昇交点経度
  const Nr = toRad(N);

  // 天文引数 V0 [°]
  const V0: Record<string, number> = {
    M2: mod360(2 * h - 2 * s),
    S2: 0,
    N2: mod360(2 * h - 3 * s + p),
    K2: mod360(2 * h),
    K1: mod360(h + 90),
    O1: mod360(h - 2 * s - 90),
    P1: mod360(-h + 90),
    Q1: mod360(h - 3 * s + p - 90),
  };

  // 交点補正角 u [°]
  const u: Record<string, number> = {
    M2: -2.14  * Math.sin(Nr),
    S2: 0,
    N2: -2.14  * Math.sin(Nr),
    K2: -17.74 * Math.sin(Nr) - 0.68 * Math.sin(2 * Nr),
    K1: -8.86  * Math.sin(Nr) + 0.68 * Math.sin(2 * Nr),
    O1:  10.8  * Math.sin(Nr) - 1.34 * Math.sin(2 * Nr),
    P1: 0,
    Q1:  10.8  * Math.sin(Nr) - 1.34 * Math.sin(2 * Nr),
  };

  // 交点補正係数 f（無次元）
  const f: Record<string, number> = {
    M2: 1        - 0.037  * Math.cos(Nr),
    S2: 1,
    N2: 1        - 0.037  * Math.cos(Nr),
    K2: 1.024    + 0.286  * Math.cos(Nr)  + 0.008 * Math.cos(2 * Nr),
    K1: 1.006    + 0.115  * Math.cos(Nr)  - 0.009 * Math.cos(2 * Nr),
    O1: 1.0089   + 0.1871 * Math.cos(Nr)  - 0.0147 * Math.cos(2 * Nr),
    P1: 1,
    Q1: 1.0089   + 0.1871 * Math.cos(Nr)  - 0.0147 * Math.cos(2 * Nr),
  };

  return { V0, u, f };
}

// ---- 調和定数 ----
type HConst = { H: number; G: number };

type Station = {
  label: string;
  msl: number; // 平均海面 [m]（グラフのゼロ基準）
  constituents: Record<string, HConst>;
};

/**
 * 各観測局の調和定数（気象庁 潮汐観測統計 掲載値より）
 * H: 振幅 [m], G: 遅角 [°]
 */
export const TIDE_STATIONS = {
  // ---- 日本海 ----
  maizuru: {
    label: '舞鶴',
    msl: 0,
    constituents: {
      M2: { H: 0.075, G: 175 }, S2: { H: 0.034, G: 222 },
      N2: { H: 0.015, G: 152 }, K2: { H: 0.009, G: 218 },
      K1: { H: 0.136, G: 152 }, O1: { H: 0.098, G: 138 },
      P1: { H: 0.044, G: 152 }, Q1: { H: 0.019, G: 119 },
    },
  },
  sakaiminato: {
    label: '境港',
    msl: 0,
    constituents: {
      M2: { H: 0.048, G: 188 }, S2: { H: 0.020, G: 231 },
      N2: { H: 0.010, G: 164 }, K2: { H: 0.006, G: 227 },
      K1: { H: 0.121, G: 153 }, O1: { H: 0.086, G: 141 },
      P1: { H: 0.039, G: 154 }, Q1: { H: 0.017, G: 122 },
    },
  },
  // ---- 太平洋 / 瀬戸内 ----
  toba: {
    label: '鳥羽',
    msl: 0,
    constituents: {
      M2: { H: 0.570, G: 295 }, S2: { H: 0.184, G: 325 },
      N2: { H: 0.118, G: 270 }, K2: { H: 0.050, G: 322 },
      K1: { H: 0.155, G: 197 }, O1: { H: 0.106, G: 187 },
      P1: { H: 0.050, G: 197 }, Q1: { H: 0.021, G: 168 },
    },
  },
  osaka: {
    label: '大阪',
    msl: 0,
    constituents: {
      M2: { H: 0.121, G: 286 }, S2: { H: 0.047, G: 325 },
      N2: { H: 0.025, G: 260 }, K2: { H: 0.013, G: 321 },
      K1: { H: 0.118, G: 189 }, O1: { H: 0.077, G: 183 },
      P1: { H: 0.038, G: 189 }, Q1: { H: 0.015, G: 165 },
    },
  },
  komatsushima: {
    label: '小松島',
    msl: 0,
    constituents: {
      M2: { H: 0.312, G: 282 }, S2: { H: 0.098, G: 314 },
      N2: { H: 0.064, G: 257 }, K2: { H: 0.027, G: 311 },
      K1: { H: 0.143, G: 194 }, O1: { H: 0.095, G: 184 },
      P1: { H: 0.046, G: 194 }, Q1: { H: 0.019, G: 166 },
    },
  },
  muroto: {
    label: '室戸',
    msl: 0,
    constituents: {
      M2: { H: 0.577, G: 270 }, S2: { H: 0.187, G: 295 },
      N2: { H: 0.118, G: 246 }, K2: { H: 0.051, G: 291 },
      K1: { H: 0.146, G: 188 }, O1: { H: 0.097, G: 177 },
      P1: { H: 0.047, G: 188 }, Q1: { H: 0.020, G: 158 },
    },
  },
  omaezaki: {
    label: '御前崎',
    msl: 0,
    constituents: {
      M2: { H: 0.700, G: 286 }, S2: { H: 0.218, G: 311 },
      N2: { H: 0.143, G: 262 }, K2: { H: 0.059, G: 307 },
      K1: { H: 0.166, G: 193 }, O1: { H: 0.109, G: 183 },
      P1: { H: 0.053, G: 193 }, Q1: { H: 0.022, G: 164 },
    },
  },
} satisfies Record<string, Station>;

export type TideStationKey = keyof typeof TIDE_STATIONS;

/**
 * 指定時刻の潮汐高を計算する [m]
 */
export function computeTideHeight(timeMs: number, stationKey: TideStationKey): number {
  const station = TIDE_STATIONS[stationKey];
  const { V0, u, f } = computeAstro(timeMs);
  const dt = (timeMs - J2000_MS) / 3600000; // J2000.0 からの経過時間 [h]

  let height = station.msl;

  for (const [name, { H, G }] of Object.entries(station.constituents)) {
    const speed = SPEEDS[name];
    if (speed === undefined) continue;

    const fi  = f[name]  ?? 1;
    const V0i = V0[name] ?? 0;
    const ui  = u[name]  ?? 0;

    const phaseRad = toRad(mod360(speed * dt + V0i + ui - G));
    height += fi * H * Math.cos(phaseRad);
  }

  return Math.round(height * 100) / 100; // cm単位で丸め
}

export type TidePhase = 'rising' | 'falling' | 'high' | 'low';

/**
 * 潮汐フェーズと±30分の変化量から上げ/下げ/満潮/干潮を判定する
 * - 変化量が ±0.03m/h 未満 → 満潮または干潮（転換点）
 * - 正の変化量 → 上げ潮
 * - 負の変化量 → 下げ潮
 */
export function computeTidePhase(timeMs: number, stationKey: TideStationKey): TidePhase {
  const prev = computeTideHeight(timeMs - 30 * 60 * 1000, stationKey);
  const next = computeTideHeight(timeMs + 30 * 60 * 1000, stationKey);
  const rate = next - prev; // 1時間あたりの変化量 [m/h]

  if (Math.abs(rate) < 0.03) {
    const curr = computeTideHeight(timeMs, stationKey);
    const nearby = [
      computeTideHeight(timeMs - 2 * 3600 * 1000, stationKey),
      computeTideHeight(timeMs + 2 * 3600 * 1000, stationKey),
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
