'use client'

import { useMemo } from 'react'
import { Box, Cylinder, Sphere } from '@react-three/drei'
import * as THREE from 'three'

const TIER_CONFIG = [
  { name: 'orchestra', y: -3, z: 5, rows: 8, seatsPerRow: 16, platformHeight: 0.5 },
  { name: 'mezzanine', y: 0, z: 15, rows: 6, seatsPerRow: 14, platformHeight: 0.8 },
  { name: 'balcony', y: 4, z: 23, rows: 4, seatsPerRow: 12, platformHeight: 1.0 }
]

// Helper function to get CSS variable color
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

// Initialize color palettes from CSS variables
const SEAT_COLOR_BY_TIER = [
  getCSSColor('--theme-primary'),    // #4D067B
  getCSSColor('--theme-secondary'),  // #B026FF
  getCSSColor('--theme-accent')      // #B984D8
]
const OCCUPANT_PALETTE = [
  getCSSColor('--theme-cream'),      // #F8E2D4
  getCSSColor('--theme-gold'),       // #E2BD6B
  getCSSColor('--theme-accent'),     // #B984D8
  getCSSColor('--theme-cream'),      // #F8E2D4
  getCSSColor('--theme-secondary'),  // #B026FF
  getCSSColor('--theme-accent')      // #B984D8
]
const ACCENT_PALETTE = [
  getCSSColor('--theme-primary'),    // #4D067B
  getCSSColor('--theme-secondary'),  // #B026FF
  getCSSColor('--theme-primary'),    // #4D067B
  getCSSColor('--theme-secondary'),  // #B026FF
  getCSSColor('--theme-primary')     // #4D067B
]

export default function GrandSeating() {
  const tiers = TIER_CONFIG
  const seatColorByTier = SEAT_COLOR_BY_TIER
  const occupantPalette = OCCUPANT_PALETTE
  const accentPalette = ACCENT_PALETTE

  const { seatMeta, viewerSeatKey } = useMemo(() => {
    const viewerPosition = new THREE.Vector3(0, 7, 27)
    const meta = []

    tiers.forEach((tier, tierIndex) => {
      for (let row = 0; row < tier.rows; row++) {
        for (let seat = 0; seat < tier.seatsPerRow; seat++) {
          const seatX = (seat - tier.seatsPerRow / 2 + 0.5) * 1.5
          const seatZ = tier.z + row * 2
          const seatY = tier.y
          const seatKey = `${tier.name}-${row}-${seat}`

          meta.push({
            key: seatKey,
            tierIndex,
            position: [seatX, seatY, seatZ]
          })
        }
      }
    })

    let closestSeatKey = null
    let minDistance = Infinity
    meta.forEach((seat) => {
      const seatVec = new THREE.Vector3(...seat.position)
      const distance = seatVec.distanceTo(viewerPosition)
      if (distance < minDistance) {
        minDistance = distance
        closestSeatKey = seat.key
      }
    })

    return { seatMeta: meta, viewerSeatKey: closestSeatKey }
  }, [tiers])

  const occupantAssignments = useMemo(() => {
    // Use seeded random based on seat key for deterministic colors
    const seededRandom = (seed) => {
      let x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    const assignments = new Map()
    seatMeta.forEach((seat) => {
      if (seat.key === viewerSeatKey) return

      // Create a numeric seed from the seat key string
      const seed = seat.key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

      // Use seeded random to determine if seat is occupied
      if (seededRandom(seed) < 0.5) {
        const bodyColorIndex = Math.floor(seededRandom(seed + 1) * occupantPalette.length)
        const accentColorIndex = Math.floor(seededRandom(seed + 2) * accentPalette.length)
        const bodyColor = occupantPalette[bodyColorIndex]
        const accentColor = accentPalette[accentColorIndex]
        assignments.set(seat.key, { bodyColor, accentColor })
      }
    })
    return assignments
  }, [seatMeta, viewerSeatKey, occupantPalette, accentPalette])

  const platforms = tiers.map((tier) => (
    <Box
      key={`platform-${tier.name}`}
      args={[tier.seatsPerRow * 1.5 + 4, tier.platformHeight, tier.rows * 2 + 2]}
      position={[0, tier.y - tier.platformHeight / 2, tier.z + tier.rows]}
    >
      <meshStandardMaterial
        color="#3D2817"
        roughness={0.4}
        metalness={0.1}
      />
    </Box>
  ))

  const seatGroups = seatMeta.map((seat) => {
    const seatColor = seatColorByTier[seat.tierIndex] || seatColorByTier[0]
    const occupant = occupantAssignments.get(seat.key)

    return (
      <group
        key={seat.key}
        position={seat.position}
      >
        {/* Seat Back */}
        <Box args={[0.8, 1.6, 0.12]} position={[0, 0.8, 0.3]}>
          <meshStandardMaterial
            color={seatColor}
            roughness={0.5}
          />
        </Box>

        {/* Seat Cushion */}
        <Box args={[0.8, 0.15, 0.8]} position={[0, 0.075, 0]}>
          <meshStandardMaterial
            color={seatColor}
            roughness={0.6}
          />
        </Box>

        {/* Armrests */}
        {[-0.5, 0.5].map((armSide, i) => (
          <Box
            key={i}
            args={[0.12, 0.5, 0.6]}
            position={[armSide, 0.3, 0]}
          >
            <meshStandardMaterial
              color="#8B4513"
              roughness={0.3}
              metalness={0.2}
            />
          </Box>
        ))}

        {occupant && (
          <group position={[0, 0.2, -0.05]}>
            <Cylinder args={[0.16, 0.18, 0.95]} position={[0, 0.6, -0.08]}>
              <meshStandardMaterial color={occupant.bodyColor} roughness={0.5} />
            </Cylinder>
            <Sphere args={[0.2]} position={[0, 1.1, -0.1]}>
              <meshStandardMaterial color={occupant.bodyColor} roughness={0.4} />
            </Sphere>
            <Box args={[0.35, 0.18, 0.12]} position={[0, 0.82, -0.05]}>
              <meshStandardMaterial color={occupant.bodyColor} roughness={0.4} />
            </Box>
            <Sphere args={[0.22]} position={[0, 1.24, -0.12]}>
              <meshStandardMaterial color={occupant.accentColor} roughness={0.6} metalness={0.1} />
            </Sphere>
          </group>
        )}
      </group>
    )
  })

  return <group>{[...platforms, ...seatGroups]}</group>
}
