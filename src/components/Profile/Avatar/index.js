import { useState } from "react";

// Robust avatar: fixed size, no flex shrink, proper fallback
export default function Avatar({ avatar_url, username, size = 20 }) {
  const [errored, setErrored] = useState(false);

  // Interpret numeric size like Tailwind spacing (1 -> 4px, 20 -> 80px)
  const dim = typeof size === 'number' ? `${size * 4}px` : size;
  const containerStyle = { width: dim, height: dim };
  const base = 'inline-flex items-center justify-center rounded-full shrink-0 ring-3 ring-[var(--theme-secondary)] shadow-[0_0_20px_rgba(59,130,246,0.4)] overflow-hidden';

  const needFallback = !avatar_url || errored;
  if (needFallback) {
    const initial = (username?.[0] || 'U').toUpperCase();
    const fontSize = typeof size === 'number' ? `${Math.max(12, Math.floor(size * 4 * 0.45))}px` : undefined;
    return (
      <div className={`${base} bg-[var(--theme-primary)] text-white font-bold leading-none`} style={{ ...containerStyle, fontSize }}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={avatar_url}
      alt={username}
      className={`${base} object-cover block`}
      style={containerStyle}
      onError={() => setErrored(true)}
      draggable={false}
    />
  );
}
