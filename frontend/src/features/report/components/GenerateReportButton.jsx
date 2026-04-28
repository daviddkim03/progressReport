// features/report/components/GenerateReportButton.jsx
import React from 'react';
import Button from '../../../components/ui/Button.jsx';

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: '#f0fdf4',
    border: '1.5px solid #86efac',
    borderRadius: '8px',
    color: '#15803d',
    fontSize: '0.88rem',
    fontWeight: 500,
    animation: 'fadeIn 0.3s ease',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 16px',
    background: '#fff1f2',
    border: '1.5px solid #fca5a5',
    borderRadius: '8px',
    color: '#b91c1c',
    fontSize: '0.85rem',
    lineHeight: 1.5,
    animation: 'fadeIn 0.3s ease',
  },
};

// Inject fadeIn keyframe once
if (typeof document !== 'undefined' && !document.getElementById('fade-kf')) {
  const s = document.createElement('style');
  s.id = 'fade-kf';
  s.textContent = '@keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }';
  document.head.appendChild(s);
}

export default function GenerateReportButton({
  onClick,
  disabled,
  loading,
  error,
  success,
}) {
  return (
    <div style={styles.wrapper}>
      <Button
        onClick={onClick}
        disabled={disabled}
        loading={loading}
        size="lg"
        fullWidth
      >
        {loading ? 'Generating PDF…' : 'Generate Report'}
      </Button>

      {success && !loading && (
        <div style={styles.successBanner}>
          <span style={{ fontSize: '1.1rem' }}>✓</span>
          <span>Report downloaded successfully!</span>
        </div>
      )}

      {error && !loading && (
        <div style={styles.errorBanner}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
