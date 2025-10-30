'use client'

import DiscoLights from './DiscoLights'
import MovingSpotlights from './MovingSpotlights'

// Helper to get CSS color
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

export default function TheatreLighting() {
  return (
    <>
      {/* Club ambient lighting */}
      <ambientLight intensity={0.1} color={getCSSColor('--theme-primary')} />

      {/* Main stage neon purple spotlight */}
      <spotLight
        position={[0, 20, -8]}
        angle={0.6}
        penumbra={0.4}
        intensity={3}
        color={getCSSColor('--theme-secondary')}
        target-position={[0, 2, -15]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Side stage neon lights */}
      <spotLight
        position={[-8, 15, -10]}
        angle={0.5}
        penumbra={0.6}
        intensity={2.5}
        color={getCSSColor('--theme-accent')}
        target-position={[0, 4, -15]}
      />
      <spotLight
        position={[8, 15, -10]}
        angle={0.5}
        penumbra={0.6}
        intensity={2.5}
        color={getCSSColor('--theme-accent')}
        target-position={[0, 4, -15]}
      />

      {/* Auctioneer purple spotlight */}
      <spotLight
        position={[0, 12, -12]}
        angle={0.3}
        penumbra={0.3}
        intensity={2}
        color={getCSSColor('--theme-secondary')}
        target-position={[0, 2, -15]}
      />

      {/* Disco ball illumination */}
      <pointLight
        position={[0, 12, -2]}
        intensity={2}
        color={getCSSColor('--theme-secondary')}
        distance={20}
        decay={1.5}
      />

      {/* Audience purple uplighting */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <pointLight
            key={i}
            position={[Math.cos(angle) * 20, 8, Math.sin(angle) * 20]}
            intensity={0.8}
            color={getCSSColor('--theme-secondary')}
            distance={25}
          />
        )
      })}

      {/* Screen neon glow effect */}
      <pointLight
        position={[0, 4, -14]}
        intensity={1.2}
        color={getCSSColor('--theme-secondary')}
        distance={15}
      />

      {/* Neon wall sconces */}
      {Array.from({ length: 12 }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1
        const z = -20 + (Math.floor(i / 2) * 10)
        return (
          <pointLight
            key={i}
            position={[25 * side, 6, z]}
            intensity={1}
            color={getCSSColor('--theme-secondary')}
            distance={10}
          />
        )
      })}

      {/* Balcony neon accent lighting */}
      {[-1, 1].map((side) => (
        Array.from({ length: 3 }).map((_, level) => (
          <pointLight
            key={`${side}-${level}`}
            position={[25 * side, 2 + level * 5, 0]}
            intensity={0.7}
            color={getCSSColor('--theme-secondary')}
            distance={18}
          />
        ))
      )).flat()}

      {/* Add disco lights */}
      <DiscoLights />

      {/* Add moving/scanning spotlights */}
      <MovingSpotlights />
    </>
  )
}
