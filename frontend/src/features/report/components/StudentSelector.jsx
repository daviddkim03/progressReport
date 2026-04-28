// features/report/components/StudentSelector.jsx
import React, { useState } from 'react';
import apiClient from '../../../services/apiClient.js';

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
  labelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' },
  refreshBtn: {
    fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)',
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px',
    borderRadius: 4, transition: 'background 0.15s',
  },
  select: {
    width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
    borderRadius: '8px', background: 'var(--bg)', color: 'var(--ink)',
    fontFamily: 'var(--font-sans)', fontSize: '0.95rem', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
    cursor: 'pointer', transition: 'border-color 0.15s', outline: 'none',
  },
  loading: { padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', background: 'var(--surface)', color: 'var(--muted)', fontSize: '0.88rem', fontStyle: 'italic' },
  error: { padding: '10px 14px', border: '1.5px solid #fca5a5', borderRadius: '8px', background: '#fff1f2', color: '#b91c1c', fontSize: '0.85rem' },
};

export default function StudentSelector({ students, loading, error, value, onChange, onStudentsRefreshed }) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await apiClient.post('/students/refresh');
      if (onStudentsRefreshed) onStudentsRefreshed(res.data.data);
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.labelRow}>
        <label style={styles.label} htmlFor="student-select">Student</label>
        <button style={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? '↻ Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {loading && <div style={styles.loading}>Loading students…</div>}
      {error && !loading && <div style={styles.error}>⚠ {error}</div>}

      {!loading && !error && (
        <select id="student-select" style={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Select a student —</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}