'use server';
/**
 * @fileOverview A Genkit flow for analyzing Tic Tac Toe matches and providing tactical insights.
 *
 * - genAITacticPostMortem - A function that handles the AI-generated post-mortem analysis of a Tic Tac Toe match.
 * - GenAITacticPostMortemInput - The input type for the genAITacticPostMortem function.
 * - GenAITacticPostMortemOutput - The return type for the genAITacticPostMortem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema for the GenAI Tactic Post-Mortem flow
const GenAITacticPostMortemInputSchema = z.object({
  matchId: z.string().describe('Unique identifier for the Tic Tac Toe match.'),
  playerXId: z.string().describe('The ID of the player playing as "X".'),
  playerOId: z.string().describe('The ID of the player playing as "O".'),
  winnerId: z.string().nullable().describe('The ID of the winning player, or null if the match was a draw.'),
  moves: z.array(
    z.object({
      player: z.enum(['X', 'O']).describe('The player who made the move.'),
      position: z.number().int().min(0).max(8).describe('The 0-indexed position on the 3x3 board (0-8).'),
    })
  ).describe('An ordered list of all moves made in the match.'),
});
export type GenAITacticPostMortemInput = z.infer<typeof GenAITacticPostMortemInputSchema>;

// Output Schema for the GenAI Tactic Post-Mortem flow
const GenAITacticPostMortemOutputSchema = z.object({
  overallSummary: z.string().describe('A concise summary of the match, highlighting key outcomes and general performance.'),
  playerXAnalysis: z.object({
    insights: z.array(z.string()).describe('Specific observations and strengths/weaknesses for Player X.'),
    suggestions: z.array(z.string()).describe('Actionable advice for Player X to improve.'),
  }).describe('Detailed analysis for Player X.'),
  playerOAnalysis: z.object({
    insights: z.array(z.string()).describe('Specific observations and strengths/weaknesses for Player O.'),
    suggestions: z.array(z.string()).describe('Actionable advice for Player O to improve.'),
  }).describe('Detailed analysis for Player O.'),
  keyMoments: z.array(
    z.object({
      turn: z.number().int().describe('The turn number when this key moment occurred (1-indexed).'),
      description: z.string().describe('A description of the key moment, such as a missed win, a strong defense, or a critical blunder.'),
    })
  ).describe('An array of crucial moments identified in the game.'),
  generalTacticalAdvice: z.array(z.string()).describe('General strategic advice applicable to both players for future Tic Tac Toe games.'),
});
export type GenAITacticPostMortemOutput = z.infer<typeof GenAITacticPostMortemOutputSchema>;


// Define an auxiliary input schema for the prompt, which includes the formatted moves.
const TacticPostMortemPromptInputSchema = z.object({
  playerXId: z.string(),
  playerOId: z.string(),
  winnerId: z.string().nullable(),
  formattedMoves: z.string().describe('A string representing the ordered list of all moves made in the match.'),
});
type TacticPostMortemPromptInput = z.infer<typeof TacticPostMortemPromptInputSchema>;


const tacticPostMortemPrompt = ai.definePrompt({
  name: 'tacticPostMortemPrompt',
  input: {
    schema: TacticPostMortemPromptInputSchema,
  },
  output: {
    schema: GenAITacticPostMortemOutputSchema,
  },
  prompt: `You are an expert Tic Tac Toe tactical analyst. Your task is to provide a detailed post-mortem analysis of a completed Tic Tac Toe game. Analyze the moves, identify key moments, evaluate each player's performance, and offer personalized strategic insights and suggestions for improvement.

The game was between Player X (ID: {{{playerXId}}}) and Player O (ID: {{{playerOId}}}).
The winner was: {{{winnerId}}}. If winnerId is null, the match was a draw.

Here is the sequence of moves (0-indexed positions on a 3x3 board):
{{{formattedMoves}}}

Based on this game, generate a structured analysis following the provided JSON schema. Ensure your analysis is insightful, constructive, and directly addresses the tactical decisions made during the game.`,
});

// The flow definition
const genAITacticPostMortemFlow = ai.defineFlow(
  {
    name: 'genAITacticPostMortemFlow',
    inputSchema: GenAITacticPostMortemInputSchema,
    outputSchema: GenAITacticPostMortemOutputSchema,
  },
  async (input) => {
    // Pre-format the moves into a human-readable string for the prompt
    const formattedMoves = input.moves.map((move, index) =>
      `Turn ${index + 1}: Player ${move.player} placed at position ${move.position}.`
    ).join('\n');

    const promptInput: TacticPostMortemPromptInput = {
      playerXId: input.playerXId,
      playerOId: input.playerOId,
      winnerId: input.winnerId,
      formattedMoves: formattedMoves,
    };

    const {output} = await tacticPostMortemPrompt(promptInput);
    return output!;
  }
);

// Exported wrapper function
export async function genAITacticPostMortem(
  input: GenAITacticPostMortemInput
):
Please<GenAITacticPostMortemOutput> {
  return genAITacticPostMortemFlow(input);
}
