
"use client";

import type { DetectBiasInTextOutput, BiasDetectionResult } from '@/ai/flows/bias-detection';
import type { SuggestUnbiasedRewritesOutput } from '@/ai/flows/bias-rewriting';
import { detectBiasInText } from '@/ai/flows/bias-detection';
import { suggestUnbiasedRewrites } from '@/ai/flows/bias-rewriting';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
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
    try {
      const result = await detectBiasInText({ text: values.text });
      setDetectionResults(result);
      if (!result.biasDetections || result.biasDetections.length === 0) {
        toast({
          title: "No Bias Detected",
          description: "The provided text appears to be free of common biases.",
          variant: "default",
          action: <CheckCircle className="text-green-500" />,
        });
      }
    } catch (error) {
      console.error("Bias detection failed:", error);
      toast({
        title: "Error",
        description: "Failed to analyze text for bias. Please try again.",
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
    try {
      const result = await suggestUnbiasedRewrites({ biasedText: phrase, biasType: biasType });
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

  const textSegments = detectionResults ? segmentText(form.getValues("text"), detectionResults.biasDetections) : [];
  
  const getBiasSeverityColor = (score: number) => {
    if (score > 0.75) return 'bg-red-200 dark:bg-red-700 hover:bg-red-300 dark:hover:bg-red-600';
    if (score > 0.5) return 'bg-yellow-200 dark:bg-yellow-700 hover:bg-yellow-300 dark:hover:bg-yellow-600';
    return 'bg-blue-200 dark:bg-blue-700 hover:bg-blue-300 dark:hover:bg-blue-600';
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Analyze Text for Bias</CardTitle>
          <CardDescription>
            Enter your text below to detect potential biases. BiasGuard will highlight problematic phrases and offer suggestions for more inclusive language.
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
                    <FormLabel htmlFor="text-input" className="text-lg">Your Text</FormLabel>
                    <FormControl>
                      <Textarea
                        id="text-input"
                        placeholder="Paste or type your text here... e.g., The chairman asked his secretary to take notes."
                        className="min-h-[150px] text-base resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingDetection} size="lg" className="w-full sm:w-auto">
                {isLoadingDetection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Detect Bias
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Analysis Results</CardTitle>
            {detectionResults.overallBiasScore !== undefined && (
                <div className="mt-2">
                  <div className='flex justify-between items-center mb-1'>
                    <span className="text-sm font-medium text-foreground">Overall Bias Score:</span>
                    <span className={`text-sm font-bold ${detectionResults.overallBiasScore > 0.5 ? 'text-destructive' : 'text-green-600'}`}>
                        {(detectionResults.overallBiasScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={detectionResults.overallBiasScore * 100} className="w-full h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {detectionResults.overallBiasScore > 0.7 ? "High likelihood of bias." : detectionResults.overallBiasScore > 0.3 ? "Moderate likelihood of bias." : "Low likelihood of bias."}
                  </p>
                </div>
            )}
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Interactive Text:</h3>
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
                          <h4 className="font-semibold text-foreground">Bias Details</h4>
                          <p>
                            <strong className="text-muted-foreground">Type:</strong> {segment.biasInfo.biasType}
                          </p>
                          <p>
                            <strong className="text-muted-foreground">Confidence:</strong> {(segment.biasInfo.confidenceScore * 100).toFixed(0)}%
                          </p>
                          <p>
                            <strong className="text-muted-foreground">Original Phrase:</strong> "{segment.biasInfo.biasedPhrase}"
                          </p>
                          <p>
                            <strong className="text-muted-foreground">Initial Suggestion:</strong> "{segment.biasInfo.suggestedRewrite}"
                          </p>
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
                    <span key={index}>{segment.text}</span>
                  )
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No text to display or no biases found to highlight.</p>
            )}
          </CardContent>

          {isLoadingRewrite && (
            <CardFooter className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Generating enhanced rewrite...</p>
            </CardFooter>
          )}

          {currentRewriteData && activeRewriteRequest && (
            <CardFooter className="mt-4">
              <Card className="w-full bg-secondary/50 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-accent" />
                    Enhanced Rewrite Suggestion
                  </CardTitle>
                  <CardDescription>For the phrase: "{activeRewriteRequest.phrase}" (Bias Type: {activeRewriteRequest.biasType})</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground">Rewritten Text:</h4>
                    <p className="p-2 border rounded-md bg-background text-green-700 dark:text-green-400 font-medium">
                      {currentRewriteData.rewrittenText}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Explanation:</h4>
                    <p className="text-sm text-muted-foreground">{currentRewriteData.explanation}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Confidence:</h4>
                    <p className="text-sm text-muted-foreground">{(currentRewriteData.confidenceScore * 100).toFixed(0)}% certain this rewrite is unbiased.</p>
                  </div>
                </CardContent>
              </Card>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
