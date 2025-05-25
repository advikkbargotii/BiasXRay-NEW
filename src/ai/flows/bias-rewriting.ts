// This file contains a Genkit flow for suggesting unbiased rewrites of text.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview Suggests unbiased and improved rewordings for text, capable of rewriting specific phrases or entire documents.
 *
 * - suggestUnbiasedRewrites - A function that handles the text rewriting process.
 * - SuggestUnbiasedRewritesInput - The input type for the suggestUnbiasedRewrites function.
 * - SuggestUnbiasedRewritesOutput - The return type for the suggestUnbiasedRewrites function.
 */

const SuggestUnbiasedRewritesInputSchema = z.object({
  textToRewrite: z
    .string()
    .describe('The text to be rewritten. This can be a specific phrase or the entire original document.'),
  isFullTextRewrite: z.boolean().optional().describe('Set to true if rewriting the entire document, false or undefined for a specific phrase.'),
  biasType: z // Retain for specific phrase rewrites, make optional
    .string()
    .optional()
    .describe('For specific phrase rewrites: the type of bias present (e.g., gender, racial). For full text: can be omitted or provide general context.'),
  detectedIssuesSummary: z // New field for full text rewrite context
    .string()
    .optional()
    .describe('For full text rewrites: a summary of detected biases, hallucinations, or skews to guide the rewrite.'),
});
export type SuggestUnbiasedRewritesInput = z.infer<
  typeof SuggestUnbiasedRewritesInputSchema
>;

const SuggestUnbiasedRewritesOutputSchema = z.object({
  rewrittenText: z
    .string()
    .describe('The rewritten text with reduced or removed bias/issues.'),
  explanation: z
    .string()
    .describe('Explanation of the changes made and why they improve the text.'),
  confidenceScore: z
    .number()
    .describe('A score indicating the confidence that the rewritten text is improved.'),
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
  prompt: `You are an AI assistant specialized in rewriting text to remove biases, inaccuracies, and ideological skew, making it more neutral, fair, and balanced.

{{#if isFullTextRewrite}}
You are tasked with rewriting the ENTIRE original text provided below.
Original Text:
{{{textToRewrite}}}

{{#if detectedIssuesSummary}}
Summary of Detected Issues to address:
{{{detectedIssuesSummary}}}
{{else}}
No specific summary of issues was provided. Please analyze the text yourself for common biases (e.g., gender, racial, ableist), potential factual inaccuracies (hallucinations), and strong ideological leanings, then rewrite it comprehensively.
{{/if}}

Your goal is to produce a version of the Original Text that is significantly improved in terms of neutrality, accuracy, and fairness.

{{else}}
You are tasked with rewriting a SPECIFIC PHRASE.
Original Phrase: {{{textToRewrite}}}
{{#if biasType}}
Identified Issue/Bias Type: {{{biasType}}}
{{/if}}
Rewrite this phrase to remove the specified issue or to make it more neutral and unbiased.
{{/if}}

Regardless of whether it's a full text or a phrase, provide:
1.  rewrittenText: The rewritten version.
2.  explanation: An explanation of the changes made and why they improve the text.
3.  confidenceScore: A score (0-1) indicating your confidence that the rewritten text is improved.

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
