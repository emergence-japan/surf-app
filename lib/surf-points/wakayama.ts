import type { SurfPoint } from './types';

export const wakayamaPoints: SurfPoint[] = [
  {
    id: 'point-7',
    name: '和歌山 磯ノ浦',
    lat: 34.257,
    lon: 135.12,
    bestSwell: 'SSW, SW, WSW, S',
    note: '大阪湾内、強い南西〜南が必要。遠浅で上げ潮はワイド/ダンパー気味になりやすい。',
    beachFacing: 'SSW',
    tideStation: 'osaka',
    imageUrl: 'https://images.unsplash.com/photo-1502933691298-84fc14542831?auto=format&fit=crop&q=80&w=1200',
    tidePreference: {
      falling: 1,
      low: 0,
      rising: 0,
      high: -1,
    },
    breakProfile: {
      bottom: 'shallow_sand',
      exposure: 'sheltered_bay',
      dumperRisk: 'high',
      mellowBias: 'low',
      idealPeriodMin: 8,
      shortPeriodPenalty: 1,
      windWavePenalty: 1,
    },
    bayGeometry: {
      // 大阪湾内の南西向きビーチ。友ヶ島水道から入る南西〜南うねりに反応。
      // 友ヶ島が南側の開口を絞るため、強いうねりでないと届かない。
      // OSM海岸線が大阪湾全体を拾い自動計算が不安定なため手動修正済み。
      type: 'enclosed',
      openingAngle: 120,
      openingDir: 210,
      openingDirStr: 'SSW',
      diffractionFactor: 0.55,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 277, distanceKm: 5.4, name: '田倉崎' },
        { bearing: 303, distanceKm: 5.7, name: '城ヶ崎' },
        { bearing: 327, distanceKm: 6.8, name: '住吉崎' },
        { bearing: 325, distanceKm: 6.9, name: '戎崎' },
        { bearing: 340, distanceKm: 6.9, name: '明神崎' },
        { bearing: 309, distanceKm: 7.1, name: '藻崎' },
        { bearing: 357, distanceKm: 7.3, name: '豊国崎' },
        { bearing: 303, distanceKm: 7.5, name: '下崎' },
        { bearing: 3,   distanceKm: 7.6, name: '観音崎' },
      ],
      obstacles: [
        { type: 'islet', bearing: 11, distanceKm: 4.88 },
      ],
    },
  },
];
