
"use client";

import React from 'react';
import { Player } from '@/lib/game-logic';
import { cn } from '@/lib/utils';
import { X, Circle } from 'lucide-react';

interface BoltGridBoardProps {
  board: (string | null)[];
  onMove: (index: number) => void;
  disabled?: boolean;
  winningIndices?: number[] | null;
}

export const BoltGridBoard: React.FC<BoltGridBoardProps> = ({ 
  board, 
  onMove, 
  disabled, 
  winningIndices 
}) => {
  return (
    <div className="grid-board w-full max-w-[320px] mx-auto p-2 bg-card/50 rounded-2xl shadow-xl backdrop-blur-md">
      {board.map((cell, i) => {
        const isWinning = winningIndices?.includes(i);
        return (
          <button
            key={i}
            disabled={disabled || cell !== null}
            onClick={() => onMove(i)}
            className={cn(
              "grid-cell group relative",
              isWinning && "bg-primary/20 border-primary shadow-[0_0_15px_rgba(132,118,255,0.4)]",
              cell === null && !disabled && "hover:border-primary/50"
            )}
          >
            {cell === 'X' && (
              <X 
                className={cn(
                  "w-12 h-12 text-primary animate-in zoom-in-50 duration-200",
                  isWinning && "drop-shadow-[0_0_5px_currentColor]"
                )} 
                strokeWidth={3}
              />
            )}
            {cell === 'O' && (
              <Circle 
                className={cn(
                  "w-10 h-10 text-secondary animate-in zoom-in-50 duration-200",
                  isWinning && "drop-shadow-[0_0_5px_currentColor]"
                )} 
                strokeWidth={3}
              />
            )}
            
            {/* Visual feedback for hover */}
            {cell === null && !disabled && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 flex items-center justify-center transition-opacity">
                 <Circle className="w-8 h-8 text-primary" strokeWidth={1} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
