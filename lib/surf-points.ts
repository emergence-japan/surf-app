export interface SurfPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bestSwell?: string;
  note?: string;
  beachFacing: string; // ビーチが向いている方角 (例: 'E', 'S')
}

// 日本全国の主要サーフポイント
export const surfPoints: SurfPoint[] = [
  {
    id: 'point-1',
    name: '福井 鳥居浜',
    lat: 35.506,
    lon: 135.532,
    bestSwell: 'NE, NNE, N, NNW',
    note: '北東に少し向いている',
    beachFacing: 'NE'
  },
  {
    id: 'point-2',
    name: '福井 難波江',
    lat: 35.518,
    lon: 135.485,
    bestSwell: 'ENE,E, ESE',
    beachFacing: 'E'
  },
  {
    id: 'point-3',
    name: '京都 八丁浜',
    lat: 35.678,
    lon: 135.068,
    bestSwell: 'NNE, N, NNW, NW',
    note: '日本海、北うねり全般',
    beachFacing: 'N'
  },
  {
    id: 'point-4',
    name: '京都 浜詰',
    lat: 35.667,
    lon: 134.96,
    bestSwell: 'NNE, N, NNW, NW',
    note: '日本海、北うねり全般',
    beachFacing: 'NW'
  },
  {
    id: 'point-5',
    name: '鳥取 小沢見',
    lat: 35.525,
    lon: 134.108,
    bestSwell: 'NNE, N, NNW, NW',
    note: '日本海全般',
    beachFacing: 'N'
  },
  {
    id: 'point-6',
    name: '三重 国府の浜',
    lat: 34.354,
    lon: 136.885,
    bestSwell: 'E, ESE, SE, SSE, S',
    note: '東〜南うねりメイン',
    beachFacing: 'E'
  },
  {
    id: 'point-7',
    name: '和歌山 磯ノ浦',
    lat: 34.257,
    lon: 135.12,
    bestSwell: 'S, SSW, SW, WSW',
    note: '大阪湾内、強い南が必要',
    beachFacing: 'S'
  },
  {
    id: 'point-8',
    name: '徳島 小松海岸',
    lat: 34.055,
    lon: 134.588,
    bestSwell: 'ESE, SE, SSE, S',
    note: '紀伊水道、東〜南反応',
    beachFacing: 'SE'
  },
  {
    id: 'point-9',
    name: '徳島 宍喰',
    lat: 33.56,
    lon: 134.305,
    bestSwell: 'S, SSE, SE, ESE',
    note: '南〜東うねりに開いている',
    beachFacing: 'SE'
  },
  {
    id: 'point-10',
    name: '高知 生見',
    lat: 33.535,
    lon: 134.33,
    bestSwell: 'ESE, SE, SSE, S',
    note: '東洋町、南東がベスト',
    beachFacing: 'SE'
  },
  {
    id: 'point-11',
    name: '愛知 ロングビーチ',
    lat: 34.6,
    lon: 137.22,
    bestSwell: 'SE, SSE, S, SSW',
    note: '太平洋に南向き',
    beachFacing: 'S'
  },

];