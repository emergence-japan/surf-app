'use client';

import { Waves, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Waves size={24} className="text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-light text-foreground tracking-tight">swell</h1>
              <p className="text-xs text-muted-foreground">Wave Forecast</p>
            </div>
          </div>

          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-card transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={24} className="text-foreground" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="mt-4 pt-4 border-t border-border space-y-3">
            <a href="#" className="block text-sm text-foreground hover:text-accent transition-colors py-2">
              Dashboard
            </a>
            <a href="#" className="block text-sm text-foreground hover:text-accent transition-colors py-2">
              Favorites
            </a>
            <a href="#" className="block text-sm text-foreground hover:text-accent transition-colors py-2">
              Settings
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
