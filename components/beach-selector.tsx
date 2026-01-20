'use client';

import { MapPin, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface BeachSelectorProps {
  selectedBeach: string;
  onSelectBeach: (beach: string) => void;
  beaches: string[];
}

export default function BeachSelector({ selectedBeach, onSelectBeach, beaches }: BeachSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-96 flex items-center justify-between px-6 py-4 bg-card border border-border rounded-lg hover:border-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <MapPin size={20} className="text-accent" />
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Current Beach</p>
            <p className="text-lg font-light text-foreground">{selectedBeach}</p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {beaches.map((beach) => (
              <button
                key={beach}
                onClick={() => {
                  onSelectBeach(beach);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-6 py-3 transition-colors ${
                  selectedBeach === beach
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {beach}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
