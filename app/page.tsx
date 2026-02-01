'use client';

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Droplets, Wind, MapPin } from 'lucide-react'
import Header from "@/components/header"
import { useForecast } from "@/context/forecast-context"
import { convertWindDirection } from "@/lib/converters"
import VisualWaveHeight from "@/components/visual-wave-height"

// Home component using global context
export default function Home() {
  const { allBeachesData, isLoading } = useForecast();

  // Sort by height value (descending)
  const sortedPoints = [...allBeachesData].sort((a, b) => {
    return (b.heightMeters || 0) - (a.heightMeters || 0);
  });

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-light text-foreground mb-4">
            Surf Forecast
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Real-time wave conditions and detailed forecasts for top surf spots.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Skeleton Loading */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-card rounded-lg border border-border animate-pulse flex flex-col justify-between p-6">
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPoints.map((point) => (
              <Link key={point.id} href={`/point/${point.id}`}>
                <div className="group bg-card hover:bg-accent/5 transition-all duration-300 rounded-lg p-6 border border-border hover:border-accent hover:shadow-lg cursor-pointer h-full relative overflow-hidden">

                  {/* Quality Badge */}
                  <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg uppercase tracking-wider
                      ${point.quality === 'S' ? 'bg-purple-600 text-white' :
                      point.quality === 'A' ? 'bg-blue-500 text-white' :
                      point.quality === 'B' ? 'bg-emerald-500 text-white' :
                      point.quality === 'C' ? 'bg-yellow-500 text-white' : 'bg-slate-500 text-white'
                    }`}>
                    {point.quality}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={18} className="text-accent" />
                    <h2 className="text-xl font-medium text-foreground group-hover:text-accent transition-colors">{point.beach}</h2>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <VisualWaveHeight heightMeters={point.heightMeters || 0} className="w-16 h-16 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">WAVE HEIGHT</p>
                        <p className="text-3xl font-light text-foreground leading-none">{point.height}</p>
                      </div>
                    </div>
                    <ArrowRight className="text-muted-foreground group-hover:text-accent transform group-hover:translate-x-1 transition-all" size={24} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Droplets size={16} />
                      <span className="text-sm">{point.period?.toFixed(1) ?? '-'}s</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wind size={16} />
                      <span className="text-sm">{point.windSpeed?.toFixed(1) ?? '-'}m/s {convertWindDirection(point.windDirection)}</span>
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
