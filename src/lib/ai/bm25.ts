const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'were',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'this', 'that', 'these', 'those', 'am', 'are',
  'not', 'no', 'nor', 'so', 'very', 'just', 'about', 'above', 'after',
  'again', 'all', 'also', 'any', 'because', 'before', 'below', 'between',
  'both', 'each', 'few', 'further', 'get', 'got', 'here', 'how', 'if',
  'into', 'its', 'let', 'more', 'most', 'much', 'must', 'my', 'myself',
  'now', 'only', 'other', 'our', 'out', 'own', 'same', 'she', 'he',
  'her', 'him', 'his', 'some', 'such', 'than', 'then', 'there', 'their',
  'them', 'they', 'too', 'under', 'until', 'up', 'us', 'we', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'you', 'your',
  'i', 'me', 'he', 'him', 'we', 'us', 'you', 'it', 'they', 'them',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

interface DocumentEntry {
  id: string;
  tokens: string[];
  termFreqs: Map<string, number>;
  length: number;
}

export class BM25Index {
  private documents: Map<string, DocumentEntry> = new Map();
  private documentFreqs: Map<string, number> = new Map();
  private avgDocLength = 0;
  private readonly k1: number;
  private readonly b: number;

  constructor(k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
  }

  addDocument(id: string, text: string): void {
    const tokens = tokenize(text);
    const termFreqs = new Map<string, number>();

    for (const token of tokens) {
      termFreqs.set(token, (termFreqs.get(token) ?? 0) + 1);
    }

    // Update document frequency counts
    const existingDoc = this.documents.get(id);
    if (existingDoc) {
      // Remove old DF contributions before overwriting
      for (const term of existingDoc.termFreqs.keys()) {
        const current = this.documentFreqs.get(term) ?? 0;
        if (current <= 1) {
          this.documentFreqs.delete(term);
        } else {
          this.documentFreqs.set(term, current - 1);
        }
      }
    }

    for (const term of termFreqs.keys()) {
      this.documentFreqs.set(term, (this.documentFreqs.get(term) ?? 0) + 1);
    }

    this.documents.set(id, {
      id,
      tokens,
      termFreqs,
      length: tokens.length,
    });

    this.recalcAvgLength();
  }

  search(query: string, topK = 5): Array<{ id: string; score: number }> {
    const queryTokens = tokenize(query);

    if (queryTokens.length === 0 || this.documents.size === 0) {
      return [];
    }

    const n = this.documents.size;
    const scores: Array<{ id: string; score: number }> = [];

    for (const doc of this.documents.values()) {
      let score = 0;

      for (const term of queryTokens) {
        const tf = doc.termFreqs.get(term) ?? 0;
        if (tf === 0) continue;

        const df = this.documentFreqs.get(term) ?? 0;
        // IDF with smoothing to avoid negative values
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));

        const numerator = tf * (this.k1 + 1);
        const denominator =
          tf + this.k1 * (1 - this.b + this.b * (doc.length / this.avgDocLength));

        score += idf * (numerator / denominator);
      }

      if (score > 0) {
        scores.push({ id: doc.id, score });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK);
  }

  clear(): void {
    this.documents.clear();
    this.documentFreqs.clear();
    this.avgDocLength = 0;
  }

  get size(): number {
    return this.documents.size;
  }

  private recalcAvgLength(): void {
    if (this.documents.size === 0) {
      this.avgDocLength = 0;
      return;
    }
    let total = 0;
    for (const doc of this.documents.values()) {
      total += doc.length;
    }
    this.avgDocLength = total / this.documents.size;
  }
}
