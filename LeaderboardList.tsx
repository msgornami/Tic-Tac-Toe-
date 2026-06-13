
"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Trophy, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LeaderboardList = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('rating', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading legends...</div>;

  return (
    <div className="space-y-3">
      {players.map((player, idx) => (
        <Card 
          key={player.id} 
          className={cn(
            "p-3 flex items-center justify-between bg-card/40 border-white/5",
            idx === 0 && "bg-primary/10 border-primary/20",
            idx === 1 && "bg-secondary/10 border-secondary/20",
            idx === 2 && "bg-orange-500/10 border-orange-500/20"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 text-center font-headline font-bold text-sm">
              {idx === 0 ? <Crown className="w-5 h-5 text-yellow-400 mx-auto" /> : idx + 1}
            </div>
            <Avatar className="h-10 w-10 border-2 border-background shadow-lg">
              <AvatarImage src={`https://picsum.photos/seed/${player.id}/200`} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {player.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-sm tracking-tight">{player.displayName}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                {player.wins} Wins • {player.rating} MMR
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-background/50 px-3 py-1 rounded-full border border-white/5">
             <Trophy className={cn(
               "w-3 h-3",
               idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-primary"
             )} />
             <span className="text-xs font-bold">{player.rating}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};
