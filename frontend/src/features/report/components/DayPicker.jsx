// features/report/components/DayPicker.jsx
import React from 'react';

const DAYS = [
  { label: 'Mon', value: '1' },
  { label: 'Tue', value: '2' },
  { label: 'Wed', value: '3' },
  { label: 'Thu', value: '4' },
  { label: 'Fri', value: '5' },
  { label: 'Sat', value: '6' },
  { label: 'Sun', value: '0' },
];

export default function DayPicker({ value = [], onChange }) {
  function toggle(day) {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  }

  function selectAll() { onChange([]); }

  const anySelected = value.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        Day of Week
      </label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Any Day button */}
        <button
          type="button"
          onClick={selectAll}
          style={{
            padding: '7px 14px', borderRadius: 8, border: '1.5px solid',
            borderColor: anySelected ? 'var(--accent)' : 'var(--border)',
            background: anySelected ? 'var(--accent)' : 'var(--bg)',
            color: anySelected ? '#fff' : 'var(--ink)',
            fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Any Day
        </button>

        <span style={{ color: 'var(--border)', fontSize: '1rem' }}>|</span>

        {/* Individual day buttons */}
        {DAYS.map((d) => {
          const active = value.includes(d.value);
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1.5px solid',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                background: active ? 'var(--accent-dim)' : 'var(--bg)',
                color: active ? 'var(--accent)' : 'var(--ink)',
                fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
          Filtering by: {value.map((v) => DAYS.find((d) => d.value === v)?.label).join(', ')}
        </div>
      )}
    </div>
  );
}