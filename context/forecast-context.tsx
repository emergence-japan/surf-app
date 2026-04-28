'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { SurfPointDetail } from '@/lib/types';
import { applyBoardType } from '@/lib/board-recompute';
import { useBoardType } from './board-type-context';

interface ForecastContextType {
    allBeachesData: SurfPointDetail[];
    isLoading: boolean;
    isError: boolean;
    errorMessage: string | null;
    refreshData: () => Promise<void>;
    lastUpdated: Date | null;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

// セッション内キャッシュ（ページ遷移でも再フェッチしない）
const CACHE_KEY = 'surf-forecast-v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1時間

interface CacheEntry {
    data: SurfPointDetail[];
    timestamp: number;
}

function readCache(): SurfPointDetail[] | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const entry: CacheEntry = JSON.parse(raw);
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            sessionStorage.removeItem(CACHE_KEY);
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

function writeCache(data: SurfPointDetail[]): void {
    try {
        const entry: CacheEntry = { data, timestamp: Date.now() };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
        // sessionStorage が利用不可（プライベートブラウジング等）でも動作を継続
    }
}

export function ForecastProvider({ children }: { children: ReactNode }) {
    const [rawData, setRawData] = useState<SurfPointDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { boardType } = useBoardType();

    const allBeachesData = useMemo(
        () => rawData.map(p => applyBoardType(p, boardType)),
        [rawData, boardType]
    );

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        setErrorMessage(null);

        try {
            const res = await fetch('/api/forecast');
            if (!res.ok) {
                throw new Error(`サーバーエラー (HTTP ${res.status})`);
            }
            const data = await res.json();
            if (!Array.isArray(data)) {
                throw new Error('予期しないレスポンス形式');
            }
            setRawData(data);
            setLastUpdated(new Date());
            writeCache(data);
        } catch (error) {
            setIsError(true);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : '波情報の取得に失敗しました'
            );
            setRawData([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const cached = readCache();
        if (cached) {
            setRawData(cached);
            setIsLoading(false);
            setLastUpdated(new Date());
            return;
        }
        fetchData();
    }, [fetchData]);

    return (
        <ForecastContext.Provider value={{
            allBeachesData,
            isLoading,
            isError,
            errorMessage,
            refreshData: fetchData,
            lastUpdated,
        }}>
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
