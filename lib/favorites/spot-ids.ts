import { surfPoints } from '@/lib/surf-points';

// 既知のスポットID集合。お気に入り登録時の境界バリデーションに使う。
const KNOWN_SPOT_IDS = new Set(surfPoints.map((p) => p.id));

export function isKnownSpotId(spotId: string): boolean {
  return KNOWN_SPOT_IDS.has(spotId);
}
