import { Injectable, Logger } from '@nestjs/common';

export interface ContentScore {
  overall: number;
  readability: number;
  sentiment: number;
  length: number;
  structure: number;
  factors: {
    readability?: number;
    sentiment?: number;
    length?: number;
    structure?: number;
  };
}

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);

  computeFleschKincaid(text: string): number {
    const sentences = Math.max(1, (text.match(/[.!?]/g) || []).length);
    const words = Math.max(1, (text.trim().split(/\s+/).length));
    const syllables = Math.max(1, this.countSyllables(text));
    // Flesch-Kincaid Reading Ease (approximate)
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    let count = 0;
    for (const w of words) {
      const m = w.replace(/e$/,'').match(/[aeiouy]{1,2}/g);
      count += m ? m.length : 1;
    }
    return count || 1;
  }

  computeSimilarity(a: string, b: string): number {
    // Jaccard over shingles (3-grams)
    const shingles = (s: string) => {
      const clean = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const arr: string[] = [];
      for (let i = 0; i < Math.max(0, clean.length - 2); i++) arr.push(clean.slice(i, i + 3));
      return new Set(arr);
    };
    const A = shingles(a), B = shingles(b);
    const inter = new Set([...A].filter(x => B.has(x)));
    const union = new Set([...A, ...B]);
    return union.size === 0 ? 0 : inter.size / union.size;
  }

  containsBlockedTerms(text: string, blocklist: string[]): string[] {
    const lower = text.toLowerCase();
    const hits = new Set<string>();
    for (const term of blocklist || []) {
      const t = (term || '').toLowerCase().trim();
      if (!t) continue;
      if (lower.includes(t)) hits.add(term);
    }
    return [...hits];
  }

  computeSentimentScore(text: string): number {
    // Basic sentiment analysis using keyword matching
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'brilliant',
      'outstanding', 'superb', 'marvelous', 'perfect', 'ideal', 'best', 'top', 'premium',
      'success', 'achieve', 'win', 'victory', 'triumph', 'breakthrough', 'innovation',
      'love', 'enjoy', 'appreciate', 'value', 'benefit', 'advantage', 'opportunity'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor', 'worst', 'fail',
      'failure', 'problem', 'issue', 'error', 'mistake', 'wrong', 'incorrect', 'flawed',
      'hate', 'dislike', 'disappointed', 'frustrated', 'angry', 'upset', 'concerned',
      'risk', 'danger', 'threat', 'challenge', 'difficulty', 'struggle', 'obstacle'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;
    
    // Normalize to 0-100 scale (50 = neutral)
    const totalWords = words.length;
    if (totalWords === 0) return 50;
    
    const sentimentRatio = (positiveCount - negativeCount) / totalWords;
    return Math.max(0, Math.min(100, 50 + (sentimentRatio * 50)));
  }

  computeStructureScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.trim().split(/\s+/);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    let score = 0;
    
    // Sentence length variety (optimal range: 10-25 words)
    const avgSentenceLength = words.length / sentences.length;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      score += 30;
    } else if (avgSentenceLength >= 8 && avgSentenceLength <= 30) {
      score += 20;
    } else {
      score += 10;
    }
    
    // Paragraph structure (optimal: 3-5 sentences per paragraph)
    if (paragraphs.length > 0) {
      const avgSentencesPerParagraph = sentences.length / paragraphs.length;
      if (avgSentencesPerParagraph >= 3 && avgSentencesPerParagraph <= 5) {
        score += 25;
      } else if (avgSentencesPerParagraph >= 2 && avgSentencesPerParagraph <= 7) {
        score += 15;
      } else {
        score += 5;
      }
    }
    
    // Text length appropriateness (not too short, not too long)
    if (words.length >= 100 && words.length <= 2000) {
      score += 25;
    } else if (words.length >= 50 && words.length <= 3000) {
      score += 15;
    } else {
      score += 5;
    }
    
    // Presence of headings/subheadings
    const hasHeadings = /^#{1,6}\s+/m.test(text) || /^[A-Z][A-Z\s]+$/m.test(text);
    if (hasHeadings) score += 20;
    
    return Math.min(100, score);
  }

  computeLengthScore(text: string, targetLength?: number): number {
    const wordCount = text.trim().split(/\s+/).length;
    const charCount = text.length;
    
    if (!targetLength) {
      // Default scoring based on content type
      if (wordCount >= 300 && wordCount <= 800) return 100; // Blog post
      if (wordCount >= 100 && wordCount <= 300) return 90;  // Newsletter
      if (wordCount >= 20 && wordCount <= 100) return 80;  // Social post
      return 50;
    }
    
    // Score based on how close to target length
    const ratio = wordCount / targetLength;
    if (ratio >= 0.8 && ratio <= 1.2) return 100; // Within 20% of target
    if (ratio >= 0.6 && ratio <= 1.4) return 80;  // Within 40% of target
    if (ratio >= 0.4 && ratio <= 1.6) return 60;  // Within 60% of target
    return 40; // Too far from target
  }

  computeContentScore(text: string, factors: {
    readability?: number;
    sentiment?: number;
    length?: number;
    structure?: number;
    targetLength?: number;
  }): ContentScore {
    const readability = factors.readability ?? this.computeFleschKincaid(text);
    const sentiment = factors.sentiment ?? this.computeSentimentScore(text);
    const structure = factors.structure ?? this.computeStructureScore(text);
    const length = factors.length ?? this.computeLengthScore(text, factors.targetLength);
    
    // Weighted scoring algorithm
    const weights = { 
      readability: 0.25, 
      sentiment: 0.20, 
      length: 0.20, 
      structure: 0.35 
    };
    
    const overall = Math.round(
      readability * weights.readability +
      sentiment * weights.sentiment +
      length * weights.length +
      structure * weights.structure
    );
    
    return {
      overall: Math.max(0, Math.min(100, overall)),
      readability: Math.round(readability),
      sentiment: Math.round(sentiment),
      length: Math.round(length),
      structure: Math.round(structure),
      factors: {
        readability,
        sentiment,
        length,
        structure
      }
    };
  }

  generateQualitySuggestions(score: ContentScore, text: string): string[] {
    const suggestions: string[] = [];
    
    if (score.readability < 60) {
      suggestions.push('Consider using shorter sentences and simpler words to improve readability');
    }
    
    if (score.sentiment < 40) {
      suggestions.push('Consider adding more positive language to improve sentiment');
    } else if (score.sentiment > 80) {
      suggestions.push('Consider balancing positive language with neutral tone');
    }
    
    if (score.structure < 60) {
      suggestions.push('Consider adding headings, shorter paragraphs, or better sentence variety');
    }
    
    if (score.length < 60) {
      suggestions.push('Consider expanding content with more details or examples');
    } else if (score.length > 90) {
      suggestions.push('Consider condensing content for better focus');
    }
    
    // Specific suggestions based on content analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = text.trim().split(/\s+/).length / sentences.length;
    
    if (avgSentenceLength > 25) {
      suggestions.push('Break down long sentences into shorter, clearer ones');
    }
    
    if (avgSentenceLength < 8) {
      suggestions.push('Combine short sentences for better flow');
    }
    
    return suggestions;
  }
}


