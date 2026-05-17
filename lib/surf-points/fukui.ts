import type { SurfPoint } from './types';

export const fukuiPoints: SurfPoint[] = [
  {
    id: 'point-1',
    name: '福井 鳥居浜',
    lat: 35.506,
    lon: 135.532,
    bestSwell: 'NE, NNE, N, NNW',
    note: '北東に少し向いている',
    beachFacing: 'NE',
    tideStation: 'maizuru',
    bayGeometry: {
      type: 'enclosed',
      openingAngle: 92,
      openingDir: 32,
      openingDirStr: 'NNE',
      diffractionFactor: 0.41,
      convergenceFactor: 1.1,
      headlands: [
        { bearing: 306, distanceKm: 4.6, name: 'ダンノ鼻' },
        { bearing: 320, distanceKm: 5.1, name: '蔕ヶ崎' },
        { bearing: 344, distanceKm: 5.2, name: '今戸鼻' },
        { bearing: 305, distanceKm: 5.7, name: '広瀬鼻' },
        { bearing: 298, distanceKm: 6.0, name: '長崎鼻' },
        { bearing: 331, distanceKm: 6.1, name: '押廻鼻' },
        { bearing: 325, distanceKm: 7.1, name: '正面崎' },
      ],
      obstacles: [
        { type: 'islet',  bearing: 133, distanceKm: 1.61, name: '鷹島' },
        { type: 'island', bearing: 131, distanceKm: 1.82, name: '稲島' },
        { type: 'island', bearing: 312, distanceKm: 1.97, name: '名島' },
        { type: 'islet',  bearing: 107, distanceKm: 3.44, name: '葉積島' },
        { type: 'islet',  bearing: 339, distanceKm: 3.49, name: '風島' },
      ],
    },
  },
  {
    id: 'point-2',
    name: '福井 難波江',
    lat: 35.518,
    lon: 135.485,
    bestSwell: 'ENE, E, ESE',
    note: '北側の難波江城跡の岬がN・NNE方向を遮蔽。ENE〜ESEが最もオープン。',
    beachFacing: 'E',
    tideStation: 'maizuru',
    bayGeometry: {
      // 東向きビーチ。北側にダンノ鼻・広瀬鼻が連なりN〜NWを遮蔽。
      // 南側も岬がありSSE以南を制限。実質ENE〜ESEの約90°が有効開口。
      // OSM海岸線データが湾内陸側を拾うため手動修正済み。
      type: 'enclosed',
      openingAngle: 90,
      openingDir: 90,
      openingDirStr: 'E',
      diffractionFactor: 0.39,
      convergenceFactor: 1.1,
      headlands: [
        { bearing: 21,  distanceKm: 1.5, name: 'ダンノ鼻' },
        { bearing: 349, distanceKm: 1.9, name: '広瀬鼻' },
        { bearing: 326, distanceKm: 1.9, name: '長崎鼻' },
        { bearing: 21,  distanceKm: 2.7, name: '蔕ヶ崎' },
        { bearing: 18,  distanceKm: 4.2, name: '押廻鼻' },
        { bearing: 2,   distanceKm: 4.4, name: '正面崎' },
        { bearing: 37,  distanceKm: 4.6, name: '今戸鼻' },
      ],
      obstacles: [
        { type: 'island', bearing: 90,  distanceKm: 2.80, name: '名島' },
        { type: 'islet',  bearing: 57,  distanceKm: 3.58, name: '風島' },
        { type: 'islet',  bearing: 114, distanceKm: 5.95, name: '鷹島' },
        { type: 'island', bearing: 114, distanceKm: 6.17, name: '稲島' },
        { type: 'islet',  bearing: 107, distanceKm: 7.90, name: '葉積島' },
      ],
    },
  },
];
