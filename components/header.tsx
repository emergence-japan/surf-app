'use client';

import { Waves, Menu, Search, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-white/80 backdrop-blur-md border-b border-blue-100 py-3 shadow-sm" 
        : "bg-transparent py-5"
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Waves size={24} className="text-white" />
              <div className="absolute -inset-1 bg-blue-400/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <h1 className="text-2xl font-light text-foreground tracking-tighter leading-none">
                SWELL<span className="font-bold text-blue-500">.</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">波予測プレミアム</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-blue-500 transition-colors">スポット検索</Link>
            <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-blue-500 transition-colors">うねりマップ</Link>
            <Link href="#" className="text-sm font-medium text-foreground/80 hover:text-blue-500 transition-colors">アラート設定</Link>
            <div className="h-4 w-px bg-border mx-2" />
            <div className="flex items-center gap-4">
              <button className="p-2 text-muted-foreground hover:text-blue-500 transition-colors">
                <Search size={20} />
              </button>
              <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20">
                <User size={16} />
                <span>ログイン</span>
              </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={24} className="text-foreground" />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? "max-h-64 mt-6 opacity-100" : "max-h-0 opacity-0"
        }`}>
          <nav className="bg-white/50 backdrop-blur-lg rounded-2xl border border-blue-50/50 p-4 space-y-1">
            <Link href="/" className="block text-sm font-medium text-foreground hover:bg-blue-50 hover:text-blue-500 rounded-lg px-4 py-3 transition-all">
              スポット検索
            </Link>
            <Link href="#" className="block text-sm font-medium text-foreground hover:bg-blue-50 hover:text-blue-500 rounded-lg px-4 py-3 transition-all">
              うねりマップ
            </Link>
            <Link href="#" className="block text-sm font-medium text-foreground hover:bg-blue-50 hover:text-blue-500 rounded-lg px-4 py-3 transition-all">
              アラート設定
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
