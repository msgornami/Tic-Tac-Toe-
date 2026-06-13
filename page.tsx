
"use client";

import React, { useState, useEffect } from 'react';
import { useTelegram } from '@/hooks/use-telegram';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, serverTimestamp, setDoc, getDoc, collection, query, where, orderBy, limit, addDoc } from 'firebase/firestore';
import { BoltGridBoard } from '@/components/game/BoltGridBoard';
import { GameStatus } from '@/components/game/GameStatus';
import { PostMatchAnalysis } from '@/components/game/PostMatchAnalysis';
import { LeaderboardList } from '@/components/leaderboard/LeaderboardList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, User, Gamepad2, History, Share2, Plus, LogIn, ChevronLeft } from 'lucide-react';
import { checkWinner } from '@/lib/game-logic';
import { cn } from '@/lib/utils';

export default function Home() {
  const { user: tgUser, tg } = useTelegram();
  const [user, setUser] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('play');
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        await signInAnonymously(auth);
        return;
      }
      
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);
      
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: fbUser.uid,
          displayName: tgUser?.first_name || 'Anonymous',
          username: tgUser?.username || 'player',
          wins: 0, losses: 0, draws: 0, rating: 1000,
          createdAt: serverTimestamp(),
        });
      }
      
      onSnapshot(userRef, (doc) => setUser(doc.data()));
      setLoading(false);
    });
    return unsub;
  }, [tgUser]);

  const startMatchmaking = async () => {
    setIsMatchmaking(true);
    // Find waiting match
    const q = query(collection(db, 'matches'), where('status', '==', 'waiting'), orderBy('createdAt', 'asc'), limit(1));
    const unsubscribe = onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        const matchData = snap.docs[0];
        if (matchData.data().playerXId === user.uid) return;
        
        await updateDoc(doc(db, 'matches', matchData.id), {
          playerOId: user.uid,
          playerOName: user.displayName,
          status: 'playing',
          updatedAt: serverTimestamp(),
        });
        setMatch({ id: matchData.id, ...matchData.data() });
        setIsMatchmaking(false);
        unsubscribe();
      } else {
        // Create new match if none waiting
        const newMatch = await addDoc(collection(db, 'matches'), {
          playerXId: user.uid,
          playerXName: user.displayName,
          playerOId: '',
          playerOName: '',
          board: Array(9).fill(null),
          turn: 'X',
          status: 'waiting',
          winnerId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          moves: [],
        });
        
        const watchSub = onSnapshot(doc(db, 'matches', newMatch.id), (docSnap) => {
          const data = docSnap.data();
          if (data?.status === 'playing') {
             setMatch({ id: docSnap.id, ...data });
             setIsMatchmaking(false);
             watchSub();
          }
        });
      }
    });
  };

  const createRoom = async () => {
    const newMatch = await addDoc(collection(db, 'matches'), {
      playerXId: user.uid,
      playerXName: user.displayName,
      playerOId: '',
      playerOName: '',
      board: Array(9).fill(null),
      turn: 'X',
      status: 'private',
      winnerId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      moves: [],
    });
    
    // In Telegram, we can share this link
    const link = `https://t.me/BoltGridBot/play?startapp=${newMatch.id}`;
    if (tg) {
      tg.switchInlineQuery(link, ['users', 'groups']);
    } else {
      alert(`Room Link: ${link}`);
    }

    onSnapshot(doc(db, 'matches', newMatch.id), (docSnap) => {
      setMatch({ id: docSnap.id, ...docSnap.data() });
    });
  };

  useEffect(() => {
    if (match?.id) {
      const unsub = onSnapshot(doc(db, 'matches', match.id), (docSnap) => {
        if (docSnap.exists()) {
          setMatch({ id: docSnap.id, ...docSnap.data() });
        }
      });
      return unsub;
    }
  }, [match?.id]);

  const handleMove = async (index: number) => {
    if (!match || match.status !== 'playing' || match.board[index] || match.turn !== (match.playerXId === user.uid ? 'X' : 'O')) return;
    
    const newBoard = [...match.board];
    const mySymbol = match.playerXId === user.uid ? 'X' : 'O';
    newBoard[index] = mySymbol;
    
    const result = checkWinner(newBoard);
    const updates: any = {
      board: newBoard,
      turn: mySymbol === 'X' ? 'O' : 'X',
      updatedAt: serverTimestamp(),
      moves: [...match.moves, { player: mySymbol, position: index, timestamp: Date.now() }]
    };

    if (result) {
      updates.status = 'finished';
      updates.winnerId = result === 'draw' ? 'draw' : (result === 'X' ? match.playerXId : match.playerOId);
      
      // Update Stats
      const myRef = doc(db, 'users', user.uid);
      const oppRef = doc(db, 'users', mySymbol === 'X' ? match.playerOId : match.playerXId);
      
      if (result === 'draw') {
        await updateDoc(myRef, { draws: (user.draws || 0) + 1, rating: (user.rating || 1000) + 5 });
      } else if (result === mySymbol) {
        await updateDoc(myRef, { wins: (user.wins || 0) + 1, rating: (user.rating || 1000) + 25 });
      } else {
        await updateDoc(myRef, { losses: (user.losses || 0) + 1, rating: Math.max(0, (user.rating || 1000) - 15) });
      }
    }

    await updateDoc(doc(db, 'matches', match.id), updates);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <h1 className="font-headline text-2xl font-bold tracking-tighter text-primary neon-text">BOLTGRID</h1>
    </div>
  );

  if (match) {
    const isX = match.playerXId === user.uid;
    const mySymbol = isX ? 'X' : 'O';
    const canMove = match.status === 'playing' && match.turn === mySymbol;
    const winResult = checkWinner(match.board);

    return (
      <main className="flex flex-col min-h-screen p-4 gap-6 animate-in fade-in duration-500">
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setMatch(null)}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <h2 className="font-headline text-lg font-bold tracking-tighter">BOLTGRID MATCH</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">ID: {match.id.slice(0, 8)}</p>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <GameStatus 
            playerXName={match.playerXName} 
            playerOName={match.playerOName} 
            turn={match.turn} 
            myRole={mySymbol}
            status={match.status}
          />
          
          <BoltGridBoard 
            board={match.board} 
            onMove={handleMove} 
            disabled={!canMove}
            winningIndices={null} // Logic for highlight could be added
          />

          {match.status === 'finished' && (
            <div className="w-full max-w-sm space-y-4 animate-in slide-in-from-bottom-8">
               <div className="text-center space-y-2">
                 <h3 className="font-headline text-3xl font-bold text-primary neon-text">
                   {match.winnerId === 'draw' ? 'DRAW!' : (match.winnerId === user.uid ? 'VICTORY!' : 'DEFEAT')}
                 </h3>
                 <p className="text-sm text-muted-foreground">Match concluded. Review performance below.</p>
               </div>
               <PostMatchAnalysis matchData={match} />
               <Button variant="outline" className="w-full" onClick={() => setMatch(null)}>
                 Return to Menu
               </Button>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 overflow-hidden">
      <header className="p-6 pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold tracking-tighter text-primary neon-text">BOLTGRID</h1>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold font-headline">{user.rating} MMR</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.wins}W - {user.losses}L</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Welcome back, {user.displayName}</p>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4">
        <Tabs defaultValue="play" className="w-full" onValueChange={setActiveTab}>
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-white/5 px-6 py-2 z-50">
            <TabsList className="w-full h-14 bg-transparent gap-2">
              <TabsTrigger value="play" className="flex-1 flex-col gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none">
                <Gamepad2 className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Play</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1 flex-col gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none">
                <Trophy className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Elite</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-1 flex-col gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none">
                <User className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Career</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="play" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] shadow-2xl neon-border">
              <img 
                src="https://picsum.photos/seed/boltgrid-hero/800/600" 
                alt="BoltGrid" 
                className="object-cover w-full h-full brightness-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="font-headline text-xl font-bold tracking-tighter">ARENA OPEN</h2>
                <p className="text-xs text-muted-foreground">Competitive matchmaking is live.</p>
              </div>
            </div>

            <div className="grid gap-3">
              <Button 
                onClick={startMatchmaking} 
                disabled={isMatchmaking}
                className="h-16 text-lg font-headline font-bold bg-primary hover:bg-primary/90 rounded-2xl"
              >
                {isMatchmaking ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Finding Player...
                  </div>
                ) : 'Quick Match'}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" className="h-14 font-headline font-bold gap-2 rounded-xl" onClick={createRoom}>
                  <Plus className="w-5 h-5" /> Private
                </Button>
                <Button variant="outline" className="h-14 font-headline font-bold gap-2 rounded-xl" onClick={() => alert('Enter Room ID')}>
                  <LogIn className="w-5 h-5" /> Join
                </Button>
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4" /> Recent Glory
              </h3>
              <div className="space-y-2 opacity-50">
                <p className="text-sm italic text-center py-4">Play matches to see your career history.</p>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center py-4">
               <h2 className="font-headline text-2xl font-bold tracking-tighter uppercase">Elite Hall of Fame</h2>
               <p className="text-xs text-muted-foreground">Top 100 players globally</p>
            </div>
            <LeaderboardList />
          </TabsContent>

          <TabsContent value="profile" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <Card className="bg-card/50 border-white/5 rounded-2xl overflow-hidden">
               <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20" />
               <CardContent className="relative -mt-12 flex flex-col items-center gap-4 text-center">
                 <div className="w-24 h-24 rounded-full border-4 border-background bg-card shadow-2xl overflow-hidden">
                    <img src={`https://picsum.photos/seed/${user.uid}/200`} alt="Profile" />
                 </div>
                 <div className="space-y-1">
                   <h2 className="font-headline text-2xl font-bold tracking-tighter">{user.displayName}</h2>
                   <p className="text-xs text-muted-foreground">@{user.username}</p>
                 </div>
                 
                 <div className="grid grid-cols-3 w-full divide-x divide-white/5 py-4 border-y border-white/5">
                   <div className="flex flex-col">
                     <span className="text-xl font-headline font-bold">{user.wins}</span>
                     <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Wins</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xl font-headline font-bold">{user.losses}</span>
                     <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Losses</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xl font-headline font-bold">{user.rating}</span>
                     <span className="text-[10px] text-muted-foreground uppercase tracking-widest">MMR</span>
                   </div>
                 </div>

                 <Button className="w-full gap-2 bg-secondary" onClick={() => tg?.openTelegramLink(`https://t.me/share/url?url=https://t.me/BoltGridBot&text=Beat me in BoltGrid!`)}>
                   <Share2 className="w-4 h-4" /> Share Profile
                 </Button>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
