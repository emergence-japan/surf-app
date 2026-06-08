import { describe, it, expect } from 'vitest';
import {
  FREE_FAVORITE_LIMIT,
  canAddFavorite,
  remainingFavorites,
  shouldLockSpot,
} from '@/lib/plan/limits';

describe('FREE_FAVORITE_LIMIT', () => {
  it('無料プランの上限は3', () => {
    expect(FREE_FAVORITE_LIMIT).toBe(3);
  });
});

describe('canAddFavorite', () => {
  it('有料ユーザーは件数に関係なく追加できる', () => {
    expect(canAddFavorite({ isPremium: true, currentCount: 0 })).toBe(true);
    expect(canAddFavorite({ isPremium: true, currentCount: 3 })).toBe(true);
    expect(canAddFavorite({ isPremium: true, currentCount: 999 })).toBe(true);
  });

  it('無料ユーザーは上限未満なら追加できる', () => {
    expect(canAddFavorite({ isPremium: false, currentCount: 0 })).toBe(true);
    expect(canAddFavorite({ isPremium: false, currentCount: 2 })).toBe(true);
  });

  it('無料ユーザーは上限ちょうど・超過では追加できない', () => {
    expect(canAddFavorite({ isPremium: false, currentCount: 3 })).toBe(false);
    expect(canAddFavorite({ isPremium: false, currentCount: 4 })).toBe(false);
  });
});

describe('remainingFavorites', () => {
  it('有料ユーザーは無制限（null）', () => {
    expect(remainingFavorites({ isPremium: true, currentCount: 0 })).toBeNull();
    expect(remainingFavorites({ isPremium: true, currentCount: 100 })).toBeNull();
  });

  it('無料ユーザーは残り枠を返す', () => {
    expect(remainingFavorites({ isPremium: false, currentCount: 0 })).toBe(3);
    expect(remainingFavorites({ isPremium: false, currentCount: 2 })).toBe(1);
    expect(remainingFavorites({ isPremium: false, currentCount: 3 })).toBe(0);
  });

  it('無料ユーザーが上限を超えていても負数にならない（0でクランプ）', () => {
    expect(remainingFavorites({ isPremium: false, currentCount: 5 })).toBe(0);
  });
});

describe('shouldLockSpot', () => {
  it('有料ユーザーは常にロックされない', () => {
    expect(shouldLockSpot({ isPremium: true, isFavorited: false })).toBe(false);
    expect(shouldLockSpot({ isPremium: true, isFavorited: true })).toBe(false);
  });

  it('お気に入り済みのスポットはロックされない（無料でも）', () => {
    expect(shouldLockSpot({ isPremium: false, isFavorited: true })).toBe(false);
  });

  it('無料ユーザーの未お気に入りスポットはロックされる', () => {
    expect(shouldLockSpot({ isPremium: false, isFavorited: false })).toBe(true);
  });
});
