// Domain Logic: Agreement Metrics Calculation
// Implements Cohen's Kappa for nominal classification, Jaccard Index for multi-label sets,
// and Character-level Intersection over Union (IoU) for text spans.

export interface KappaResult {
  kappa: number | null;
  observedAgreement: number;
  expectedAgreement: number;
  sampleSize: number;
  status: 'valid' | 'insufficient_sample' | 'degenerate_distribution';
  message?: string;
  confusionMatrix: {
    labels: string[];
    matrix: Record<string, Record<string, number>>;
  };
}

/**
 * Calculates Cohen's Kappa between two raters on nominal single-choice labels.
 * Requires paired ratings for the same records.
 */
export function calculateCohensKappa(
  pairedAnnotations: Array<{ rater1: string; rater2: string }>
): KappaResult {
  const n = pairedAnnotations.length;

  // Build confusion matrix
  const labelSet = new Set<string>();
  pairedAnnotations.forEach((pair) => {
    labelSet.add(pair.rater1);
    labelSet.add(pair.rater2);
  });
  const labels = Array.from(labelSet).sort();

  const matrix: Record<string, Record<string, number>> = {};
  labels.forEach((l1) => {
    matrix[l1] = {};
    labels.forEach((l2) => {
      matrix[l1][l2] = 0;
    });
  });

  let agreements = 0;
  pairedAnnotations.forEach((pair) => {
    matrix[pair.rater1][pair.rater2] += 1;
    if (pair.rater1 === pair.rater2) {
      agreements += 1;
    }
  });

  if (n === 0) {
    return {
      kappa: null,
      observedAgreement: 0,
      expectedAgreement: 0,
      sampleSize: 0,
      status: 'insufficient_sample',
      message: 'Insufficient comparable annotations (zero pairs).',
      confusionMatrix: { labels, matrix },
    };
  }

  const p_o = agreements / n;

  // Calculate marginals for expected chance agreement (p_e)
  let p_e = 0;
  labels.forEach((label) => {
    // row total for rater1
    let rater1Total = 0;
    labels.forEach((l2) => {
      rater1Total += matrix[label][l2];
    });

    // col total for rater2
    let rater2Total = 0;
    labels.forEach((l1) => {
      rater2Total += matrix[l1][label];
    });

    p_e += (rater1Total / n) * (rater2Total / n);
  });

  // Guard rails against small samples and degenerate cases
  if (n < 5) {
    return {
      kappa: null,
      observedAgreement: Number(p_o.toFixed(4)),
      expectedAgreement: Number(p_e.toFixed(4)),
      sampleSize: n,
      status: 'insufficient_sample',
      message: `Insufficient comparable annotations (sample size ${n} < 5).`,
      confusionMatrix: { labels, matrix },
    };
  }

  if (p_e >= 0.9999) {
    // Complete lack of category variance (all raters always picked identical single label)
    return {
      kappa: 1.0,
      observedAgreement: Number(p_o.toFixed(4)),
      expectedAgreement: Number(p_e.toFixed(4)),
      sampleSize: n,
      status: 'degenerate_distribution',
      message: 'Degenerate distribution (zero label variance across raters).',
      confusionMatrix: { labels, matrix },
    };
  }

  const kappa = (p_o - p_e) / (1 - p_e);

  return {
    kappa: Number(Math.max(-1, Math.min(1, kappa)).toFixed(4)),
    observedAgreement: Number(p_o.toFixed(4)),
    expectedAgreement: Number(p_e.toFixed(4)),
    sampleSize: n,
    status: 'valid',
    confusionMatrix: { labels, matrix },
  };
}

export interface JaccardResult {
  averageJaccard: number;
  sampleSize: number;
  status: 'valid' | 'insufficient_sample';
}

/**
 * Calculates average Jaccard Similarity for multi-label sets between two raters.
 */
export function calculateMultiLabelJaccard(
  pairedSets: Array<{ rater1: string[]; rater2: string[] }>
): JaccardResult {
  if (pairedSets.length === 0) {
    return {
      averageJaccard: 0,
      sampleSize: 0,
      status: 'insufficient_sample',
    };
  }

  let totalJaccard = 0;

  pairedSets.forEach(({ rater1, rater2 }) => {
    const s1 = new Set(rater1);
    const s2 = new Set(rater2);

    if (s1.size === 0 && s2.size === 0) {
      totalJaccard += 1.0;
      return;
    }

    let intersectionCount = 0;
    s1.forEach((val) => {
      if (s2.has(val)) intersectionCount += 1;
    });

    const unionCount = new Set([...s1, ...s2]).size;
    totalJaccard += unionCount === 0 ? 1.0 : intersectionCount / unionCount;
  });

  return {
    averageJaccard: Number((totalJaccard / pairedSets.length).toFixed(4)),
    sampleSize: pairedSets.length,
    status: 'valid',
  };
}

export interface Span {
  start: number;
  end: number;
  label?: string;
}

export interface SpanAgreementResult {
  averageIoU: number;
  exactMatchRate: number;
  sampleSize: number;
  status: 'valid' | 'insufficient_sample';
}

/**
 * Calculates Character-level Intersection over Union (IoU) for text spans.
 */
export function calculateTextSpanIoU(
  pairedSpans: Array<{ rater1: Span[]; rater2: Span[] }>
): SpanAgreementResult {
  if (pairedSpans.length === 0) {
    return {
      averageIoU: 0,
      exactMatchRate: 0,
      sampleSize: 0,
      status: 'insufficient_sample',
    };
  }

  let totalIoU = 0;
  let exactMatches = 0;

  pairedSpans.forEach(({ rater1, rater2 }) => {
    if (rater1.length === 0 && rater2.length === 0) {
      totalIoU += 1.0;
      exactMatches += 1;
      return;
    }

    // Convert spans to character index sets
    const chars1 = new Set<number>();
    rater1.forEach((s) => {
      for (let i = s.start; i < s.end; i++) chars1.add(i);
    });

    const chars2 = new Set<number>();
    rater2.forEach((s) => {
      for (let i = s.start; i < s.end; i++) chars2.add(i);
    });

    let intersection = 0;
    chars1.forEach((c) => {
      if (chars2.has(c)) intersection += 1;
    });

    const union = new Set([...chars1, ...chars2]).size;
    const iou = union === 0 ? 1.0 : intersection / union;

    totalIoU += iou;
    if (iou === 1.0 && rater1.length === rater2.length) {
      exactMatches += 1;
    }
  });

  return {
    averageIoU: Number((totalIoU / pairedSpans.length).toFixed(4)),
    exactMatchRate: Number((exactMatches / pairedSpans.length).toFixed(4)),
    sampleSize: pairedSpans.length,
    status: 'valid',
  };
}
