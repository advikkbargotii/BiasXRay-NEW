// src/ai/flows/batch-bias-analysis.ts
'use server';

/**
 * @fileOverview Batch bias analysis flow for analyzing multiple documents for bias.
 *
 * - analyzeDocuments - Analyzes multiple documents for bias and returns the analysis results.
 * - BatchBiasAnalysisInput - The input type for the analyzeDocuments function.
 * - BatchBiasAnalysisOutput - The return type for the analyzeDocuments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentSchema = z.object({
  name: z.string().describe('The name of the document.'),
  content: z.string().describe('The content of the document.'),
});

const BatchBiasAnalysisInputSchema = z.object({
  documents: z.array(DocumentSchema).describe('An array of documents to analyze for bias.'),
});
export type BatchBiasAnalysisInput = z.infer<typeof BatchBiasAnalysisInputSchema>;

const BiasAnalysisResultSchema = z.object({
  documentName: z.string().describe('The name of the document that was analyzed.'),
  biasDetected: z.boolean().describe('Whether bias was detected in the document.'),
  biasType: z.string().optional().describe('The type of bias detected, if any.'),
  confidenceScore: z.number().optional().describe('A confidence score for the bias detection.'),
  explanation: z.string().optional().describe('An explanation of why bias was detected.'),
  rewrittenContent: z.string().optional().describe('A rewritten version of the content with reduced bias.'),
});

const BatchBiasAnalysisOutputSchema = z.object({
  results: z.array(BiasAnalysisResultSchema).describe('An array of bias analysis results for each document.'),
});
export type BatchBiasAnalysisOutput = z.infer<typeof BatchBiasAnalysisOutputSchema>;

export async function analyzeDocuments(input: BatchBiasAnalysisInput): Promise<BatchBiasAnalysisOutput> {
  return batchBiasAnalysisFlow(input);
}

const analyzeDocumentPrompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: DocumentSchema},
  output: {schema: BiasAnalysisResultSchema},
  prompt: `You are an AI assistant specializing in detecting and mitigating bias in text.

  Analyze the following document for any potential biases, including but not limited to gender bias, racial bias, classism, ableism, and political skew.

  Document Name: {{{name}}}
  Document Content: {{{content}}}

  Based on your analysis, determine if bias is present. If bias is detected, classify the type of bias, provide a confidence score (0-1), and explain why the bias was detected. Also, suggest a rewritten version of the content with reduced bias.

  If no bias is detected, indicate that no bias was found and omit the bias type, confidence score, explanation, and rewritten content.

  Respond in a structured format that clearly indicates whether bias was detected, the type of bias (if any), a confidence score, an explanation, and a rewritten version (if bias was detected).`,
});

const batchBiasAnalysisFlow = ai.defineFlow(
  {
    name: 'batchBiasAnalysisFlow',
    inputSchema: BatchBiasAnalysisInputSchema,
    outputSchema: BatchBiasAnalysisOutputSchema,
  },
  async input => {
    const analysisResults = await Promise.all(
      input.documents.map(async document => {
        try {
          const {output} = await analyzeDocumentPrompt(document);
          return {
            documentName: document.name,
            ...output,
          };
        } catch (error) {
          console.error(`Error analyzing document ${document.name}:`, error);
          return {
            documentName: document.name,
            biasDetected: false,
            explanation: `Analysis failed: ${String(error)}`,
          };
        }
      })
    );

    return {results: analysisResults};
  }
);
