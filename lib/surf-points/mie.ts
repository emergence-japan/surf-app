import type { SurfPoint } from './types';

export const miePoints: SurfPoint[] = [
  {
    id: 'point-6',
    name: '三重 国府の浜',
    lat: 34.354,
    lon: 136.885,
    bestSwell: 'E, ESE, SE, SSE, S',
    note: '東〜南うねりメイン。遠浅で厚め・メローな波が多い。',
    beachFacing: 'ESE',
    tideStation: 'toba',
    tidePreference: {
      falling: 0.5,
      low: 0.5,
      rising: 0,
      high: -0.5,
    },
    breakProfile: {
      bottom: 'shallow_sand',
      exposure: 'open_ocean',
      dumperRisk: 'low',
      mellowBias: 'high',
      idealPeriodMin: 7,
      shortPeriodPenalty: 0,
      windWavePenalty: 0,
    },
    bayGeometry: {
      // 志摩半島外海側、太平洋に面した南北に走るオープンビーチ（約3km）。
      // 北側に安乗埼(N 約4km)、南側に大王崎(SSE 約8km)があり広く開ける。
      // E〜SEが最もオープン。市後浜と同一の海岸線上にあり地形条件はほぼ同じ。
      type: 'semi-enclosed',
      openingAngle: 160,
      openingDir: 110,
      openingDirStr: 'ESE',
      diffractionFactor: 0.7,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 0,   distanceKm: 4.0, name: '安乗埼' },
        { bearing: 170, distanceKm: 7.7, name: '老岬' },
      ],
      obstacles: [],
    },
  },
  {
    id: 'point-20',
    name: '三重 市後浜',
    lat: 34.305,
    lon: 136.886,
    bestSwell: 'E, ESE, SE, SSE, S',
    note: '国府の浜の南約5km。太平洋に面した白砂ビーチ。ドン深気味のため胸〜頭サイズで良い波になりやすい。',
    beachFacing: 'ESE',
    tideStation: 'toba',
    bayGeometry: {
      // 志摩半島外海側、太平洋に面した南北に走るビーチ。国府の浜と同一の海岸線上。
      // 南側に大王崎(SSE 約3km)があり南南西以南を遮蔽。北側は開ける。
      // E〜SEが最もオープン。地形条件は国府の浜とほぼ同じだがやや南寄り。
      type: 'semi-enclosed',
      openingAngle: 160,
      openingDir: 110,
      openingDirStr: 'ESE',
      diffractionFactor: 0.7,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 154, distanceKm: 3.3, name: '大王崎' },
        { bearing: 209, distanceKm: 7.4, name: '麦崎' },
      ],
      obstacles: [],
    },
  },
];
