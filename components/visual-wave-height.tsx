'use client';

import { useId } from 'react';

interface VisualWaveHeightProps {
  heightMeters: number;
  className?: string;
}

function getColorConfig(h: number) {
  if (h < 0.5)  return { top: '#bfdbfe', bot: '#2563eb', badge: 'bg-sky-100 text-sky-600 border-sky-200',    glow: 'rgba(56,189,248,0.2)'  };
  if (h < 1.0)  return { top: '#a7f3d0', bot: '#059669', badge: 'bg-emerald-100 text-emerald-600 border-emerald-200', glow: 'rgba(52,211,153,0.2)'  };
  if (h < 1.8)  return { top: '#fde68a', bot: '#d97706', badge: 'bg-amber-100 text-amber-600 border-amber-200',   glow: 'rgba(251,191,36,0.25)' };
  return          { top: '#fecaca', bot: '#dc2626', badge: 'bg-red-100 text-red-600 border-red-200',       glow: 'rgba(248,113,113,0.3)' };
}

export default function VisualWaveHeight({ heightMeters, className = '' }: VisualWaveHeightProps) {
  // useId でインスタンスごとに一意なIDを生成（gradient/clipPath衝突防止）
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const gradId  = `g${uid}`;
  const clipId  = `c${uid}`;

  // ---- スケール設定 ----
  // 1m = 28px, 人の身長 1.7m = 47.6px
  // groundY=88 → 頭頂: 88-47.6≈40 → 腰: 88-28=60 → ヒザ: 88-14=74
  const groundY = 88;
  const PX_PER_M = 28;
  const waveH   = Math.min(Math.max(heightMeters, 0.05) * PX_PER_M, 76);
  const peakY   = groundY - waveH;

  // 波面アニメーションのY（波頂より少し下）
  const surfY = peakY + 5;

  const c = getColorConfig(heightMeters);

  return (
    <div className={`relative ${className}`} style={{ minWidth: 80, minHeight: 80 }}>

      {/* グロー背景 */}
      <div
        className="absolute inset-0 rounded-full blur-2xl scale-110 pointer-events-none"
        style={{ background: c.glow }}
      />

      <div className="relative w-full h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* 波のグラデーション */}
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={c.top} stopOpacity="0.85" />
              <stop offset="100%" stopColor={c.bot} stopOpacity="1"    />
            </linearGradient>
            {/* 波を右半分に制限するクリップ */}
            <clipPath id={clipId}>
              <rect x="34" y="0" width="66" height="100" />
            </clipPath>
          </defs>

          {/* ---- 身体参照ライン（腰・頭）---- */}
          {/* 腰 1.0m */}
          <line x1="2" y1={groundY - PX_PER_M * 1.0} x2="33" y2={groundY - PX_PER_M * 1.0}
            stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="2 2" />
          {/* 頭 1.7m */}
          <line x1="2" y1={groundY - PX_PER_M * 1.7} x2="33" y2={groundY - PX_PER_M * 1.7}
            stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="2 2" />

          {/* ---- 波 ---- */}
          <g clipPath={`url(#${clipId})`}>

            {/* 波のボディ（高さ連動・グラデーション） */}
            <path
              d={`
                M 34,${groundY}
                C 37,${peakY + 7}  44,${peakY}     52,${peakY}
                C 64,${peakY}      82,${peakY + 9}  100,${groundY}
                Z
              `}
              fill={`url(#${gradId})`}
            />

            {/* 波面のリップル（横スクロールアニメーション）
                period=30 SVGユニット → translateX(-30)でシームレスループ */}
            <g opacity="0.22">
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="-30 0"
                dur="2.5s"
                repeatCount="indefinite"
              />
              <path
                d={`
                  M -50,${surfY}
                  Q -35,${surfY - 4}   -20,${surfY}
                  Q  -5,${surfY + 4}    10,${surfY}
                  Q  25,${surfY - 4}    40,${surfY}
                  Q  55,${surfY + 4}    70,${surfY}
                  Q  85,${surfY - 4}   100,${surfY}
                  Q 115,${surfY + 4}   130,${surfY}
                  L 130,${groundY} L -50,${groundY} Z
                `}
                fill="white"
              />
            </g>

            {/* 波頂カール */}
            <path
              d={`M 36,${peakY + 4} Q 49,${peakY - 7} 62,${peakY + 2}`}
              fill="none" stroke="white" strokeWidth="1.8"
              strokeLinecap="round" opacity="0.85"
            />
            {/* 泡 */}
            <ellipse cx="50" cy={peakY + 1} rx="9" ry="2.8" fill="white" opacity="0.38" />
          </g>

          {/* 地面ライン */}
          <line x1="0" y1={groundY} x2="100" y2={groundY} stroke="#cbd5e1" strokeWidth="1" />

          {/* ---- サーファーシルエット ----
               身長 1.7m = 47.6px
               頭中心 y≈44, 足 y=88 */}
          <g stroke="#1e293b" strokeLinecap="round" fill="none" opacity="0.88">
            {/* 頭 */}
            <circle cx="18" cy="44" r="4.2" fill="#1e293b" stroke="none" />
            {/* 胴体 */}
            <line x1="18" y1="48.5" x2="18" y2="65" strokeWidth="5" />
            {/* 左脚 */}
            <line x1="16" y1="64" x2="12" y2="87" strokeWidth="3.5" />
            {/* 右脚 */}
            <line x1="20" y1="64" x2="24" y2="87" strokeWidth="3.5" />
            {/* 左腕（下げ） */}
            <line x1="18" y1="53" x2="8"  y2="62" strokeWidth="2.5" />
            {/* 右腕（上げ・バランス） */}
            <line x1="18" y1="53" x2="29" y2="46" strokeWidth="2.5" />
            {/* サーフボード */}
            <path d="M 9,85 Q 18,93 28,88" strokeWidth="2.2" />
          </g>

        </svg>
      </div>

      {/* 波高バッジ */}
      <div className={`absolute bottom-0 right-0 text-[10px] font-black px-1.5 py-0.5 rounded-full border ${c.badge} shadow-sm`}>
        {heightMeters.toFixed(1)}m
      </div>

    </div>
  );
}
