
export interface Verdict {
  catPercentage: number;
  dogPercentage: number;
  reasoning: string;
  solution: string;
}

export interface CaseRound {
  roundNumber: number;
  catArg: string;
  dogArg: string;
  verdict: Verdict;
}

export interface CharacterImages {
  judge: string | null;
  catDebater: string | null;
  dogDebater: string | null;
}

export enum CharacterType {
  JUDGE = 'JUDGE',
  CAT_DEBATER = 'CAT_DEBATER',
  DOG_DEBATER = 'DOG_DEBATER',
}

export const CharacterPrompts = {
  [CharacterType.JUDGE]: `Cute chibi-style anthropomorphic orange tabby cat judge with soft detailed shading and gentle fur texture. Large head, big glossy round eyes, warm friendly expression. Wearing a traditional judge’s robe and white curled wig, holding a wooden gavel and a small book. Pastel colors, smooth clean line art, soft lighting, adorable cartoon illustration style. Circular avatar frame with a simple courtroom background. Not flat, not minimalist, not vector-art, not icon-style, not geometric.`,
  
  [CharacterType.CAT_DEBATER]: `Cute chibi-style anthropomorphic British Shorthair cat debater with plush dense fur and soft detailed shading. Round head, big glossy eyes, chubby cheeks, calm confident expression. Wearing debate attire or a neat suit, holding a microphone or debate notes. Pastel colors, smooth clean line art, soft lighting, cute cartoon illustration style. Circular avatar frame with a simple debate podium background. Not flat, not minimalist, not vector-art, not icon-style, not geometric.`,
  
  // Updated to Corgi (Corki)
  [CharacterType.DOG_DEBATER]: `Cute chibi-style anthropomorphic Corgi dog debater with fluffy white and orange-brown fur and soft detailed shading. Large pointed ears, big glossy eyes, happy confident expression. Wearing debate attire or a neat suit, holding a microphone or debate notes. Pastel colors, smooth clean line art, soft lighting, cute cartoon illustration style. Circular avatar frame with a simple debate podium background. Not flat, not minimalist, not vector-art, not icon-style, not geometric.`
};