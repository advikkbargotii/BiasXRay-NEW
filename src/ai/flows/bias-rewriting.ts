// This file contains a Genkit flow for suggesting unbiased rewrites of text.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview Suggests unbiased rewordings using LLMs fine-tuned for inclusive and neutral language.
 *
 * - suggestUnbiasedRewrites - A function that handles the unbiased rewriting process.
 * - SuggestUnbiasedRewritesInput - The input type for the suggestUnbiasedRewrites function.
 * - SuggestUnbiasedRewritesOutput - The return type for the suggestUnbiasedRewrites function.
 */

const SuggestUnbiasedRewritesInputSchema = z.object({
  biasedText: z
    .string()
    .describe('The text to be rewritten to remove bias.'),
  biasType: z
    .string()
    .describe('The type of bias present in the text (e.g., gender, racial, ableist).'),
});
export type SuggestUnbiasedRewritesInput = z.infer<
  typeof SuggestUnbiasedRewritesInputSchema
>;

const SuggestUnbiasedRewritesOutputSchema = z.object({
  rewrittenText: z
    .string()
    .describe('The rewritten text with reduced or removed bias.'),
  explanation: z
    .string()
    .describe('Explanation of the changes made and why they reduce bias.'),
  confidenceScore: z
    .number()
    .describe('A score indicating the confidence that the rewritten text is unbiased.'),
});
export type SuggestUnbiasedRewritesOutput = z.infer<
  typeof SuggestUnbiasedRewritesOutputSchema
>;

export async function suggestUnbiasedRewrites(
  input: SuggestUnbiasedRewritesInput
): Promise<SuggestUnbiasedRewritesOutput> {
  return suggestUnbiasedRewritesFlow(input);
}

const suggestUnbiasedRewritesPrompt = ai.definePrompt({
  name: 'suggestUnbiasedRewritesPrompt',
  input: {schema: SuggestUnbiasedRewritesInputSchema},
  output: {schema: SuggestUnbiasedRewritesOutputSchema},
  prompt: `You are an AI assistant specialized in rewriting text to remove biases.

  Input Text: {{{biasedText}}}
  Bias Type: {{{biasType}}}

  Rewrite the input text to remove the specified bias. Provide an explanation of the changes made and why they reduce bias.  Also, provide a confidence score (0-1) indicating the confidence that the rewritten text is unbiased.

  Output in the following JSON format:
  {
    "rewrittenText": "Rewritten text here",
    "explanation": "Explanation of changes",
    "confidenceScore": 0.95
  }`,
});

const suggestUnbiasedRewritesFlow = ai.defineFlow(
  {
    name: 'suggestUnbiasedRewritesFlow',
    inputSchema: SuggestUnbiasedRewritesInputSchema,
    outputSchema: SuggestUnbiasedRewritesOutputSchema,
  },
  async input => {
    const {output} = await suggestUnbiasedRewritesPrompt(input);
    return output!;
  }
);
