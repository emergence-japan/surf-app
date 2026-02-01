import React from 'react';

interface VisualWaveHeightProps {
  heightMeters: number; // 波の高さ（メートル）
  className?: string;
}

export default function VisualWaveHeight({ heightMeters, className = '' }: VisualWaveHeightProps) {
  // DEBUG: Check input value
  if (typeof window !== 'undefined') {
      console.log(`VisualWaveHeight input: ${heightMeters}m`);
  }

  // SVGの設定
  const viewBoxHeight = 100;
  const viewBoxWidth = 100;
  
  // スケール計算
  // 1.0m = 40px で計算し、人体比率に合わせる
  const pixelsPerMeter = 40; 
  const groundY = 95; // 地面のY座標
  
  // 人体座標の定義 (Ground = 95)
  // 身長1.7m -> 95 - (1.7 * 40) = 27px
  // 腰 1.0m -> 95 - 40 = 55px
  // 膝 0.5m -> 95 - 20 = 75px
  
  const personX = 25; // サーファーのX座標中心

  // 波の高さ計算
  // 表示上の上限を少し設ける（3m超えは枠外に出るためクリップされるがOK）
  const visualHeight = Math.max(heightMeters, 0.1); 
  const waveHeightPixels = visualHeight * pixelsPerMeter;
  const wavePeakY = groundY - waveHeightPixels;

  // 波の色
  const getWaveColor = (h: number) => {
    if (h < 0.5) return "#60A5FA"; // blue-400 (Knee)
    if (h < 1.0) return "#34D399"; // emerald-400 (Waist)
    if (h < 1.5) return "#FBBF24"; // amber-400 (Chest/Head)
    return "#F87171"; // red-400 (Overhead)
  };

  return (
    <div className={`relative ${className}`} style={{ width: '100px', height: '100px' }}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ガイドライン (目安) */}
        {/* 1.0m (腰付近) */}
        <line x1="10" y1={groundY - 40} x2="90" y2={groundY - 40} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
        {/* 2.0m (オーバーヘッド) */}
        <line x1="10" y1={groundY - 80} x2="90" y2={groundY - 80} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />

        {/* 地面 */}
        <line x1="0" y1={groundY} x2="100" y2={groundY} stroke="#94a3b8" strokeWidth="1.5" />
        
        {/* サーファーのシルエット (詳細化) */}
        <g fill="#475569" stroke="#475569">
          {/* Head (Top at ~25px) */}
          <circle cx={personX} cy={29} r="3.5" stroke="none" />
          {/* Body (Neck to Waist) */}
          <line x1={personX} y1={33} x2={personX} y2={55} strokeWidth="6" strokeLinecap="round" />
          {/* Legs (Waist to Ground) */}
          <path d={`M ${personX},52 L ${personX - 4},${groundY} M ${personX},52 L ${personX + 4},${groundY}`} strokeWidth="3" strokeLinecap="round" />
          {/* Arms */}
          <path d={`M ${personX},36 L ${personX - 6},50 M ${personX},36 L ${personX + 6},50`} strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* 波のシェイプ */}
        {/* 人のすぐ横(X=50付近)でピークになるように描画 */}
        <path
          d={`
            M 35,${groundY} 
            Q 55,${wavePeakY} 75,${wavePeakY} 
            T 100,${groundY} 
            L 100,${groundY} 
            L 35,${groundY}
          `}
          fill={getWaveColor(heightMeters)}
          opacity="0.85"
        />
        
        {/* 波のトップライン強調 */}
        <path
          d={`
            M 35,${groundY} 
            Q 55,${wavePeakY} 75,${wavePeakY} 
          `}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.5"
        />

      </svg>
      
      {/* 数値ラベル */}
      <div className="absolute bottom-0 right-0 text-xs font-bold text-slate-500 bg-white/90 px-1 rounded border border-slate-100">
        {heightMeters.toFixed(1)}m
      </div>
    </div>
  );
}
