import { PlantScanRecord } from '../types';

export interface CropHealthAssessment {
  score: number; // 0 to 100 percentage
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  validScansCount: number;
  latestScanDate: string;
  cropName?: string;
  summary: string;
}

export interface GradeThresholds {
  aPlus: number; // 95 - 100% -> A+ (genuine 100% receives A+)
  a: number;     // 85 - 94% -> A
  b: number;     // 70 - 84% -> B
  c: number;     // 50 - 69% -> C
}

export const DEFAULT_GRADE_THRESHOLDS: GradeThresholds = {
  aPlus: 95,
  a: 85,
  b: 70,
  c: 50,
};

/**
 * AgriConnect Crop-Health Assessment Method
 * 
 * 1. Scope: Evaluates crop foliage health exclusively from valid Plant Scan results.
 *    (Soil measurements and plant observations are strictly separated: no combining plant-health
 *    observations and soil measurements into one score without a documented, scientifically justified method).
 * 2. Validity: Only scans with complete AI visual assessments where `isSuitable === true`
 *    are considered valid. Blurry, unidentifiable, or non-plant photos are discarded.
 * 3. Thresholds (AgriConnect product thresholds, not an established agricultural standard):
 *    - 95–100%: A+ (A genuine 100% score receives A+)
 *    - 85–94%:  A
 *    - 70–84%:  B
 *    - 50–69%:  C
 *    - Below 50%: D
 * 4. Missing Data: If no valid scans exist, returns null ("Not assessed yet").
 *    Missing data is NEVER treated as proof of good health.
 */
export const cropHealthService = {
  getGrade(score: number, thresholds: GradeThresholds = DEFAULT_GRADE_THRESHOLDS): 'A+' | 'A' | 'B' | 'C' | 'D' {
    if (score >= thresholds.aPlus) return 'A+';
    if (score >= thresholds.a) return 'A';
    if (score >= thresholds.b) return 'B';
    if (score >= thresholds.c) return 'C';
    return 'D';
  },

  /**
   * Evaluates a single valid plant scan on a 0-100 scale based on visible observations.
   */
  evaluateSingleScan(scan: PlantScanRecord): number | null {
    if (!scan.aiAnalysis || !scan.aiAnalysis.isSuitable) {
      return null;
    }

    const { visibleObservations, possibleExplanations } = scan.aiAnalysis;
    let score = 100;

    // Check foliar condition keywords
    const foliar = (visibleObservations?.foliarCondition || '').toLowerCase();
    const vigor = (visibleObservations?.overallVigor || '').toLowerCase();
    const pest = (visibleObservations?.pestOrPathogenSigns || '').toLowerCase();

    // Deductions based on vigor
    if (vigor.includes('severe') || vigor.includes('critical') || vigor.includes('dying')) {
      score -= 45;
    } else if (vigor.includes('moderate') || vigor.includes('stressed') || vigor.includes('wilting')) {
      score -= 20;
    } else if (vigor.includes('mild') || vigor.includes('slight')) {
      score -= 8;
    }

    // Deductions based on foliar condition
    if (foliar.includes('necros') || foliar.includes('blight') || foliar.includes('rot')) {
      score -= 20;
    } else if (foliar.includes('chloros') || foliar.includes('yellowing')) {
      score -= 12;
    } else if (foliar.includes('spot') || foliar.includes('curl')) {
      score -= 10;
    }

    // Deductions based on pests
    if (pest.includes('infest') || pest.includes('caterpillar') || pest.includes('borer')) {
      score -= 20;
    } else if (pest.includes('mildew') || pest.includes('spore') || pest.includes('fungal')) {
      score -= 15;
    } else if (pest.includes('aphid') || pest.includes('mite') || pest.includes('hole')) {
      score -= 10;
    }

    // Deductions based on possible explanations count and severity
    if (possibleExplanations && possibleExplanations.length > 0) {
      const activePathogens = possibleExplanations.filter(
        (p) => !p.cause.toLowerCase().includes('healthy') && !p.cause.toLowerCase().includes('normal')
      );
      if (activePathogens.length >= 3) {
        score -= 10;
      } else if (activePathogens.length >= 1) {
        score -= 5;
      }
    }

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  /**
   * Calculates the overall farm crop-health assessment from an array of plant scans.
   * Optionally filtered by crop name.
   */
  calculateCropHealth(
    scans: PlantScanRecord[], 
    targetCropName?: string, 
    thresholds: GradeThresholds = DEFAULT_GRADE_THRESHOLDS
  ): CropHealthAssessment | null {
    if (!scans || scans.length === 0) {
      return null;
    }

    let relevantScans = scans;
    if (targetCropName) {
      const filtered = scans.filter(
        (s) => s.cropName && s.cropName.toLowerCase().includes(targetCropName.toLowerCase())
      );
      if (filtered.length > 0) {
        relevantScans = filtered;
      }
    }

    // Filter to only valid scans with AI analysis
    const validScores: { score: number; scan: PlantScanRecord }[] = [];
    for (const scan of relevantScans) {
      const score = this.evaluateSingleScan(scan);
      if (score !== null) {
        validScores.push({ score, scan });
      }
    }

    if (validScores.length === 0) {
      return null;
    }

    // Weighted average: most recent scans carry more weight
    let totalWeightedScore = 0;
    let totalWeight = 0;

    validScores.forEach(({ score }, index) => {
      // Recent scans (index 0 is newest) receive higher weight
      const weight = Math.max(1, 5 - index);
      totalWeightedScore += score * weight;
      totalWeight += weight;
    });

    const finalScore = Math.round(totalWeightedScore / totalWeight);
    const grade = this.getGrade(finalScore, thresholds);
    const latest = validScores[0].scan;

    return {
      score: finalScore,
      grade,
      validScansCount: validScores.length,
      latestScanDate: latest.date,
      cropName: latest.cropName,
      summary: `Derived from ${validScores.length} valid plant leaf scan${validScores.length > 1 ? 's' : ''} (latest: ${latest.date}).`,
    };
  },
};
