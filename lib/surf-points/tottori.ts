import type { SurfPoint } from './types';

export const tottoriPoints: SurfPoint[] = [
  {
    id: 'point-5',
    name: '鳥取 小沢見',
    lat: 35.525,
    lon: 134.108,
    bestSwell: 'NNE, N, NNW',
    note: '西側の大崎岬がNW〜WNW方向を遮蔽。N〜NNEが最もオープンで反応しやすい。NWは岬の陰に入るため小さくなりがち。',
    beachFacing: 'N',
    tideStation: 'sakaiminato',
    bayGeometry: {
      type: 'semi-enclosed',
      openingAngle: 179,
      openingDir: 351,
      openingDirStr: 'N',
      diffractionFactor: 0.99,
      convergenceFactor: 1.0,
      headlands: [],
      obstacles: [
        { type: 'islet',  bearing: 47,  distanceKm: 0.49, name: '淤岐ノ島' },
        { type: 'islet',  bearing: 280, distanceKm: 1.58, name: '鳥帽子岩' },
        { type: 'islet',  bearing: 67,  distanceKm: 2.00, name: '房島' },
        { type: 'islet',  bearing: 58,  distanceKm: 3.13, name: '大島' },
        { type: 'island', bearing: 125, distanceKm: 3.60, name: '団子島' },
        { type: 'island', bearing: 111, distanceKm: 3.76, name: '津生島' },
        { type: 'island', bearing: 120, distanceKm: 5.49, name: '猫島' },
        { type: 'islet',  bearing: 74,  distanceKm: 7.14, name: '鳥ヶ島' },
      ],
    },
  },
  {
    id: 'point-12',
    name: '鳥取 東浜',
    lat: 35.607222,
    lon: 134.295556,
    bestSwell: 'NNE, N, NNW, NW',
    note: '日本海に北〜北西向きに開けたビーチ。東(88°)に羽尾鼻(4km)があり東方向を制限。N〜NWが最も届きやすい。',
    beachFacing: 'N',
    tideStation: 'sakaiminato',
    bayGeometry: {
      // 地図確認済み: 典型的な小湾（入江）形状。
      // 西(289°)に羽尾海岸の岬(2.6km)、東北東(51°)に居組方面の岬(2.6km)が湾を挟む。
      // 開口はNW(320°)〜NNE(30°)の約70°、開口方向は北(0°)付近。
      // OSMの海岸線自動計算(213°)は湾の形状を正しく反映できていなかったため手動修正。
      type: 'enclosed',
      openingAngle: 70,
      openingDir: 355,
      openingDirStr: 'N',
      diffractionFactor: 0.45,
      convergenceFactor: 1.1,
      headlands: [
        { bearing: 289, distanceKm: 2.6, name: '羽尾岬' },
        { bearing: 51,  distanceKm: 2.6, name: '居組岬' },
      ],
      obstacles: [
        { type: 'islet', bearing: 80, distanceKm: 7.82, name: '大振島' },
      ],
    },
  },
  {
    id: 'point-18',
    name: '鳥取 井手ヶ浜',
    lat: 35.5223,
    lon: 133.9860,
    bestSwell: 'N, NNW, NNE, NW',
    note: '日本海に直接面した北向きビーチ',
    beachFacing: 'N',
    tideStation: 'maizuru',
    bayGeometry: {
      // 日本海に開いた北向きのオープンビーチ。北〜北西うねりが入りやすい。
      type: 'open',
      openingAngle: 180,
      openingDir: 360,
      openingDirStr: 'N',
      diffractionFactor: 0.8,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 270, distanceKm: 1.5, name: '井手ヶ浜西端' },
        { bearing: 90,  distanceKm: 1.5, name: '井手ヶ浜東端' },
      ],
    },
  },
  {
    id: 'point-19',
    name: '鳥取 青谷海岸',
    lat: 35.5167,
    lon: 134.0833,
    bestSwell: 'N, NNW, NNE, NW',
    note: '日本海に面した北向きビーチ',
    beachFacing: 'N',
    tideStation: 'maizuru',
    bayGeometry: {
      // 日本海に開いた北向きのオープンビーチ。北〜北西うねりが入りやすい。
      type: 'open',
      openingAngle: 180,
      openingDir: 360,
      openingDirStr: 'N',
      diffractionFactor: 0.8,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 270, distanceKm: 2.0, name: '青谷海岸西端' },
        { bearing: 90,  distanceKm: 2.0, name: '青谷海岸東端' },
      ],
    },
  },
];
