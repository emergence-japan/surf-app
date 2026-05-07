import type { TideStationKey } from './tide-predictor';

export interface Obstacle {
  type: 'island' | 'islet' | 'reef';
  bearing: number;       // スポットからの方位（度）
  distanceKm: number;    // スポットからの距離（km）
  name?: string;
}

export interface BayGeometry {
  type: 'open' | 'semi-enclosed' | 'enclosed';
  openingAngle: number;      // 湾口の開き角度（度）: 360=完全オープン, 60=深い湾
  openingDir: number;        // 湾口の向き（度、0=北）
  openingDirStr: string;     // 湾口の向き（16方位）
  diffractionFactor: number; // 回折係数 0.0〜1.0（岬の影でも波が回り込む度合い）
  convergenceFactor: number; // 収束係数（>1.0=湾奥に波が集まる、<1.0=分散）
  headlands: Array<{
    bearing: number;
    distanceKm: number;
    name?: string;
  }>;
  obstacles?: Obstacle[];    // 沖の島・岩礁（スウェルを部分的に遮蔽）
}

export interface SurfPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bestSwell?: string;
  note?: string;
  beachFacing: string;
  tideStation: TideStationKey;
  bayGeometry?: BayGeometry; // fetch-coastal-geometry.ts で自動取得・確認済みの値
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
    id: 'point-6',
    name: '三重 国府の浜',
    lat: 34.354,
    lon: 136.885,
    bestSwell: 'E, ESE, SE, SSE, S',
    note: '東〜南うねりメイン',
    beachFacing: 'E',
    tideStation: 'toba',
    bayGeometry: {
      // 志摩半島外海側の太平洋に面した遠浅オープンビーチ（約3km）。
      // 伊勢湾ではなく太平洋直面。東〜南東うねりがコンスタントに届く。
      // 南側に志摩半島の岬群（老岬など）が連なりSSW以南を遮蔽。
      // 北側は開けており、E〜SEが最もオープン。
      type: 'semi-enclosed',
      openingAngle: 160,
      openingDir: 120,
      openingDirStr: 'ESE',
      diffractionFactor: 0.7,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 172, distanceKm: 4.3, name: '崎ノ城' },
        { bearing: 178, distanceKm: 5.9, name: '鳶ヶ巣' },
        { bearing: 170, distanceKm: 7.7, name: '老岬' },
      ],
      obstacles: [
        { type: 'islet',  bearing: 175, distanceKm: 3.62, name: '油瀬' },
        { type: 'islet',  bearing: 208, distanceKm: 6.60, name: '立石夫婦岩' },
        { type: 'island', bearing: 226, distanceKm: 7.41, name: '弁天島' },
      ],
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
      // 志摩半島外海側、太平洋に面したビーチ。
      // 北側に崎ノ城(NNE 1.3km)、南側に鳶ヶ巣(SSE 0.4km)・老岬(SSE 2.5km)・大王崎(SSE 3.3km)が連なる。
      // 実質E〜SE方向の約120°が有効開口。岬群が近接するためdiffraction適度。
      // OSM自動計算値はリアス海岸により破綻するため手動修正済み（岬・障害物リストはOverpass実測）。
      type: 'semi-enclosed',
      openingAngle: 130,
      openingDir: 110,
      openingDirStr: 'ESE',
      diffractionFactor: 0.55,
      convergenceFactor: 1.0,
      headlands: [
        { bearing: 160, distanceKm: 0.4, name: '鳶ヶ巣' },
        { bearing: 22,  distanceKm: 1.3, name: '崎ノ城' },
        { bearing: 150, distanceKm: 2.5, name: '老岬' },
        { bearing: 154, distanceKm: 3.3, name: '大王崎' },
        { bearing: 199, distanceKm: 5.0, name: '退治崎' },
        { bearing: 209, distanceKm: 7.4, name: '麦崎' },
      ],
      obstacles: [
        { type: 'islet', bearing: 7,   distanceKm: 1.86, name: '油瀬' },
        { type: 'islet', bearing: 263, distanceKm: 3.22, name: '立石夫婦岩' },
        { type: 'islet', bearing: 143, distanceKm: 3.39, name: '大王島' },
      ],
    },
  },
  {
    id: 'point-7',
    name: '和歌山 磯ノ浦',
    lat: 34.257,
    lon: 135.12,
    bestSwell: 'SSW, SW, WSW, S',
    note: '大阪湾内、強い南西〜南が必要',
    beachFacing: 'SSW',
    tideStation: 'osaka',
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
  {
    id: 'point-8',
    name: '徳島 小松海岸',
    lat: 34.055,
    lon: 134.588,
    bestSwell: 'ESE, SE, SSE, S',
    note: '紀伊水道、東〜南反応',
    beachFacing: 'SE',
    tideStation: 'komatsushima',
    bayGeometry: {
      type: 'enclosed',
      openingAngle: 76,
      openingDir: 154,
      openingDirStr: 'SSE',
      diffractionFactor: 0.42,
      convergenceFactor: 1.1,
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
    id: 'point-10',
    name: '高知 生見',
    lat: 33.535,
    lon: 134.33,
    bestSwell: 'ESE, SE, SSE, S',
    note: '東洋町、南東がベスト',
    beachFacing: 'SE',
    tideStation: 'muroto',
    bayGeometry: {
      type: 'semi-enclosed',
      openingAngle: 199,
      openingDir: 131,
      openingDirStr: 'SE',
      diffractionFactor: 0.8,
      convergenceFactor: 0.9,
      headlands: [
        { bearing: 297, distanceKm: 2.6, name: '塚崎' },
        { bearing: 287, distanceKm: 2.6, name: '唐人ヶ鼻' },
        { bearing: 246, distanceKm: 4.1, name: '松ヶ鼻' },
        { bearing: 32,  distanceKm: 5.9, name: '乳ノ崎' },
      ],
      obstacles: [
        { type: 'islet', bearing: 283, distanceKm: 1.79, name: '葛島' },
        { type: 'islet', bearing: 350, distanceKm: 2.38, name: '棚碆' },
        { type: 'islet', bearing: 350, distanceKm: 2.57, name: 'ウバエ島' },
        { type: 'islet', bearing: 339, distanceKm: 2.85, name: 'サビ島' },
        { type: 'islet', bearing: 278, distanceKm: 2.94, name: '赤葉島' },
        { type: 'islet', bearing: 340, distanceKm: 3.02, name: '鹿子居島' },
        { type: 'islet', bearing: 337, distanceKm: 3.14, name: 'シシケ碆' },
        { type: 'reef',  bearing: 281, distanceKm: 3.18 },
        { type: 'reef',  bearing: 281, distanceKm: 3.56 },
        { type: 'islet', bearing: 7,   distanceKm: 5.45, name: '二子島' },
      ],
    },
  },
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
  {
    id: 'point-14',
    name: '高知 尾崎ビーチ',
    lat: 33.367,
    lon: 134.2,
    bestSwell: 'ESE, SE, SSE, S',
    note: '室戸市。太平洋に開けたオープンビーチ。南〜東南東うねりに素直に反応。',
    beachFacing: 'SE',
    tideStation: 'muroto',
    bayGeometry: {
      // 室戸岬北側の直線的な海岸。遮蔽物が少なくほぼオープン。
      // 北側（15°/4km付近）に小さな岬があるが影響は軽微。
      type: 'open',
      openingAngle: 220,
      openingDir: 135,
      openingDirStr: 'SE',
      diffractionFactor: 0.95,
      convergenceFactor: 0.95,
      headlands: [],
      obstacles: [],
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
