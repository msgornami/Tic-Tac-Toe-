
"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GameStatusProps {
  playerXName: string;
  playerOName: string;
  turn: 'X' | 'O';
  myRole: 'X' | 'O' | null;
  status: 'playing' | 'finished' | 'waiting' | 'draw';
}

export const GameStatus: React.FC<GameStatusProps> = ({
  playerXName,
  playerOName,
  turn,
  myRole,
  status,
}) => {
  const isMyTurn = turn === myRole;

  return (
    <div className="flex items-center justify-between w-full max-w-sm px-4 py-3 bg-card/30 rounded-xl border border-white/5">
      <div className={cn(
        "flex flex-col items-center gap-1 transition-opacity",
        turn !== 'X' && "opacity-50"
      )}>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Player X</span>
        <span className="font-headline text-sm font-bold truncate max-w-[100px]">{playerXName || 'Waiting...'}</span>
        {turn === 'X' && <div className="h-1 w-8 bg-primary rounded-full animate-pulse" />}
      </div>

      <div className="flex flex-col items-center">
        {status === 'playing' ? (
          <Badge variant="outline" className={cn(
            "px-3 py-1 text-[10px] uppercase font-bold tracking-tighter",
            isMyTurn ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"
          )}>
            {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
          </Badge>
        ) : (
          <Badge variant="secondary" className="px-3 py-1 text-[10px] uppercase font-bold">
            Match Over
          </Badge>
        )}
      </div>

      <div className={cn(
        "flex flex-col items-center gap-1 transition-opacity",
        turn !== 'O' && "opacity-50"
      )}>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Player O</span>
        <span className="font-headline text-sm font-bold truncate max-w-[100px]">{playerOName || 'Waiting...'}</span>
        {turn === 'O' && <div className="h-1 w-8 bg-secondary rounded-full animate-pulse" />}
      </div>
    </div>
  );
};
