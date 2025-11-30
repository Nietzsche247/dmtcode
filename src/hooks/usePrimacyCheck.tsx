import { useState, useEffect } from 'react';
import { pipeline } from '@huggingface/transformers';

interface PrimacyCheckResult {
  isContaminated: boolean;
  confidence: number;
  isLoading: boolean;
}

const CONTAMINATION_PHRASES = [
  'matrix rain',
  'digital rain',
  'code rain',
  'katakana',
  'japanese characters falling',
  'discovery trailer',
  'danny goler',
  'goler protocol',
  'chase hughes'
];

export const usePrimacyCheck = (text: string, primingExposure: string) => {
  const [result, setResult] = useState<PrimacyCheckResult>({
    isContaminated: false,
    confidence: 0,
    isLoading: false
  });

  useEffect(() => {
    // Only check if user claimed no prior exposure
    if (primingExposure !== 'priming_none' || !text || text.trim().length < 10) {
      setResult({ isContaminated: false, confidence: 0, isLoading: false });
      return;
    }

    let cancelled = false;

    const checkText = async () => {
      setResult(prev => ({ ...prev, isLoading: true }));

      try {
        // Simple keyword matching for performance (zero-shot can be added later)
        const lowerText = text.toLowerCase();
        let matchedPhrases: string[] = [];

        for (const phrase of CONTAMINATION_PHRASES) {
          if (lowerText.includes(phrase.toLowerCase())) {
            matchedPhrases.push(phrase);
          }
        }

        if (cancelled) return;

        if (matchedPhrases.length > 0) {
          setResult({
            isContaminated: true,
            confidence: Math.min(matchedPhrases.length * 0.3, 0.9),
            isLoading: false
          });
        } else {
          setResult({
            isContaminated: false,
            confidence: 0,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Primacy check error:', error);
        if (!cancelled) {
          setResult({ isContaminated: false, confidence: 0, isLoading: false });
        }
      }
    };

    // Debounce the check
    const timer = setTimeout(checkText, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, primingExposure]);

  return result;
};
