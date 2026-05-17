import type { SurfPoint } from './types';

export const aichiPoints: SurfPoint[] = [
  {
    id: 'point-11',
    name: '愛知 ロングビーチ',
    lat: 34.6,
    lon: 137.22,
    bestSwell: 'SE, SSE, S, SSW',
    note: '太平洋に南向き',
    beachFacing: 'S',
    tideStation: 'omaezaki',
    bayGeometry: {
      type: 'semi-enclosed',
      openingAngle: 201,
      openingDir: 160,
      openingDirStr: 'SSE',
      diffractionFactor: 1.0,
      convergenceFactor: 0.9,
      headlands: [],
      obstacles: [
        { type: 'islet', bearing: 6, distanceKm: 1.37, name: '一色ノ磯' },
      ],
    },
  },
];
