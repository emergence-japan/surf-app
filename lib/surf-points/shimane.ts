import type { SurfPoint } from './types';

export const shimanePoints: SurfPoint[] = [
  {
    id: 'point-15',
    name: '島根 千畳',
    lat: 34.9617,
    lon: 132.135,
    bestSwell: 'NW, NNW, WNW, W',
    note: '浜田市千畳。日本海に北西向きで開けたビーチ。北側に石見畳ヶ浦の岬、南側にも岬があり半enclosed形状。NW〜WNWうねりに最も反応。',
    beachFacing: 'NW',
    tideStation: 'sakaiminato',
    bayGeometry: {
      // 北側: 石見畳ヶ浦岬（約340°/1.5km）がN〜NNEを遮蔽
      // 南側: 南西方向の岬（約230°/1.2km）がSW以南を遮蔽
      // 実質NW〜W方向に約120°の開口
      type: 'semi-enclosed',
      openingAngle: 120,
      openingDir: 300,
      openingDirStr: 'WNW',
      diffractionFactor: 0.65,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 340, distanceKm: 1.5, name: '石見畳ヶ浦岬' },
        { bearing: 230, distanceKm: 1.2, name: '南側岬' },
      ],
      obstacles: [],
    },
  },
];
