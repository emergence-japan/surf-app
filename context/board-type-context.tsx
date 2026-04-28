'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { BoardType } from '@/lib/types';

interface BoardTypeContextValue {
  boardType: BoardType;
  setBoardType: (t: BoardType) => void;
  toggle: () => void;
}

const BoardTypeContext = createContext<BoardTypeContextValue | undefined>(undefined);
const STORAGE_KEY = 'surf-board-type';

export function BoardTypeProvider({ children }: { children: ReactNode }) {
  const [boardType, setBoardTypeState] = useState<BoardType>('short');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'short' || saved === 'long') {
        setBoardTypeState(saved);
      }
    } catch {
      // localStorage 利用不可（プライベートブラウジング等）でも動作継続
    }
  }, []);

  const setBoardType = (t: BoardType) => {
    setBoardTypeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
  };

  const toggle = () => setBoardType(boardType === 'short' ? 'long' : 'short');

  return (
    <BoardTypeContext.Provider value={{ boardType, setBoardType, toggle }}>
      {children}
    </BoardTypeContext.Provider>
  );
}

export function useBoardType() {
  const ctx = useContext(BoardTypeContext);
  if (!ctx) throw new Error('useBoardType must be used within BoardTypeProvider');
  return ctx;
}
