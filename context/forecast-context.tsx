'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SurfPointDetail } from '@/lib/types';

// Define context shape
interface ForecastContextType {
    allBeachesData: SurfPointDetail[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    lastUpdated: Date | null;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

export function ForecastProvider({ children }: { children: ReactNode }) {
    const [allBeachesData, setAllBeachesData] = useState<SurfPointDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/forecast');
            const data = await res.json();
            if (Array.isArray(data)) {
                setAllBeachesData(data);
                setLastUpdated(new Date());
            } else {
                setAllBeachesData([]);
            }
        } catch (error) {
            console.error('Failed to fetch forecast:', error);
            setAllBeachesData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <ForecastContext.Provider value={{ allBeachesData, isLoading, refreshData: fetchData, lastUpdated }}>
            {children}
        </ForecastContext.Provider>
    );
}

export function useForecast() {
    const context = useContext(ForecastContext);
    if (context === undefined) {
        throw new Error('useForecast must be used within a ForecastProvider');
    }
    return context;
}
