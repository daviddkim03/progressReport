// services/stats.service.js
// Pure computation layer – no I/O, easy to unit-test.

/**
 * Computes summary statistics from an array of test result objects.
 *
 * @param {Array<{ testName: string, score: number, maxScore: number, percentage: number, date: string }>} results
 * @returns {{
 *   totalTests: number,
 *   averageScore: number,
 *   highestScore: number,
 *   lowestScore: number,
 *   averagePercentage: number,
 *   highestPercentage: number,
 *   lowestPercentage: number,
 *   trend: 'improving' | 'declining' | 'stable'
 * }}
 */
function computeStats(results) {
  if (!results || results.length === 0) {
    return {
      totalTests: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      averagePercentage: 0,
      highestPercentage: 0,
      lowestPercentage: 0,
      trend: 'stable',
    };
  }

  const percentages = results.map((r) => r.percentage);

  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr) => Math.round((sum(arr) / arr.length) * 10) / 10;

  const mid = Math.floor(results.length / 2);
  const firstHalf  = percentages.slice(0, mid || 1);
  const secondHalf = percentages.slice(mid);
  const firstAvg   = avg(firstHalf);
  const secondAvg  = avg(secondHalf);
  let trend = 'stable';
  if (secondAvg - firstAvg > 5) trend = 'improving';
  else if (firstAvg - secondAvg > 5) trend = 'declining';

  return {
    totalTests:        results.length,
    averageScore:      avg(percentages),
    highestScore:      Math.max(...percentages),
    lowestScore:       Math.min(...percentages),
    averagePercentage: avg(percentages),
    highestPercentage: Math.max(...percentages),
    lowestPercentage:  Math.min(...percentages),
    trend,
  };
}

/**
 * Returns a letter grade for a percentage score.
 * @param {number} pct
 * @returns {string}
 */
function letterGrade(pct) {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

module.exports = { computeStats, letterGrade };
