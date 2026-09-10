export default function Brand({ light = false, size = 34 }) {
  return (
    <span className={light ? 'brand brand--light' : 'brand'}>
      <span className="brand-mark" style={{ width: size, height: size }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 21V8.2a1.6 1.6 0 0 1 .78-1.37l5.4-3.2a1.6 1.6 0 0 1 1.64 0l5.4 3.2A1.6 1.6 0 0 1 18 8.2V21"
            stroke="#fff"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M2.5 21h19" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
          <rect x="8" y="10" width="2.6" height="2.6" rx="0.6" fill="#fff" />
          <rect x="12" y="10" width="2.6" height="2.6" rx="0.6" fill="#fff" />
          <path d="M10 21v-4.2h3V21" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </span>
      <span>
        condominios<span className="brand-dot">.net</span>
      </span>
    </span>
  );
}
