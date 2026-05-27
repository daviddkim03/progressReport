const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { getSatScoresFromSheets } = require('./sheets.service');

const execFileAsync = promisify(execFile);

const SCRIPT_PATH = path.join(__dirname, '../scripts/read_sat_scores.py');
const CACHE_TTL = 10 * 60 * 1000;
const DEFAULT_WORKBOOKS = [
  process.env.SAT_SCORES_XLSX_PATH,
  '/home/br0k3r/Downloads/2026 Summer SAT Scores API.xlsx',
].filter(Boolean);

let satCache = {
  workbookPath: null,
  loadedAt: 0,
  records: [],
};

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveWorkbookPath() {
  return DEFAULT_WORKBOOKS.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

async function loadWorkbookRecords() {
  const workbookPath = resolveWorkbookPath();
  if (!workbookPath) return [];

  const stillFresh =
    satCache.workbookPath === workbookPath &&
    Date.now() - satCache.loadedAt < CACHE_TTL;

  if (stillFresh) {
    return satCache.records;
  }

  const { stdout } = await execFileAsync('python3', [SCRIPT_PATH, workbookPath], {
    cwd: path.join(__dirname, '../..'),
  });

  const parsed = JSON.parse(stdout);
  satCache = {
    workbookPath,
    loadedAt: Date.now(),
    records: Array.isArray(parsed.records) ? parsed.records : [],
  };

  return satCache.records;
}

async function getSatScoresForStudent(student) {
  const empty = {
    latestTestLabel: null,
    latestTestScore: null,
    latestEnglishScore: null,
    latestMathScore: null,
    superScore: null,
    source: null,
  };

  if (!student) return empty;

  // Try Google Sheets first
  if (process.env.GOOGLE_SHEETS_SPREADSHEET_ID && process.env.GOOGLE_SHEETS_API_KEY) {
    try {
      const sheetsResult = await getSatScoresFromSheets(student);
      if (sheetsResult.source === 'sheets') return sheetsResult;
    } catch (err) {
      console.warn('[sat.service] Sheets lookup failed, falling back to Excel:', err.message);
    }
  }

  // Fall back to local Excel
  const records = await loadWorkbookRecords();
  if (!records.length) return empty;

  const email = normalizeEmail(student.email);
  const name = normalizeName(student.name);

  let match = null;
  if (email) {
    const emailMatches = records.filter(
      (record) => normalizeEmail(record.normalized_email || record.email) === email
    );
    if (emailMatches.length === 1) match = emailMatches[0];
  }
  if (!match && name) {
    match = records.find((record) => normalizeName(record.normalized_name || record.name) === name);
  }
  if (!match) return empty;

  return {
    latestTestLabel: match.latest_test_label ?? null,
    latestTestScore: match.latest_test_score ?? null,
    latestEnglishScore: match.latest_english_score ?? null,
    latestMathScore: match.latest_math_score ?? null,
    superScore: match.super_score ?? null,
    source: 'excel',
  };
}

module.exports = {
  getSatScoresForStudent,
};