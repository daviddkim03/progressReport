// services/sheets.service.js
// Fetches SAT scores from a Google Sheet.
//
// SETUP:
//   1. In Google Sheets: Share → Anyone with the link → Viewer
//   2. Get your Spreadsheet ID from the URL:
//      https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
//   3. Create a free API key at https://console.cloud.google.com
//      (Credentials → API Key → restrict to Sheets API)
//   4. Add to your .env:
//      GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
//      GOOGLE_SHEETS_API_KEY=your_api_key
//      GOOGLE_SHEETS_RANGE=Sheet1         (optional, defaults to Sheet1)

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let cache = { records: [], loadedAt: 0 };

function normalizeName(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

// Parse the raw Sheets values array into structured records.
// Expected sheet layout (matches your Excel):
//   Col 0: Name
//   Col 1: Student Email
//   Col 2: DIAGNOSTIC EN
//   Col 3: DIAGNOSTIC MA
//   Col 4: DIAGNOSTIC TOTAL
//   Col 5-7:  Week 1 EN/MA/TOTAL
//   Col 8-10: Week 2 EN/MA/TOTAL
//   ... repeating in groups of 3 up to Week 7
function parseRows(rows) {
    if (!rows || rows.length < 3) return [];

    // Row 0 = header labels (Name, Student Email, DIAGNOSTIC, ...)
    // Row 1 = sub-headers (EN, MA, EN+MA, ...)
    // Row 2+ = data

    const records = [];

    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        const name = String(row[0] || '').trim();
        const email = String(row[1] || '').trim();
        if (!name && !email) continue;

        // Groups of 3 columns: [EN, MA, TOTAL] starting at col 2
        // Col 2-4 = DIAGNOSTIC, col 5-7 = Week 1, col 8-10 = Week 2, ...
        const scoreGroups = [];
        for (let col = 2; col < row.length; col += 3) {
            const en = parseFloat(row[col]) || null;
            const ma = parseFloat(row[col + 1]) || null;
            const total = parseFloat(row[col + 2]) || null;
            scoreGroups.push({ en, ma, total });
        }

        // Latest = last non-absent/zero group
        let latestIndex = -1;
        for (let j = scoreGroups.length - 1; j >= 0; j--) {
            if (scoreGroups[j].total && scoreGroups[j].total > 0) {
                latestIndex = j;
                break;
            }
        }

        const latest = latestIndex >= 0 ? scoreGroups[latestIndex] : null;
        const weekLabels = ['Diagnostic', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'];

        // Super score = best EN ever + best MA ever
        const bestEN = Math.max(...scoreGroups.map((g) => g.en || 0).filter(Boolean));
        const bestMA = Math.max(...scoreGroups.map((g) => g.ma || 0).filter(Boolean));
        const superScore = (bestEN > 0 && bestMA > 0) ? bestEN + bestMA : null;

        records.push({
            name,
            email,
            normalized_name: normalizeName(name),
            normalized_email: normalizeEmail(email),
            latest_test_label: latestIndex >= 0 ? (weekLabels[latestIndex] || `Week ${latestIndex}`) : null,
            latest_test_score: latest?.total ?? null,
            latest_english_score: latest?.en ?? null,
            latest_math_score: latest?.ma ?? null,
            super_score: superScore,
            all_scores: scoreGroups,
        });
    }

    return records;
}

async function fetchFromSheets() {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const range = process.env.GOOGLE_SHEETS_RANGE || 'Sheet1';

    console.log('[sheets] spreadsheetId:', spreadsheetId ? 'SET' : 'MISSING');
    console.log('[sheets] apiKey:', apiKey ? 'SET' : 'MISSING');
    console.log('[sheets] range:', range);

    if (!spreadsheetId || !apiKey) return null;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    console.log('[sheets] Fetching URL (masked):', url.replace(apiKey, '***'));

    const res = await fetch(url);
    console.log('[sheets] Response status:', res.status);
    if (!res.ok) {
        const text = await res.text();
        console.error('[sheets] Error response:', text.slice(0, 300));
        throw new Error(`Google Sheets API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    console.log('[sheets] Rows received:', data.values?.length ?? 0);
    console.log('[sheets] Sample row 0:', JSON.stringify(data.values?.[0]));
    return parseRows(data.values || []);
}

async function loadRecords() {
    const now = Date.now();
    if (cache.records.length > 0 && now - cache.loadedAt < CACHE_TTL) {
        return cache.records;
    }

    try {
        const records = await fetchFromSheets();
        if (records && records.length > 0) {
            cache = { records, loadedAt: now };
            return records;
        }
    } catch (err) {
        console.warn('[sheets.service] Failed to fetch from Google Sheets:', err.message);
    }

    return null; // null = fall back to Excel
}

async function getSatScoresFromSheets(student) {
    const empty = {
        latestTestLabel: null,
        latestTestScore: null,
        latestEnglishScore: null,
        latestMathScore: null,
        superScore: null,
        source: null,
    };

    if (!student) return empty;

    const records = await loadRecords();
    if (!records) return empty;

    const email = normalizeEmail(student.email || '');
    const name = normalizeName(student.name || '');

    let match = null;
    if (email) {
        match = records.find((r) => r.normalized_email === email);
    }
    if (!match && name) {
        match = records.find((r) => r.normalized_name === name);
    }
    if (!match) return empty;

    return {
        latestTestLabel: match.latest_test_label ?? null,
        latestTestScore: match.latest_test_score ?? null,
        latestEnglishScore: match.latest_english_score ?? null,
        latestMathScore: match.latest_math_score ?? null,
        superScore: match.super_score ?? null,
        source: 'sheets',
    };
}

module.exports = { getSatScoresFromSheets, loadRecords };