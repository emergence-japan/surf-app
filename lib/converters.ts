// 16方位方角の日本語変換
export const windDirectionMap: Record<string, string> = {
  N: '北',
  NNE: '北北東',
  NE: '北東',
  ENE: '東北東',
  E: '東',
  ESE: '東南東',
  SE: '南東',
  SSE: '南南東',
  S: '南',
  SSW: '南南西',
  SW: '南西',
  WSW: '西南西',
  W: '西',
  WNW: '西北西',
  NW: '北西',
  NNW: '北北西',
};

// 方角を16方位の日本語に変換
export function convertWindDirection(direction: string): string {
  return windDirectionMap[direction.toUpperCase()] || direction;
}

// ftをmに変換（フィート to メートル）
export function convertFeetToMeters(feetRange: string): string {
  const parts = feetRange.split('-');
  if (parts.length === 2) {
    const ft1 = parseFloat(parts[0]);
    const ft2 = parseFloat(parts[1].replace('ft', ''));
    const m1 = (ft1 * 0.3048).toFixed(1);
    const m2 = (ft2 * 0.3048).toFixed(1);
    return `${m1}-${m2}m`;
  }
  return feetRange;
}
