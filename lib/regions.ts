import type { SurfPointDetail } from './types';

export type RegionName =
  | '北海道・東北'
  | '関東'
  | '中部'
  | '関西'
  | '中国'
  | '四国'
  | '九州・沖縄'
  | 'その他';

const PREFECTURE_TO_REGION: Record<string, RegionName> = {
  北海道: '北海道・東北',
  青森: '北海道・東北',
  岩手: '北海道・東北',
  宮城: '北海道・東北',
  秋田: '北海道・東北',
  山形: '北海道・東北',
  福島: '北海道・東北',
  茨城: '関東',
  栃木: '関東',
  群馬: '関東',
  埼玉: '関東',
  千葉: '関東',
  東京: '関東',
  神奈川: '関東',
  新潟: '中部',
  富山: '中部',
  石川: '中部',
  福井: '中部',
  山梨: '中部',
  長野: '中部',
  岐阜: '中部',
  静岡: '中部',
  愛知: '中部',
  三重: '関西',
  滋賀: '関西',
  京都: '関西',
  大阪: '関西',
  兵庫: '関西',
  奈良: '関西',
  和歌山: '関西',
  鳥取: '中国',
  島根: '中国',
  岡山: '中国',
  広島: '中国',
  山口: '中国',
  徳島: '四国',
  香川: '四国',
  愛媛: '四国',
  高知: '四国',
  福岡: '九州・沖縄',
  佐賀: '九州・沖縄',
  長崎: '九州・沖縄',
  熊本: '九州・沖縄',
  大分: '九州・沖縄',
  宮崎: '九州・沖縄',
  鹿児島: '九州・沖縄',
  沖縄: '九州・沖縄',
};

const REGION_ORDER: RegionName[] = [
  '北海道・東北',
  '関東',
  '中部',
  '関西',
  '中国',
  '四国',
  '九州・沖縄',
  'その他',
];

const QUALITY_ORDER: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };

export function getPrefecture(beach: string): string {
  return beach.split(/\s+/)[0];
}

export function getRegion(beach: string): RegionName {
  const pref = getPrefecture(beach);
  return PREFECTURE_TO_REGION[pref] ?? 'その他';
}

export interface RegionGroup {
  region: RegionName;
  points: SurfPointDetail[];
  bestQuality: string;
}

export function groupByRegion(points: SurfPointDetail[]): RegionGroup[] {
  const map = new Map<RegionName, SurfPointDetail[]>();

  for (const point of points) {
    const region = getRegion(point.beach);
    const existing = map.get(region) ?? [];
    map.set(region, [...existing, point]);
  }

  return REGION_ORDER
    .filter(region => map.has(region))
    .map(region => {
      const regionPoints = map.get(region)!;
      const sorted = [...regionPoints].sort((a, b) => {
        const qDiff = (QUALITY_ORDER[a.quality] ?? 5) - (QUALITY_ORDER[b.quality] ?? 5);
        if (qDiff !== 0) return qDiff;
        return (b.heightMeters ?? 0) - (a.heightMeters ?? 0);
      });
      const bestQuality = sorted[0]?.quality ?? 'D';
      return { region, points: sorted, bestQuality };
    });
}
