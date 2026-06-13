
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Loader2, ArrowRightCircle } from 'lucide-react';
import { genAITacticPostMortem, GenAITacticPostMortemOutput } from '@/ai/flows/gen-ai-tactic-post-mortem-flow';

interface PostMatchAnalysisProps {
  matchData: any;
}

export const PostMatchAnalysis: React.FC<PostMatchAnalysisProps> = ({ matchData }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GenAITacticPostMortemOutput | null>(null);

  const getAnalysis = async () => {
    setLoading(true);
    try {
      const result = await genAITacticPostMortem({
        matchId: matchData.id,
        playerXId: matchData.playerXId,
        playerOId: matchData.playerOId,
        winnerId: matchData.winnerId,
        moves: matchData.moves,
      });
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <Button 
        onClick={getAnalysis}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Analyze Match Tactics
      </Button>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4 bg-card/50 rounded-xl border border-primary/20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Consulting the Grandmaster AI...</p>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-md overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg font-headline">
          <Sparkles className="w-5 h-5 text-primary" />
          Tactical Post-Mortem
        </CardTitle>
        <CardDescription className="text-xs">Personalized strategic breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Overview</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.overallSummary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="text-xs font-bold uppercase text-primary">Key Moments</h4>
            {analysis.keyMoments.slice(0, 3).map((moment, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 rounded mt-0.5">T{moment.turn}</span>
                <p className="text-xs text-muted-foreground">{moment.description}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
            <h4 className="text-xs font-bold uppercase text-secondary">Strategic Advice</h4>
            {analysis.generalTacticalAdvice.slice(0, 2).map((advice, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <ArrowRightCircle className="w-3 h-3 text-secondary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground italic">{advice}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
