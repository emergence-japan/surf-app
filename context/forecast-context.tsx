'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { SurfPointDetail, ForecastApiResponse } from '@/lib/types';
import { applyBoardType } from '@/lib/board-recompute';
import { useBoardType } from './board-type-context';

interface ForecastContextType {
    allBeachesData: SurfPointDetail[];
    isLoading: boolean;
    isError: boolean;
    errorMessage: string | null;
    refreshData: () => Promise<void>;
    lastUpdated: Date | null;
    /** 取得に失敗しているスポット数（部分障害の可視化用） */
    failedSpotCount: number;
    /** stale（1時間超）データを返しているスポット数 */
    staleSpotCount: number;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

// セッション内キャッシュ（ページ遷移でも再フェッチしない）
// サーバー側 Redis キャッシュが主、こちらはネットワーク往復削減のための軽い補助。
const CACHE_KEY = 'surf-forecast-v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分（サーバーが1時間フレッシュなのでクライアントは短く）

interface SessionCacheEntry {
    payload: ForecastApiResponse;
    timestamp: number;
}

function readCache(): ForecastApiResponse | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const entry: SessionCacheEntry = JSON.parse(raw);
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
            sessionStorage.removeItem(CACHE_KEY);
            return null;
        }
        return entry.payload;
    } catch {
        return null;
    }
}

function writeCache(payload: ForecastApiResponse): void {
    try {
        const entry: SessionCacheEntry = { payload, timestamp: Date.now() };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
        // sessionStorage が利用不可（プライベートブラウジング等）でも動作を継続
    }
}

function applyResponse(payload: ForecastApiResponse): {
    rawData: SurfPointDetail[];
    failedCount: number;
    staleCount: number;
} {
    const rawData = payload.spots
        .filter(s => s.data !== null)
        .map(s => s.data as SurfPointDetail);
    return {
        rawData,
        failedCount: payload.meta.error,
        staleCount: payload.meta.stale,
    };
}

export function ForecastProvider({ children }: { children: ReactNode }) {
    const [rawData, setRawData] = useState<SurfPointDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [failedSpotCount, setFailedSpotCount] = useState(0);
    const [staleSpotCount, setStaleSpotCount] = useState(0);
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
            const payload = (await res.json()) as ForecastApiResponse;
            if (!payload || !Array.isArray(payload.spots) || !payload.meta) {
                throw new Error('予期しないレスポンス形式');
            }
            const { rawData: nextRaw, failedCount, staleCount } = applyResponse(payload);
            setRawData(nextRaw);
            setFailedSpotCount(failedCount);
            setStaleSpotCount(staleCount);
            setLastUpdated(new Date());
            writeCache(payload);
        } catch (error) {
            setIsError(true);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : '波情報の取得に失敗しました'
            );
            setRawData([]);
            setFailedSpotCount(0);
            setStaleSpotCount(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const cached = readCache();
        if (cached) {
            const { rawData: nextRaw, failedCount, staleCount } = applyResponse(cached);
            setRawData(nextRaw);
            setFailedSpotCount(failedCount);
            setStaleSpotCount(staleCount);
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
            failedSpotCount,
            staleSpotCount,
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
