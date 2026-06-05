import type { SurfPoint } from './types';

export const tokushimaPoints: SurfPoint[] = [
  {
    id: 'point-8',
    name: '徳島 小松海岸',
    lat: 34.055,
    lon: 134.588,
    bestSwell: 'ESE, SE, SSE, S',
    note: '吉野川河口と今切川河口の間にある紀伊水道内の砂浜。短周期の南東〜南波は浜前で弱まりやすい。',
    beachFacing: 'SE',
    tideStation: 'komatsushima',
    tidePreference: {
      falling: 0.5,
      low: 0,
      rising: 0,
      high: -0.5,
    },
    breakProfile: {
      bottom: 'river_mouth',
      exposure: 'sheltered_bay',
      dumperRisk: 'medium',
      mellowBias: 'low',
      idealPeriodMin: 8,
      shortPeriodPenalty: 1,
      windWavePenalty: 1,
      shortPeriodHeightFactor: 0.45,
    },
    bayGeometry: {
      type: 'semi-enclosed',
      openingAngle: 90,
      openingDir: 145,
      openingDirStr: 'SE',
      diffractionFactor: 0.30,
      convergenceFactor: 0.65,
      headlands: [],
      obstacles: [
        { type: 'islet', bearing: 115, distanceKm: 4.43, name: '亀磯' },
        { type: 'islet', bearing: 162, distanceKm: 6.70, name: '室岩' },
      ],
    },
  },
  {
    id: 'point-9',
    name: '徳島 宍喰',
    lat: 33.56,
    lon: 134.305,
    bestSwell: 'S, SSE, SE, ESE',
    note: '南〜東うねりに開いている',
    beachFacing: 'SE',
    tideStation: 'muroto',
    bayGeometry: {
      type: 'semi-enclosed',
      openingAngle: 154,
      openingDir: 108,
      openingDirStr: 'ESE',
      diffractionFactor: 0.51,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 181, distanceKm: 1.6, name: '塚崎' },
        { bearing: 185, distanceKm: 2.0, name: '唐人ヶ鼻' },
        { bearing: 198, distanceKm: 4.6, name: '松ヶ鼻' },
        { bearing: 67,  distanceKm: 5.9, name: '乳ノ崎' },
      ],
      obstacles: [
        { type: 'islet', bearing: 84,  distanceKm: 1.11, name: 'シシケ碆' },
        { type: 'islet', bearing: 95,  distanceKm: 1.30, name: 'サビ島' },
        { type: 'islet', bearing: 87,  distanceKm: 1.31, name: '鹿子居島' },
        { type: 'islet', bearing: 98,  distanceKm: 1.90, name: 'ウバエ島' },
        { type: 'islet', bearing: 103, distanceKm: 1.94, name: '棚碆' },
        { type: 'reef',  bearing: 200, distanceKm: 2.29 },
        { type: 'islet', bearing: 194, distanceKm: 2.42, name: '赤葉島' },
        { type: 'reef',  bearing: 209, distanceKm: 2.42 },
        { type: 'islet', bearing: 166, distanceKm: 2.45, name: '葛島' },
        { type: 'islet', bearing: 48,  distanceKm: 3.97, name: '二子島' },
      ],
    },
  },
  {
    id: 'point-13',
    name: '徳島 内妻',
    lat: 33.616667,
    lon: 134.350833,
    bestSwell: 'S, SSE, SE, ESE',
    note: '牟岐湾の奥に位置する enclosed 湾。南〜南東うねりが湾口から入る。強い南系うねりが必要。',
    beachFacing: 'S',
    tideStation: 'muroto',
    bayGeometry: {
      // 牟岐湾の最奥部。南〜南東方向に約90°の開口。
      // 東側: 網代崎(78°/3.68km)が湾の東岸を画する。
      // 南端: 乳ノ崎(164°/4.21km)が湾口の南端岬。
      // 湾内に小島・二子島あり。
      type: 'enclosed',
      openingAngle: 90,
      openingDir: 175,
      openingDirStr: 'S',
      diffractionFactor: 0.40,
      convergenceFactor: 1.1,
      headlands: [
        { bearing: 78,  distanceKm: 3.68, name: '網代崎' },
        { bearing: 164, distanceKm: 4.21, name: '乳ノ崎' },
      ],
      obstacles: [
        { type: 'islet', bearing: 154, distanceKm: 3.46, name: '小島' },
        { type: 'islet', bearing: 199, distanceKm: 3.88, name: '二子島' },
      ],
    },
  },
];
