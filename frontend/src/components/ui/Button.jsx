// components/ui/Button.jsx
import React from 'react';

const sizeMap = {
  sm: { padding: '6px 14px', fontSize: '0.82rem' },
  md: { padding: '10px 22px', fontSize: '0.92rem' },
  lg: { padding: '13px 30px', fontSize: '1rem' },
};

const variantStyles = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: '1.5px solid var(--accent)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--accent)',
    border: '1.5px solid var(--accent)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--muted)',
    border: '1.5px solid var(--border)',
  },
};

export default function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  style: extraStyle = {},
}) {
  const base = variantStyles[variant] || variantStyles.primary;
  const sz = sizeMap[size] || sizeMap.md;

  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.18s var(--ease)',
    opacity: disabled || loading ? 0.55 : 1,
    width: fullWidth ? '100%' : 'auto',
    letterSpacing: '0.01em',
    ...base,
    ...sz,
    ...extraStyle,
  };

  return (
    <button
      type={type}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      style={styles}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '14px',
        height: '14px',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('btn-spin-kf')) {
  const style = document.createElement('style');
  style.id = 'btn-spin-kf';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}
