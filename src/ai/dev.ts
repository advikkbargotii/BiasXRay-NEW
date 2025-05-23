import { config } from 'dotenv';
config();

import '@/ai/flows/bias-rewriting.ts';
import '@/ai/flows/batch-bias-analysis.ts';
import '@/ai/flows/bias-detection.ts';