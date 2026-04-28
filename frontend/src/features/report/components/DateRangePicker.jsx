// features/report/components/DateRangePicker.jsx
import React, { useState } from 'react';

const styles = {
  wrapper: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' },
  input: {
    padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px',
    background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-sans)',
    fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.15s', width: '100%',
  },
  inputError: { border: '1.5px solid #ef4444' },
  hint: { fontSize: '0.73rem', color: 'var(--muted)', marginTop: '2px' },
  error: { fontSize: '0.73rem', color: '#ef4444', marginTop: '4px' },
};

// Parse flexible date input → YYYY-MM-DD or null
function parseDate(raw) {
  const s = (raw || '').trim();
  if (!s) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;

  // MM/DD/YY
  const mdyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (mdyy) return `20${mdyy[3]}-${mdyy[1].padStart(2, '0')}-${mdyy[2].padStart(2, '0')}`;

  // Try native Date parse as fallback
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return null;
}

function DateField({ id, label, value, onChange }) {
  const [raw, setRaw] = useState(value || '');
  const [error, setError] = useState(null);

  function handleChange(e) {
    const input = e.target.value;
    setRaw(input);
    if (!input) { setError(null); onChange(''); return; }
    const parsed = parseDate(input);
    if (parsed) { setError(null); onChange(parsed); }
    else { setError('Use MM/DD/YYYY'); }
  }

  function handleBlur() {
    const parsed = parseDate(raw);
    if (parsed) { setRaw(parsed); setError(null); onChange(parsed); }
  }

  // Sync if parent value changes externally
  React.useEffect(() => {
    if (value && value !== parseDate(raw)) setRaw(value);
  }, [value]);

  return (
    <div style={styles.field}>
      <label style={styles.label} htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        placeholder="MM/DD/YYYY"
        style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error
        ? <span style={styles.error}>⚠ {error}</span>
        : <span style={styles.hint}>MM/DD/YYYY or YYYY-MM-DD</span>
      }
    </div>
  );
}

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }) {
  const rangeInvalid = startDate && endDate && new Date(startDate) > new Date(endDate);

  return (
    <div>
      <div style={styles.wrapper}>
        <DateField id="start-date" label="Start Date" value={startDate} onChange={onStartChange} />
        <DateField id="end-date" label="End Date" value={endDate} onChange={onEndChange} />
      </div>
      {rangeInvalid && <p style={styles.error}>⚠ Start date must be before end date.</p>}
    </div>
  );
}