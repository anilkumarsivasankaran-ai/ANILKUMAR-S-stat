import jstatPkg from 'jstat';
import * as ss from 'simple-statistics';
const { jStat } = jstatPkg as any;

export type HypothesisTail = 'two-tailed' | 'left-tailed' | 'right-tailed';

export interface HypothesisTestRequest {
  testType:
    | 'one-sample-t'
    | 'one-sample-prop'
    | 'two-sample-t'
    | 'paired-t'
    | 'two-prop'
    | 'one-way-anova'
    | 'mann-whitney-u'
    | 'wilcoxon-signed-rank'
    | 'kruskal-wallis'
    | 'chi-square';
  tail?: HypothesisTail;
  alpha?: number;
  // Parameters
  variable?: string;
  variable2?: string;
  groupVariable?: string;
  hypothesizedMean?: number;
  hypothesizedProp?: number;
  // Data arrays
  sample1?: number[];
  sample2?: number[];
  groupData?: { [group: string]: number[] };
  contingencyTable?: number[][];
  rowLabels?: string[];
  colLabels?: string[];
}

export interface HypothesisTestResult {
  testName: string;
  testType: string;
  tail: HypothesisTail;
  alpha: number;
  h0: string;
  h1: string;
  statisticName: string; // 't' | 'z' | 'F' | 'χ²' | 'U' | 'W' | 'H'
  statisticValue: number;
  df?: number | string;
  pValue: number;
  decision: 'Reject H₀' | 'Fail to reject H₀';
  confidenceInterval?: [number, number];
  ciLevel?: number;
  sampleSizes: { [key: string]: number };
  sampleMeans?: { [key: string]: number };
  sampleStds?: { [key: string]: number };
  interpretation: string;
  plainEnglishConclusion: string;
  assumptions: string[];
}

export function runHypothesisTest(req: HypothesisTestRequest): HypothesisTestResult {
  const alpha = req.alpha !== undefined && req.alpha > 0 && req.alpha < 1 ? req.alpha : 0.05;
  const tail: HypothesisTail = req.tail || 'two-tailed';

  switch (req.testType) {
    case 'one-sample-t': {
      const vals = (req.sample1 || []).filter(v => v !== null && !isNaN(v) && isFinite(v));
      const n = vals.length;
      if (n < 2) throw new Error('One-sample t-test requires at least 2 observations');

      const mu0 = req.hypothesizedMean !== undefined ? req.hypothesizedMean : 0;
      const mean = ss.mean(vals);
      const std = ss.sampleStandardDeviation(vals);
      const se = std / Math.sqrt(n);
      const t = se === 0 ? 0 : (mean - mu0) / se;
      const df = n - 1;

      let pValue = 0;
      if (tail === 'two-tailed') {
        pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
      } else if (tail === 'left-tailed') {
        pValue = jStat.studentt.cdf(t, df);
      } else {
        pValue = 1 - jStat.studentt.cdf(t, df);
      }

      const tCrit = jStat.studentt.inv(1 - alpha / 2, df);
      const ci: [number, number] = [
        Number((mean - tCrit * se).toFixed(4)),
        Number((mean + tCrit * se).toFixed(4))
      ];

      const decision = pValue < alpha ? 'Reject H₀' : 'Fail to reject H₀';
      const h0 = `H₀: μ = ${mu0}`;
      const h1 = tail === 'two-tailed' ? `H₁: μ ≠ ${mu0}` : tail === 'left-tailed' ? `H₁: μ < ${mu0}` : `H₁: μ > ${mu0}`;

      const plainEnglish = decision === 'Reject H₀'
        ? `Since the p-value (${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}) is less than the significance level α = ${alpha}, we reject the null hypothesis. There is statistically significant evidence that the true population mean differs from ${mu0} (sample mean = ${mean.toFixed(4)}, 95% CI [${ci[0]}, ${ci[1]}]).`
        : `Since the p-value (${pValue.toFixed(4)}) is greater than or equal to the significance level α = ${alpha}, we fail to reject the null hypothesis. There is insufficient statistical evidence to conclude that the population mean differs from ${mu0} at the ${alpha * 100}% significance level.`;

      return {
        testName: 'One-Sample t-Test',
        testType: req.testType,
        tail,
        alpha,
        h0,
        h1,
        statisticName: 't',
        statisticValue: Number(t.toFixed(4)),
        df,
        pValue: Number(pValue.toFixed(5)),
        decision,
        confidenceInterval: ci,
        ciLevel: (1 - alpha) * 100,
        sampleSizes: { n },
        sampleMeans: { 'Sample Mean': Number(mean.toFixed(4)) },
        sampleStds: { 'Sample Std Dev': Number(std.toFixed(4)) },
        interpretation: `t(${df}) = ${t.toFixed(4)}, p = ${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}. Decision: ${decision}.`,
        plainEnglishConclusion: plainEnglish,
        assumptions: [
          'Data is continuous and sampled randomly from the population.',
          'The sampling distribution of the mean is approximately normal (verified via Central Limit Theorem for n ≥ 30).'
        ]
      };
    }

    case 'two-sample-t': {
      // Independent two-sample t-test (Welch's t-test)
      const s1 = (req.sample1 || []).filter(v => v !== null && !isNaN(v) && isFinite(v));
      const s2 = (req.sample2 || []).filter(v => v !== null && !isNaN(v) && isFinite(v));
      const n1 = s1.length;
      const n2 = s2.length;
      if (n1 < 2 || n2 < 2) throw new Error('Two-sample t-test requires at least 2 observations in each group');

      const m1 = ss.mean(s1);
      const m2 = ss.mean(s2);
      const sd1 = ss.sampleStandardDeviation(s1);
      const sd2 = ss.sampleStandardDeviation(s2);

      const v1 = (sd1 * sd1) / n1;
      const v2 = (sd2 * sd2) / n2;
      const se = Math.sqrt(v1 + v2);
      const t = se === 0 ? 0 : (m1 - m2) / se;

      // Welch-Satterthwaite degrees of freedom
      const numDf = Math.pow(v1 + v2, 2);
      const denDf = (v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1);
      const df = denDf > 0 ? numDf / denDf : n1 + n2 - 2;

      let pValue = 0;
      if (tail === 'two-tailed') {
        pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
      } else if (tail === 'left-tailed') {
        pValue = jStat.studentt.cdf(t, df);
      } else {
        pValue = 1 - jStat.studentt.cdf(t, df);
      }

      const tCrit = jStat.studentt.inv(1 - alpha / 2, df);
      const diff = m1 - m2;
      const ci: [number, number] = [
        Number((diff - tCrit * se).toFixed(4)),
        Number((diff + tCrit * se).toFixed(4))
      ];

      const decision = pValue < alpha ? 'Reject H₀' : 'Fail to reject H₀';
      const h0 = 'H₀: μ₁ - μ₂ = 0 (means are equal)';
      const h1 = tail === 'two-tailed' ? 'H₁: μ₁ - μ₂ ≠ 0' : tail === 'left-tailed' ? 'H₁: μ₁ < μ₂' : 'H₁: μ₁ > μ₂';

      const plainEnglish = decision === 'Reject H₀'
        ? `Since p-value (${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}) < α (${alpha}), we reject the null hypothesis. There is statistically significant evidence of a difference in population means between Group 1 (M = ${m1.toFixed(2)}) and Group 2 (M = ${m2.toFixed(2)}). Difference = ${diff.toFixed(2)}, 95% CI [${ci[0]}, ${ci[1]}].`
        : `Since p-value (${pValue.toFixed(4)}) ≥ α (${alpha}), we fail to reject the null hypothesis. We do not have sufficient evidence at the ${alpha * 100}% significance level to conclude that the population means differ between the two groups.`;

      return {
        testName: "Independent Two-Sample Welch's t-Test",
        testType: req.testType,
        tail,
        alpha,
        h0,
        h1,
        statisticName: 't',
        statisticValue: Number(t.toFixed(4)),
        df: Number(df.toFixed(2)),
        pValue: Number(pValue.toFixed(5)),
        decision,
        confidenceInterval: ci,
        ciLevel: (1 - alpha) * 100,
        sampleSizes: { 'Group 1 (n₁)': n1, 'Group 2 (n₂)': n2 },
        sampleMeans: { 'Group 1 Mean': Number(m1.toFixed(4)), 'Group 2 Mean': Number(m2.toFixed(4)) },
        sampleStds: { 'Group 1 SD': Number(sd1.toFixed(4)), 'Group 2 SD': Number(sd2.toFixed(4)) },
        interpretation: `t(${df.toFixed(2)}) = ${t.toFixed(4)}, p = ${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}. Decision: ${decision}.`,
        plainEnglishConclusion: plainEnglish,
        assumptions: [
          'Samples are independent and randomly drawn.',
          "Welch's formulation robustly handles unequal population variances.",
          'Normality assumption is satisfied for moderate to large samples.'
        ]
      };
    }

    case 'paired-t': {
      const s1 = req.sample1 || [];
      const s2 = req.sample2 || [];
      const pairedDiffs: number[] = [];
      for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
        if (!isNaN(s1[i]) && !isNaN(s2[i])) {
          pairedDiffs.push(s1[i] - s2[i]);
        }
      }
      const n = pairedDiffs.length;
      if (n < 2) throw new Error('Paired t-test requires at least 2 paired observations');

      const meanDiff = ss.mean(pairedDiffs);
      const sdDiff = ss.sampleStandardDeviation(pairedDiffs);
      const se = sdDiff / Math.sqrt(n);
      const t = se === 0 ? 0 : meanDiff / se;
      const df = n - 1;

      let pValue = 0;
      if (tail === 'two-tailed') {
        pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
      } else if (tail === 'left-tailed') {
        pValue = jStat.studentt.cdf(t, df);
      } else {
        pValue = 1 - jStat.studentt.cdf(t, df);
      }

      const tCrit = jStat.studentt.inv(1 - alpha / 2, df);
      const ci: [number, number] = [
        Number((meanDiff - tCrit * se).toFixed(4)),
        Number((meanDiff + tCrit * se).toFixed(4))
      ];

      const decision = pValue < alpha ? 'Reject H₀' : 'Fail to reject H₀';
      const h0 = 'H₀: μ_diff = 0 (mean paired difference is zero)';
      const h1 = tail === 'two-tailed' ? 'H₁: μ_diff ≠ 0' : tail === 'left-tailed' ? 'H₁: μ_diff < 0' : 'H₁: μ_diff > 0';

      const plainEnglish = decision === 'Reject H₀'
        ? `Since p-value (${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}) < α (${alpha}), we reject the null hypothesis. There is statistically significant evidence of a paired difference between conditions (mean difference = ${meanDiff.toFixed(4)}, 95% CI [${ci[0]}, ${ci[1]}]).`
        : `Since p-value (${pValue.toFixed(4)}) ≥ α (${alpha}), we fail to reject the null hypothesis. There is no statistically significant evidence of a difference between the paired measurements.`;

      return {
        testName: 'Paired Samples t-Test',
        testType: req.testType,
        tail,
        alpha,
        h0,
        h1,
        statisticName: 't',
        statisticValue: Number(t.toFixed(4)),
        df,
        pValue: Number(pValue.toFixed(5)),
        decision,
        confidenceInterval: ci,
        ciLevel: (1 - alpha) * 100,
        sampleSizes: { 'Paired Pairs (n)': n },
        sampleMeans: { 'Mean Difference': Number(meanDiff.toFixed(4)) },
        sampleStds: { 'Difference SD': Number(sdDiff.toFixed(4)) },
        interpretation: `t(${df}) = ${t.toFixed(4)}, p = ${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}. Decision: ${decision}.`,
        plainEnglishConclusion: plainEnglish,
        assumptions: [
          'Observations are paired (repeated measures or matched pairs).',
          'Differences are continuous and approximately normally distributed.'
        ]
      };
    }

    case 'one-way-anova': {
      const groups = req.groupData || {};
      const groupNames = Object.keys(groups);
      if (groupNames.length < 2) throw new Error('One-way ANOVA requires at least 2 distinct groups');

      let grandSum = 0;
      let totalN = 0;
      const groupStats: { name: string; n: number; mean: number; std: number }[] = [];

      for (const name of groupNames) {
        const vals = (groups[name] || []).filter(v => v !== null && !isNaN(v) && isFinite(v));
        if (vals.length < 2) continue;
        const m = ss.mean(vals);
        const s = ss.sampleStandardDeviation(vals);
        groupStats.push({ name, n: vals.length, mean: m, std: s });
        grandSum += vals.reduce((a, b) => a + b, 0);
        totalN += vals.length;
      }

      if (groupStats.length < 2) throw new Error('Each group in ANOVA must have at least 2 valid observations');

      const grandMean = grandSum / totalN;
      const k = groupStats.length;
      const dfBetween = k - 1;
      const dfWithin = totalN - k;

      let ssBetween = 0;
      for (const g of groupStats) {
        ssBetween += g.n * Math.pow(g.mean - grandMean, 2);
      }

      let ssWithin = 0;
      for (const name of groupNames) {
        const vals = (groups[name] || []).filter(v => v !== null && !isNaN(v) && isFinite(v));
        const m = ss.mean(vals);
        for (const v of vals) {
          ssWithin += Math.pow(v - m, 2);
        }
      }

      const msBetween = ssBetween / dfBetween;
      const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 1;
      const F = msWithin > 0 ? msBetween / msWithin : 0;
      const pValue = 1 - jStat.centralF.cdf(F, dfBetween, dfWithin);

      const decision = pValue < alpha ? 'Reject H₀' : 'Fail to reject H₀';
      const h0 = 'H₀: μ₁ = μ₂ = ... = μₖ (all group population means are equal)';
      const h1 = 'H₁: At least one group mean differs from the others';

      const plainEnglish = decision === 'Reject H₀'
        ? `Since p-value (${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}) < α (${alpha}), we reject the null hypothesis. There is statistically significant evidence of a difference among group means (F(${dfBetween}, ${dfWithin}) = ${F.toFixed(4)}). A post-hoc test can determine specifically which groups differ.`
        : `Since p-value (${pValue.toFixed(4)}) ≥ α (${alpha}), we fail to reject the null hypothesis. The observed group variations are consistent with random sampling variability.`;

      const sizesMap: Record<string, number> = {};
      const meansMap: Record<string, number> = {};
      const stdsMap: Record<string, number> = {};
      for (const g of groupStats) {
        sizesMap[g.name] = g.n;
        meansMap[g.name] = Number(g.mean.toFixed(2));
        stdsMap[g.name] = Number(g.std.toFixed(2));
      }

      return {
        testName: 'One-Way Analysis of Variance (ANOVA)',
        testType: req.testType,
        tail: 'right-tailed',
        alpha,
        h0,
        h1,
        statisticName: 'F',
        statisticValue: Number(F.toFixed(4)),
        df: `${dfBetween}, ${dfWithin}`,
        pValue: Number(pValue.toFixed(5)),
        decision,
        sampleSizes: sizesMap,
        sampleMeans: meansMap,
        sampleStds: stdsMap,
        interpretation: `F(${dfBetween}, ${dfWithin}) = ${F.toFixed(4)}, p = ${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}. Decision: ${decision}.`,
        plainEnglishConclusion: plainEnglish,
        assumptions: [
          'Samples are independent random samples.',
          'Each group is approximately normally distributed.',
          'Homogeneity of variance across groups (homoscedasticity).'
        ]
      };
    }

    case 'chi-square': {
      // Chi-Square Test of Independence
      const table = req.contingencyTable || [];
      const numRows = table.length;
      if (numRows < 2 || (table[0] && table[0].length < 2)) {
        throw new Error('Contingency table must be at least 2x2');
      }
      const numCols = table[0].length;

      const rowTotals = new Array(numRows).fill(0);
      const colTotals = new Array(numCols).fill(0);
      let grandTotal = 0;

      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          const val = table[r][c] || 0;
          rowTotals[r] += val;
          colTotals[c] += val;
          grandTotal += val;
        }
      }

      if (grandTotal === 0) throw new Error('Contingency table total frequency must be greater than 0');

      let chiSq = 0;
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          const observed = table[r][c] || 0;
          const expected = (rowTotals[r] * colTotals[c]) / grandTotal;
          if (expected > 0) {
            chiSq += Math.pow(observed - expected, 2) / expected;
          }
        }
      }

      const df = (numRows - 1) * (numCols - 1);
      const pValue = 1 - jStat.chisquare.cdf(chiSq, df);
      const decision = pValue < alpha ? 'Reject H₀' : 'Fail to reject H₀';

      const h0 = 'H₀: The two variables are independent (no association)';
      const h1 = 'H₁: The two variables are dependent (statistically significant association)';

      const plainEnglish = decision === 'Reject H₀'
        ? `Since p-value (${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}) < α (${alpha}), we reject the null hypothesis. There is statistically significant evidence of an association between the two categorical variables (χ²(${df}) = ${chiSq.toFixed(4)}).`
        : `Since p-value (${pValue.toFixed(4)}) ≥ α (${alpha}), we fail to reject the null hypothesis. There is no statistically significant association between the two categorical variables.`;

      return {
        testName: 'Chi-Square Test of Independence',
        testType: req.testType,
        tail: 'right-tailed',
        alpha,
        h0,
        h1,
        statisticName: 'χ²',
        statisticValue: Number(chiSq.toFixed(4)),
        df,
        pValue: Number(pValue.toFixed(5)),
        decision,
        sampleSizes: { 'Grand Total (N)': grandTotal },
        interpretation: `χ²(${df}) = ${chiSq.toFixed(4)}, p = ${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}. Decision: ${decision}.`,
        plainEnglishConclusion: plainEnglish,
        assumptions: [
          'Observations are independently sampled.',
          'Expected cell counts should ideally be ≥ 5 for all or most cells.'
        ]
      };
    }

    case 'mann-whitney-u': {
      // Non-parametric two-sample test
      const s1 = (req.sample1 || []).filter(v => v !== null && !isNaN(v) && isFinite(v));
      const s2 = (req.sample2 || []).filter(v => v !== null && !isNaN(v) && isFinite(v));
      const n1 = s1.length;
      const n2 = s2.length;
      if (n1 < 2 || n2 < 2) throw new Error('Mann-Whitney U requires at least 2 observations in each group');

      const combined = [
        ...s1.map(v => ({ v, g: 1 })),
        ...s2.map(v => ({ v, g: 2 }))
      ];
      combined.sort((a, b) => a.v - b.v);

      // Assign fractional ranks
      let rankSum1 = 0;
      let i = 0;
      while (i < combined.length) {
        let j = i;
        while (j < combined.length && combined[j].v === combined[i].v) {
          j++;
        }
        const avgRank = (i + 1 + j) / 2;
        for (let k = i; k < j; k++) {
          if (combined[k].g === 1) rankSum1 += avgRank;
        }
        i = j;
      }

      const U1 = rankSum1 - (n1 * (n1 + 1)) / 2;
      const U2 = n1 * n2 - U1;
      const U = Math.min(U1, U2);

      const meanU = (n1 * n2) / 2;
      const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
      const z = stdU > 0 ? (U - meanU) / stdU : 0;
      const pValue = 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));

      const decision = pValue < alpha ? 'Reject H₀' : 'Fail to reject H₀';
      const h0 = 'H₀: The distributions of the two groups are identical';
      const h1 = 'H₁: The distributions of the two groups differ (stochastic dominance)';

      const plainEnglish = decision === 'Reject H₀'
        ? `Since p-value (${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}) < α (${alpha}), we reject the null hypothesis. There is statistically significant evidence of a distributional difference between Group 1 (n = ${n1}) and Group 2 (n = ${n2}), U = ${U}, z = ${z.toFixed(3)}.`
        : `Since p-value (${pValue.toFixed(4)}) ≥ α (${alpha}), we fail to reject the null hypothesis. There is insufficient evidence to conclude that the two population distributions differ.`;

      return {
        testName: 'Mann-Whitney U Test (Wilcoxon Rank-Sum)',
        testType: req.testType,
        tail: 'two-tailed',
        alpha,
        h0,
        h1,
        statisticName: 'U',
        statisticValue: Number(U.toFixed(2)),
        df: `n₁=${n1}, n₂=${n2}`,
        pValue: Number(pValue.toFixed(5)),
        decision,
        sampleSizes: { 'Group 1 (n₁)': n1, 'Group 2 (n₂)': n2 },
        interpretation: `U = ${U}, z = ${z.toFixed(3)}, p = ${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}. Decision: ${decision}.`,
        plainEnglishConclusion: plainEnglish,
        assumptions: [
          'Samples are independent and ordinal or continuous.',
          'Does not assume normal distribution of errors.'
        ]
      };
    }

    default: {
      throw new Error(`Unsupported hypothesis test type: ${req.testType}`);
    }
  }
}
