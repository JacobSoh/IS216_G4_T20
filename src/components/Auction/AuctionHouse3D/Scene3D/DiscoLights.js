'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Helper to get CSS color
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

export default function DiscoLights() {
  const positions = [
    [-20, 15, -10], [20, 15, -10],
    [-15, 18, 0], [15, 18, 0],
    [-25, 16, 10], [25, 16, 10],
    [-18, 17, 20], [18, 17, 20],
    [-22, 15, 30], [22, 15, 30],
    [0, 20, -5], [0, 20, 15]
  ]

  const lightsRef = useRef([])
  const flashStatesRef = useRef(Array(12).fill(1))

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Random flashing effect - each light has a chance to flash
    // Update ref and directly modify light intensity without state update
    flashStatesRef.current = flashStatesRef.current.map((_, i) => {
      const base = Math.sin(time * 2 + i) * 0.5 + 0.5
      const random = Math.random() > 0.85 ? Math.random() * 2 : 1
      return base * random
    })

    // Directly update light intensities
    lightsRef.current.forEach((light, i) => {
      if (light) {
        light.intensity = flashStatesRef.current[i] * 3
      }
    })
  })

  return (
    <>
      {positions.map((pos, i) => (
        <spotLight
          key={i}
          ref={(el) => { lightsRef.current[i] = el }}
          position={pos}
          angle={0.4}
          penumbra={0.5}
          intensity={3}
          color={getCSSColor('--theme-secondary')}
          distance={30}
          decay={2}
        />
      ))}
    </>
  )
}
