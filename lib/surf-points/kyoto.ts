import type { SurfPoint } from './types';

export const kyotoPoints: SurfPoint[] = [
  {
    id: 'point-3',
    name: '京都 八丁浜',
    lat: 35.678,
    lon: 135.068,
    bestSwell: 'NNE, N, NNW, NW',
    note: '日本海、北うねり全般',
    beachFacing: 'N',
    tideStation: 'maizuru',
    bayGeometry: {
      type: 'open',
      openingAngle: 250,
      openingDir: 330,
      openingDirStr: 'NNW',
      diffractionFactor: 1.0,
      convergenceFactor: 0.9,
      headlands: [],
      obstacles: [
        { type: 'islet', bearing: 11,  distanceKm: 6.72, name: '城島' },
        { type: 'islet', bearing: 11,  distanceKm: 6.88, name: '城北小島' },
        { type: 'islet', bearing: 286, distanceKm: 7.16, name: 'ヒデリ岩' },
      ],
    },
  },
  {
    id: 'point-4',
    name: '京都 浜詰',
    lat: 35.667,
    lon: 134.96,
    bestSwell: 'NNE, N, NNW, NW',
    note: '日本海、北うねり全般',
    beachFacing: 'NW',
    tideStation: 'maizuru',
    bayGeometry: {
      type: 'enclosed',
      openingAngle: 105,
      openingDir: 319,
      openingDirStr: 'NW',
      diffractionFactor: 0.58,
      convergenceFactor: 1.1,
      headlands: [
        { bearing: 231, distanceKm: 5.9, name: '大明神岬' },
      ],
      obstacles: [
        { type: 'islet', bearing: 16,  distanceKm: 0.80, name: '大島' },
        { type: 'islet', bearing: 42,  distanceKm: 4.25, name: 'ヒデリ岩' },
        { type: 'islet', bearing: 253, distanceKm: 4.36, name: '力ノ島' },
        { type: 'islet', bearing: 254, distanceKm: 4.93, name: '沖ノ島' },
        { type: 'islet', bearing: 259, distanceKm: 5.37, name: '出島' },
      ],
    },
  },
  {
    id: 'point-17',
    name: '京都 葛野浜',
    lat: 35.6647,
    lon: 134.9272,
    bestSwell: 'N, NNW, NNE, NW',
    note: '久美浜湾口東側、日本海に直接面した北向きビーチ',
    beachFacing: 'N',
    tideStation: 'maizuru',
    bayGeometry: {
      // 日本海に開いた北向きビーチ。北〜北西のうねりが入りやすい。
      // 西側に沖ノ島（NW方向）があり北西うねりを部分遮蔽。
      type: 'semi-enclosed',
      openingAngle: 150,
      openingDir: 355,
      openingDirStr: 'N',
      diffractionFactor: 0.7,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 270, distanceKm: 2.0, name: '久美浜湾口西岸' },
        { bearing: 90,  distanceKm: 3.5, name: '葛野浜東端' },
      ],
      obstacles: [
        { type: 'island', bearing: 315, distanceKm: 3.5, name: '沖ノ島' },
      ],
    },
  },
  {
    id: 'point-32',
    name: '京都 琴引浜',
    lat: 35.6999,
    lon: 135.0418,
    bestSwell: 'N, NNW, NNE, NW',
    note: '京丹後市網野町。鳴き砂で有名。日本海に面した北向きビーチ。北うねり全般に反応。',
    beachFacing: 'N',
    tideStation: 'maizuru',
    bayGeometry: {
      // 日本海に開いた北向きビーチ。北〜北西のうねりが入りやすい。
      // 東に掛津鼻（太鼓浜）の岬と沖の岩礁があり北東うねりを部分遮蔽。
      // 西の八丁浜方面の岬は遠く影響は軽微。正面の大きな島はない。
      type: 'semi-enclosed',
      openingAngle: 170,
      openingDir: 350,
      openingDirStr: 'N',
      diffractionFactor: 0.85,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 60,  distanceKm: 1.8, name: '掛津鼻' },
        { bearing: 280, distanceKm: 3.0, name: '八丁浜西岬' },
      ],
      obstacles: [
        { type: 'islet', bearing: 45, distanceKm: 2.0, name: '掛津沖岩礁' },
      ],
    },
  },
];
