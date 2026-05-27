// config/classmarker.js
// Central configuration for the ClassMarker integration (mock data layer).
// In production, replace MOCK_STUDENTS and generateMockResults with real API calls.

const MOCK_STUDENTS = [
  { id: 'stu-001', name: 'Amara Osei' },
  { id: 'stu-002', name: 'Liam Nakamura' },
  { id: 'stu-003', name: 'Sofia Delgado' },
  { id: 'stu-004', name: 'Ethan Bergström' },
  { id: 'stu-005', name: 'Priya Chandrasekaran' },
  { id: 'stu-006', name: 'Marcus Williams' },
  { id: 'stu-007', name: 'Yuki Tanaka' },
  { id: 'stu-008', name: 'Isabelle Fontaine' },
];

/**
 * Generates deterministic mock test results for a student within a date range.
 * Each call for the same studentId returns consistent-looking (but seeded-random) data.
 */
function generateMockResults(studentId, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayRange = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  // Seed-ish determinism based on studentId characters
  const seed = studentId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const testNames = [
    'Algebra Fundamentals',
    'Reading Comprehension',
    'Scientific Method',
    'World History Quiz',
    'Grammar & Syntax',
    'Geometry Basics',
    'Literary Analysis',
    'Chemistry Intro',
    'Critical Thinking',
    'Data Interpretation',
  ];

  // Decide how many tests occurred (2–8 based on day range and seed)
  const count = Math.min(8, Math.max(2, Math.floor((dayRange / 10) + (seed % 4) + 2)));

  const results = [];
  for (let i = 0; i < count; i++) {
    // Pseudo-random score 42–100
    const score = 42 + ((seed * (i + 3) * 7) % 59);
    const daysOffset = Math.floor((dayRange / count) * i);
    const testDate = new Date(start);
    testDate.setDate(testDate.getDate() + daysOffset);

    results.push({
      testName: testNames[i % testNames.length],
      score,
      maxScore: 100,
      percentage: score,
      date: testDate.toISOString().split('T')[0],
    });
  }

  return results;
}

module.exports = { MOCK_STUDENTS, generateMockResults };
