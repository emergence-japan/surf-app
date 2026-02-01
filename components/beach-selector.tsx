'use client';

import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BeachSelectorProps {
  selectedBeach: string;
  onSelectBeach: (beach: string) => void;
  beaches: string[];
}

export default function BeachSelector({ selectedBeach, onSelectBeach, beaches }: BeachSelectorProps) {
  const isLoading = beaches.length === 0;

  return (
    <Select value={selectedBeach} onValueChange={onSelectBeach} disabled={isLoading}>
      <SelectTrigger className="w-full md:w-96 h-auto py-3 px-4 bg-card border-border hover:border-accent/50 transition-colors [&>span]:line-clamp-none [&>span]:flex-1">
        <div className="flex items-center gap-3 text-left">
          <MapPin size={20} className="text-accent shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Current Beach</p>
            <div className="text-lg font-light text-foreground">
              <SelectValue placeholder={isLoading ? "Loading surf points..." : "Select a beach"} />
            </div>
          </div>
        </div>
      </SelectTrigger>
      <SelectContent>
        {beaches.map((beach) => (
          <SelectItem key={beach} value={beach}>
            {beach}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
