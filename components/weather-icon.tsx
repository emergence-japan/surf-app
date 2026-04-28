// WMO weather code → simple SVG icon
export function WeatherIcon({ code, size = 16 }: { code: number; size?: number }) {
  const s = size;

  // Thunderstorm
  if (code >= 95) return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M3 9a4 4 0 1 1 7.9-.9H12a2.5 2.5 0 0 1 0 5H4a3 3 0 0 1-1-5.8" stroke="#707072" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 11l-1.5 3h2L7 17" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Snow
  if (code >= 71 && code <= 77) return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M3 8a4 4 0 1 1 7.9-.9H12a2.5 2.5 0 0 1 0 5H4a3 3 0 0 1-1-5.8" stroke="#9E9EA0" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="6" cy="14" r="1" fill="#06b6d4"/>
      <circle cx="10" cy="13" r="1" fill="#06b6d4"/>
      <circle cx="8" cy="15.5" r="1" fill="#06b6d4"/>
    </svg>
  );

  // Rain / drizzle
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M3 8a4 4 0 1 1 7.9-.9H12a2.5 2.5 0 0 1 0 5H4a3 3 0 0 1-1-5.8" stroke="#9E9EA0" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M6 13.5v2M10 13.5v2M8 14.5v2" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );

  // Fog
  if (code >= 45 && code <= 48) return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M2 9h12M3 12h10M4 15h8" stroke="#9E9EA0" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );

  // Overcast (3)
  if (code === 3) return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M2 10a4 4 0 1 1 7.9-.9H11a2.5 2.5 0 0 1 0 5H3a3 3 0 0 1-1-5.8" stroke="#9E9EA0" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );

  // Partly cloudy (1, 2)
  if (code === 1 || code === 2) return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="3" stroke="#f59e0b" strokeWidth="1.2"/>
      <path d="M5 12a3 3 0 1 1 5.9-.7H12a2 2 0 0 1 0 4H5a2.5 2.5 0 0 1-.5-5" stroke="#9E9EA0" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );

  // Clear (0)
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3.5" stroke="#f59e0b" strokeWidth="1.4"/>
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"
        stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
