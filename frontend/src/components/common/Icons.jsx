const defaultStroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" {...defaultStroke} />
      <path d="m13 5 7 7-7 7" {...defaultStroke} />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" {...defaultStroke} />
      <path d="m20 20-3.5-3.5" {...defaultStroke} />
    </svg>
  )
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z" {...defaultStroke} />
      <circle cx="12" cy="10" r="2.5" {...defaultStroke} />
    </svg>
  )
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" {...defaultStroke} />
      <path d="M4 20a8 8 0 0 1 16 0" {...defaultStroke} />
    </svg>
  )
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.9 5.9 6.5 1-4.7 4.6 1.1 6.5L12 18l-5.8 3 1.1-6.5L2.6 10l6.5-1L12 3Z" fill="currentColor" />
    </svg>
  )
}

export function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 10a5.5 5.5 0 1 1 11 0v4l1.8 2.2c.5.6.1 1.6-.7 1.6H5.4c-.8 0-1.2-1-.7-1.6L6.5 14v-4Z" {...defaultStroke} />
      <path d="M10 20a2 2 0 0 0 4 0" {...defaultStroke} />
    </svg>
  )
}

export function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14a6 6 0 0 1-6 6H8l-4 3v-9a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6Z" {...defaultStroke} />
    </svg>
  )
}

export function DiceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" {...defaultStroke} />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      <circle cx="15" cy="15" r="1.2" fill="currentColor" />
      <circle cx="9" cy="15" r="1.2" fill="currentColor" />
      <circle cx="15" cy="9" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function ChessPawnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="7" r="2.4" {...defaultStroke} />
      <path d="M9.2 12.2c0-1.6 1.3-2.9 2.8-2.9s2.8 1.3 2.8 2.9c0 .9-.4 1.7-1 2.2l1 2.2H9.3l1-2.2c-.7-.5-1.1-1.3-1.1-2.2Z" {...defaultStroke} />
      <path d="M7.5 19h9" {...defaultStroke} />
      <path d="M6.5 21h11" {...defaultStroke} />
    </svg>
  )
}

export function ChessKnightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.2 20h8.6" {...defaultStroke} />
      <path d="M6.8 22h10.4" {...defaultStroke} />
      <path d="M8.5 20v-1.8c0-1.7.8-3.3 2.2-4.3l2.2-1.7c.8-.6 1.3-1.5 1.3-2.5V7.8c0-.7-.6-1.3-1.3-1.3H11l-2-2.5-2 1.7 1.5 1.9v1.5l-1.6 2.1c-.8 1-1.2 2.3-1.2 3.6V20h2.8Z" {...defaultStroke} />
      <circle cx="11.4" cy="9.4" r="0.8" fill="currentColor" />
    </svg>
  )
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.2 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.5-1.5h1.4V5c-.3 0-1.2-.1-2.2-.1-2.3 0-3.8 1.4-3.8 4V11H8v3h2.1v7h3.1Z" fill="currentColor" />
    </svg>
  )
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" ry="5" {...defaultStroke} />
      <circle cx="12" cy="12" r="3.5" {...defaultStroke} />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  )
}

export function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.8 4c.3 1.3 1.1 2.4 2.3 3.1.7.4 1.4.6 2.2.6v2.8c-1.4 0-2.8-.4-4-1.2v6.1a4.9 4.9 0 1 1-4.9-4.9h.4v2.8h-.4a2.1 2.1 0 1 0 2.1 2.1V4h2.3Z"
        fill="currentColor"
      />
    </svg>
  )
}
