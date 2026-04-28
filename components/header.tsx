'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

function SwellLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="10" fill="#0d1b2a" />
      <path
        d="M4 22 Q8 16 12 22 Q16 28 20 22 Q24 16 28 22 Q30 25 32 22"
        stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" fill="none"
      />
      <path
        d="M4 17 Q8 11 12 17 Q16 23 20 17 Q24 11 28 17 Q30 20 32 17"
        stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.35"
      />
    </svg>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md border-b border-[#E5E5E5]' : 'bg-white'
    }`}>
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <SwellLogo />
            <div>
              <p
                className="text-[#0d1b2a] leading-none"
                style={{ fontFamily: "'Barlow Condensed', Helvetica, Arial, sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em' }}
              >
                SWELL<span className="text-[#06b6d4]">.</span>
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#9E9EA0] mt-0.5">波予測プレミアム</p>
            </div>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMenuOpen(v => !v)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#707072] hover:bg-[#F5F5F5] transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {isMenuOpen && (
          <div className="border-t border-[#E5E5E5] py-3 flex flex-col gap-1">
            <Link href="/" onClick={() => setIsMenuOpen(false)}
              className="text-[13px] font-medium text-[#0d1b2a] hover:text-[#06b6d4] px-2 py-2 rounded-lg hover:bg-[#F5F5F5] transition-colors">
              スポット一覧
            </Link>
            <Link href="#" onClick={() => setIsMenuOpen(false)}
              className="text-[13px] font-medium text-[#707072] hover:text-[#06b6d4] px-2 py-2 rounded-lg hover:bg-[#F5F5F5] transition-colors">
              うねりマップ
            </Link>
            <Link href="#" onClick={() => setIsMenuOpen(false)}
              className="text-[13px] font-medium text-[#707072] hover:text-[#06b6d4] px-2 py-2 rounded-lg hover:bg-[#F5F5F5] transition-colors">
              アラート設定
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
