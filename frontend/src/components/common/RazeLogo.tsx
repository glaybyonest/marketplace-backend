import { useId } from 'react'

interface RazeLogoProps {
  className?: string
  title?: string
}

export const RazeLogo = ({ className, title = 'raze' }: RazeLogoProps) => {
  const id = useId().replace(/:/g, '')
  const bgGradientId = `${id}-bg`
  const faceGradientId = `${id}-face`
  const hornGradientId = `${id}-horn`
  const glowGradientId = `${id}-glow`

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={bgGradientId} x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#12090b" />
          <stop offset="0.58" stopColor="#241014" />
          <stop offset="1" stopColor="#471217" />
        </linearGradient>
        <linearGradient id={faceGradientId} x1="20" y1="15" x2="44" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff554d" />
          <stop offset="0.58" stopColor="#e5232c" />
          <stop offset="1" stopColor="#b9131c" />
        </linearGradient>
        <linearGradient id={hornGradientId} x1="16" y1="8" x2="30" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3a3839" />
          <stop offset="1" stopColor="#09090a" />
        </linearGradient>
        <radialGradient id={glowGradientId} cx="0" cy="0" r="1" gradientTransform="translate(31 48) rotate(90) scale(18 24)" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255, 108, 106, 0.45)" />
          <stop offset="1" stopColor="rgba(255, 108, 106, 0)" />
        </radialGradient>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${bgGradientId})`} />
      <circle cx="31" cy="48" r="18" fill={`url(#${glowGradientId})`} />

      <path
        d="M18 15c0-4.2 2.5-7 6.7-8.2-1.2 3.8-.2 6.9 2.8 9.5-3.9 1.1-6.8.8-9.5-1.3Z"
        fill={`url(#${hornGradientId})`}
      />
      <path
        d="M46 15c0-4.2-2.5-7-6.7-8.2 1.2 3.8.2 6.9-2.8 9.5 3.9 1.1 6.8.8 9.5-1.3Z"
        fill={`url(#${hornGradientId})`}
      />

      <path
        d="M31.9 14.5c8.9 0 16.1 6.3 16.1 14.3 0 8.4-6.8 15.6-16.1 15.6S15.8 37.2 15.8 28.8c0-8 7.2-14.3 16.1-14.3Z"
        fill={`url(#${faceGradientId})`}
      />

      <path d="M20.2 24.1c2.7-1.6 5.4-1.9 8.2-.8" stroke="#1b0a0d" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M43.8 24.1c-2.7-1.6-5.4-1.9-8.2-.8" stroke="#1b0a0d" strokeWidth="2.8" strokeLinecap="round" />

      <path d="M23.6 31.1c0-3.1 2-5.1 5.2-5.1 2 0 3.4.6 4.3 1.9-1.4 2.5-3.8 4-7.1 4.5-1.6 0-2.4-.5-2.4-1.3Z" fill="#fffdfd" />
      <path d="M40.4 31.1c0-3.1-2-5.1-5.2-5.1-2 0-3.4.6-4.3 1.9 1.4 2.5 3.8 4 7.1 4.5 1.6 0 2.4-.5 2.4-1.3Z" fill="#fffdfd" />
      <circle cx="27.3" cy="30" r="2.35" fill="#16090c" />
      <circle cx="36.7" cy="30" r="2.35" fill="#16090c" />
      <circle cx="28.1" cy="29.2" r="0.7" fill="#fff" />
      <circle cx="37.5" cy="29.2" r="0.7" fill="#fff" />

      <path d="M29.2 36.7c1.8 1.1 4 1.1 5.8 0" stroke="#1b0a0d" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M34.6 36.8h2.4l-1.5 3.1c-.3.6-.9.9-1.5.7-.7-.2-.9-.9-.7-1.5l1.3-2.3Z" fill="#fff4f4" />

      <g transform="translate(37 38)">
        <rect x="0.5" y="2.5" width="17" height="15" rx="4" fill="#111113" stroke="rgba(255,255,255,0.08)" />
        <path d="M8.9 2.5v15M.5 9.9h17" stroke="#f3272f" strokeWidth="2.4" />
        <path d="M5.3 2.8c.9 2.2 2 3.3 3.6 3.3s2.7-1.1 3.6-3.3" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  )
}
