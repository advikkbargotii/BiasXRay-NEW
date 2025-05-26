
"use client";

import type { DetectBiasInTextOutput, BiasDetectionResult } from '@/ai/flows/bias-detection';
import type { SuggestUnbiasedRewritesOutput } from '@/ai/flows/bias-rewriting';
import { detectBiasInText } from '@/ai/flows/bias-detection';
import { suggestUnbiasedRewrites } from '@/ai/flows/bias-rewriting';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle, Loader2, Sparkles, Brain, Scale } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


const formSchema = z.object({
  text: z.string().min(10, { message: "Text must be at least 10 characters." }).max(5000, { message: "Text must not exceed 5000 characters." }),
});

type TextSegment = {
  text: string;
  isBiased: boolean;
  biasInfo?: BiasDetectionResult;
};

function segmentText(originalText: string, detections: BiasDetectionResult[]): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  const sortedDetections = detections
    .map(detection => {
      const phrase = detection.biasedPhrase;
      let searchIndex = 0;
      const occurrences = [];
      while(searchIndex < originalText.length) {
        const startIndex = originalText.indexOf(phrase, searchIndex);
        if (startIndex === -1) break;
        occurrences.push({ ...detection, startIndex, endIndex: startIndex + phrase.length });
        searchIndex = startIndex + phrase.length;
      }
      return occurrences;
    })
    .flat()
    .filter(d => d.startIndex !== -1)
    .sort((a, b) => a.startIndex - b.startIndex);
  
  const uniqueDetections: (BiasDetectionResult & { startIndex: number; endIndex: number })[] = [];
  let lastEndIndex = -1;
  for (const det of sortedDetections) {
    if (det.startIndex >= lastEndIndex) {
      uniqueDetections.push(det);
      lastEndIndex = det.endIndex;
    }
  }

  for (const detection of uniqueDetections) {
    if (detection.startIndex > currentIndex) {
      segments.push({ text: originalText.substring(currentIndex, detection.startIndex), isBiased: false });
    }
    segments.push({
      text: detection.biasedPhrase,
      isBiased: true,
      biasInfo: detection,
    });
    currentIndex = detection.startIndex + detection.biasedPhrase.length;
  }

  if (currentIndex < originalText.length) {
    segments.push({ text: originalText.substring(currentIndex), isBiased: false });
  }
  return segments;
}


export function BiasGuardTool() { 
  const [isLoadingDetection, setIsLoadingDetection] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectBiasInTextOutput | null>(null);
  
  const [isLoadingRewrite, setIsLoadingRewrite] = useState(false);
  const [currentRewriteData, setCurrentRewriteData] = useState<SuggestUnbiasedRewritesOutput | null>(null);
  const [activeRewriteRequest, setActiveRewriteRequest] = useState<{ phrase: string, biasType: string} | null>(null);

  const [isLoadingFullRewrite, setIsLoadingFullRewrite] = useState(false);
  const [fullRewriteData, setFullRewriteData] = useState<SuggestUnbiasedRewritesOutput | null>(null);
  
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const handleDetectBias = async (values: z.infer<typeof formSchema>) => {
    setIsLoadingDetection(true);
    setDetectionResults(null);
    setCurrentRewriteData(null);
    setActiveRewriteRequest(null);
    setFullRewriteData(null);
    try {
      const result = await detectBiasInText({ text: values.text });
      setDetectionResults(result);
      if (!result.biasDetections || result.biasDetections.length === 0) {
        toast({
          title: "Analysis Complete",
          description: "The provided text was analyzed. Check scores for details.",
          variant: "default",
          action: <CheckCircle className="text-green-500" />,
        });
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Error",
        description: "Failed to analyze text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetection(false);
    }
  };

  const handleRequestRewrite = useCallback(async (phrase: string, biasType: string) => {
    setIsLoadingRewrite(true);
    setCurrentRewriteData(null);
    setActiveRewriteRequest({phrase, biasType});
    setFullRewriteData(null); // Clear full rewrite if individual is requested
    try {
      const result = await suggestUnbiasedRewrites({ 
        textToRewrite: phrase, 
        biasType: biasType,
        isFullTextRewrite: false,
      });
      setCurrentRewriteData(result);
    } catch (error) {
      console.error("Bias rewriting failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate rewrite suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRewrite(false);
    }
  }, [toast]);

  const handleRequestFullRewrite = async () => {
    if (!detectionResults || !form.getValues("text")) {
      toast({
        title: "Error",
        description: "Original text or analysis results are missing.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingFullRewrite(true);
    setFullRewriteData(null);
    setCurrentRewriteData(null); // Clear individual rewrite if full is requested
    setActiveRewriteRequest(null);

    let summary = "";
    if (detectionResults.biasDetections.length > 0) {
      const types = Array.from(new Set(detectionResults.biasDetections.map(d => d.biasType))).join(', ');
      summary = `Detected phrase-specific issues include: ${types}. `;
    }
    summary += `Overall scores: Bias ${(detectionResults.overallBiasScore * 100).toFixed(0)}%, Hallucination ${(detectionResults.overallHallucinationScore * 100).toFixed(0)}%, Ideological Skew ${(detectionResults.overallIdeologicalSkewScore * 100).toFixed(0)}%.`;
    
    try {
      const result = await suggestUnbiasedRewrites({
        textToRewrite: form.getValues("text"),
        isFullTextRewrite: true,
        detectedIssuesSummary: summary,
      });
      setFullRewriteData(result);
    } catch (error) {
      console.error("Full text rewriting failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate full text rewrite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFullRewrite(false);
    }
  };


  const textSegments = detectionResults ? segmentText(form.getValues("text"), detectionResults.biasDetections) : [];
  
  const getBiasSeverityColor = (score: number) => {
    if (score > 0.75) return 'bg-red-200 dark:bg-red-700 hover:bg-red-300 dark:hover:bg-red-600';
    if (score > 0.5) return 'bg-yellow-200 dark:bg-yellow-700 hover:bg-yellow-300 dark:hover:bg-yellow-600';
    return 'bg-blue-200 dark:bg-blue-700 hover:bg-blue-300 dark:hover:bg-blue-600';
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-[30px] opacity-65 bg-neutral-800 text-foreground">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Analyze Text for Bias, Hallucination &amp; Skew</CardTitle>
           <CardDescription className="text-neutral-500">
            <p className="mb-3 text-neutral-500">
              Bias X-Ray is a tool designed to help you identify and understand potential biases,
              factual inaccuracies (hallucinations), and ideological skew within your text.
              Our goal is to promote fairer and more ethical communication.
            </p>
            <strong className="text-neutral-500">How to use:</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1 text-neutral-500">
              <li className="text-neutral-500">
                <strong className="text-neutral-500">Enter Text:</strong> Paste or type the text you want to analyze into the text area below.
              </li>
              <li className="text-neutral-500">
                <strong className="text-neutral-500">Analyze:</strong> Click the 'Analyze Text' button.
              </li>
              <li className="text-neutral-500">
                <strong className="text-neutral-500">Review Results:</strong>
                <ul className="list-disc list-inside ml-5 mt-1 space-y-0.5 text-neutral-500">
                  <li className="text-neutral-500">
                    <strong className="text-neutral-500">Overall Scores:</strong> Check the overall scores for bias, hallucination, and ideological skew displayed above the interactive text.
                  </li>
                  <li className="text-neutral-500">
                    <strong className="text-neutral-500">Interactive Text:</strong> Potentially biased phrases will be highlighted. Click on them to see details like bias type, confidence, and an initial rewrite suggestion.
                  </li>
                </ul>
              </li>
              <li className="text-neutral-500">
                <strong className="text-neutral-500">Get Enhanced Rewrite:</strong> For any highlighted phrase, click 'Get Enhanced Rewrite' in its popover. You can also request a rewrite for the entire text using the button below the interactive text area if issues are found.
              </li>
            </ol>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleDetectBias)} className="space-y-6">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="text-input" className="text-lg sr-only">Your Text</FormLabel>
                    <FormControl>
                      <Textarea
                        id="text-input"
                        placeholder="Paste or type your text here... e.g., The chairman asked his secretary to take notes."
                        className="min-h-[150px] text-base resize-y bg-neutral-200 text-black placeholder:text-neutral-500 rounded-2xl border-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-4 py-3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingDetection} size="lg" className="w-full sm:w-auto bg-[#8B0000] hover:bg-[#A52A2A] text-white rounded-xl">
                {isLoadingDetection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Text
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoadingDetection && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Analyzing text, please wait...</p>
        </div>
      )}

      {detectionResults && (
        <Card className="shadow-lg rounded-[30px] opacity-65 bg-neutral-800 text-foreground">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Analysis Results</CardTitle>
            <div className="space-y-3 mt-2">
              {detectionResults.overallBiasScore !== undefined && (
                  <div className="mt-2">
                    <div className='flex justify-between items-center mb-1'>
                      <span className="text-sm font-semibold text-neutral-400 flex items-center"><AlertTriangle className="mr-2 h-4 w-4 text-yellow-500"/>Overall Bias Score:</span>
                      <span className={`text-sm font-bold ${detectionResults.overallBiasScore > 0.5 ? 'text-destructive' : 'text-green-600'}`}>
                          {(detectionResults.overallBiasScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={detectionResults.overallBiasScore * 100} className="w-full h-2" />
                     <p className="text-sm text-neutral-400 mt-1">
                      {detectionResults.overallBiasScore > 0.7 ? "High likelihood of bias." : detectionResults.overallBiasScore > 0.3 ? "Moderate likelihood of bias." : "Low likelihood of bias."}
                    </p>
                  </div>
              )}
               {detectionResults.overallHallucinationScore !== undefined && (
                  <div className="mt-2">
                    <div className='flex justify-between items-center mb-1'>
                      <span className="text-sm font-semibold text-neutral-400 flex items-center"><Brain className="mr-2 h-4 w-4 text-blue-500"/>Overall Hallucination Score:</span>
                      <span className={`text-sm font-bold ${detectionResults.overallHallucinationScore > 0.5 ? 'text-destructive' : 'text-green-600'}`}>
                          {(detectionResults.overallHallucinationScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={detectionResults.overallHallucinationScore * 100} className="w-full h-2" />
                    <p className="text-sm text-neutral-400 mt-1">
                      {detectionResults.overallHallucinationScore > 0.7 ? "High likelihood of hallucination." : detectionResults.overallHallucinationScore > 0.3 ? "Moderate likelihood of hallucination." : "Low likelihood of hallucination."}
                    </p>
                  </div>
              )}
              {detectionResults.overallIdeologicalSkewScore !== undefined && (
                  <div className="mt-2">
                    <div className='flex justify-between items-center mb-1'>
                      <span className="text-sm font-semibold text-neutral-400 flex items-center"><Scale className="mr-2 h-4 w-4 text-purple-500"/>Overall Ideological Skew Score:</span>
                      <span className={`text-sm font-bold ${detectionResults.overallIdeologicalSkewScore > 0.5 ? 'text-destructive' : 'text-green-600'}`}>
                          {(detectionResults.overallIdeologicalSkewScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={detectionResults.overallIdeologicalSkewScore * 100} className="w-full h-2" />
                    <p className="text-sm text-neutral-400 mt-1">
                      {detectionResults.overallIdeologicalSkewScore > 0.7 ? "Significant ideological skew detected." : detectionResults.overallIdeologicalSkewScore > 0.3 ? "Moderate ideological skew detected." : "Minimal ideological skew detected."}
                    </p>
                  </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2 mt-4 text-neutral-400">Interactive Text (Highlight specific biases):</h3>
            {textSegments.length > 0 ? (
              <div className="p-4 border rounded-md bg-background leading-relaxed text-base whitespace-pre-wrap">
                {textSegments.map((segment, index) =>
                  segment.isBiased && segment.biasInfo ? (
                    <Popover key={index}>
                      <PopoverTrigger asChild>
                        <span
                          className={cn(
                            "cursor-pointer rounded px-1 py-0.5 transition-all duration-150 ease-in-out",
                            getBiasSeverityColor(segment.biasInfo.confidenceScore),
                            "font-medium"
                          )}
                          aria-label={`Biased phrase: ${segment.text}. Type: ${segment.biasInfo.biasType}. Confidence: ${ (segment.biasInfo.confidenceScore * 100).toFixed(0)}%`}
                        >
                          {segment.text}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 shadow-xl">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-black">Bias Details</h4>
                          <p className="text-sm text-neutral-400">
                            <strong className="text-neutral-400">Type:</strong> {segment.biasInfo.biasType}
                          </p>
                          <p className="text-sm text-neutral-400">
                            <strong className="text-neutral-400">Confidence (Bias):</strong> {(segment.biasInfo.confidenceScore * 100).toFixed(0)}%
                          </p>
                          <p className="text-sm text-neutral-400">
                            <strong className="text-neutral-400">Original Phrase:</strong> "{segment.biasInfo.biasedPhrase}"
                          </p>
                          <p className="text-sm text-neutral-400">
                            <strong className="text-neutral-400">Initial Suggestion:</strong> "{segment.biasInfo.suggestedRewrite}"
                          </p>
                          {segment.biasInfo.hallucinationScore !== undefined && (
                            <p className="text-sm text-neutral-400">
                              <strong className="text-neutral-400">Hallucination Score (Phrase):</strong> {(segment.biasInfo.hallucinationScore * 100).toFixed(0)}%
                            </p>
                          )}
                          {segment.biasInfo.ideologicalSkewScore !== undefined && (
                            <p className="text-sm text-neutral-400">
                              <strong className="text-neutral-400">Ideological Skew Score (Phrase):</strong> {(segment.biasInfo.ideologicalSkewScore * 100).toFixed(0)}%
                            </p>
                          )}
                          <Separator />
                           <Button
                            onClick={() => handleRequestRewrite(segment.biasInfo!.biasedPhrase, segment.biasInfo!.biasType)}
                            disabled={isLoadingRewrite && activeRewriteRequest?.phrase === segment.biasInfo.biasedPhrase}
                            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                            size="sm"
                          >
                            {isLoadingRewrite && activeRewriteRequest?.phrase === segment.biasInfo.biasedPhrase ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Get Enhanced Rewrite
                              </>
                            )}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span key={index} className="text-neutral-400">{segment.text}</span>
                  )
                )}
              </div>
            ) : (
               detectionResults && detectionResults.biasDetections && detectionResults.biasDetections.length === 0 && (
                 <p className="text-sm text-neutral-400">No specific biased phrases found to highlight, but check overall scores above.</p>
               )
            )}
            { detectionResults && (!detectionResults.biasDetections || detectionResults.biasDetections.length === 0) && (!form.getValues("text") || form.getValues("text").trim() === "") && (
                 <p className="text-sm text-neutral-400">Enter text above and click "Analyze Text" to see results.</p>
            )}

            {detectionResults && (detectionResults.biasDetections.length > 0 || detectionResults.overallBiasScore > 0.3 || detectionResults.overallHallucinationScore > 0.3 || detectionResults.overallIdeologicalSkewScore > 0.3) && (
              <div className="mt-6">
                <Button
                  onClick={handleRequestFullRewrite}
                  disabled={isLoadingFullRewrite || isLoadingDetection || isLoadingRewrite}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                  size="lg"
                >
                  {isLoadingFullRewrite ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rewriting Entire Text...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get Enhanced Rewrite for Entire Text
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex-col items-stretch space-y-4">
            {isLoadingRewrite && !isLoadingFullRewrite && ( // Show only if not doing full rewrite
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Generating enhanced phrase rewrite...</p>
              </div>
            )}

            {currentRewriteData && activeRewriteRequest && !fullRewriteData && ( // Show only if no full rewrite data
              <Card className="w-full opacity-65 bg-neutral-800 text-foreground shadow-md rounded-[30px]">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-foreground">
                    <Sparkles className="mr-2 h-5 w-5 text-accent" />
                    Enhanced Rewrite Suggestion (Phrase)
                  </CardTitle>
                  <CardDescription className="text-neutral-400">For the phrase: "{activeRewriteRequest.phrase}" (Bias Type: {activeRewriteRequest.biasType})</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-400">Rewritten Text:</h4>
                    <p className="p-2 border rounded-md bg-background text-neutral-400 font-medium">
                      {currentRewriteData.rewrittenText}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-400">Explanation:</h4>
                    <p className="text-sm text-neutral-400">{currentRewriteData.explanation}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-400">Confidence:</h4>
                    <p className="text-sm text-neutral-400">{(currentRewriteData.confidenceScore * 100).toFixed(0)}% certain this rewrite is unbiased.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoadingFullRewrite && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Generating full text rewrite...</p>
              </div>
            )}
            
            {fullRewriteData && (
              <Card className="w-full opacity-65 bg-neutral-800 text-foreground shadow-md rounded-[30px] mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-foreground">
                    <Sparkles className="mr-2 h-5 w-5 text-accent" />
                    Enhanced Rewrite for Entire Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-400">Rewritten Full Text:</h4>
                    <p className="p-2 border rounded-md bg-background text-neutral-400 font-medium whitespace-pre-wrap">
                      {fullRewriteData.rewrittenText}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-400">Explanation:</h4>
                    <p className="text-sm text-neutral-400">{fullRewriteData.explanation}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-400">Confidence:</h4>
                    <p className="text-sm text-neutral-400">{(fullRewriteData.confidenceScore * 100).toFixed(0)}% certain this rewrite is improved.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
    

    

    

