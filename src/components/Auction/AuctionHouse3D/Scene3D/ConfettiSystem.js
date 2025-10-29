'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'

// Helper to get CSS color from theme variables
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

const ConfettiParticle = React.memo(function ConfettiParticle({ position, velocity, color, startTime }) {
  const meshRef = useRef()
  const startTimeRef = useRef(null)

  useFrame((state) => {
    if (!meshRef.current) return

    // Initialize start time on first frame
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current
    if (elapsed > 4) {
      meshRef.current.visible = false
      return
    }

    // Physics simulation
    const gravity = -9.8
    const drag = 0.98

    meshRef.current.position.x = position[0] + velocity.x * elapsed * drag
    meshRef.current.position.y = position[1] + velocity.y * elapsed + 0.5 * gravity * elapsed * elapsed
    meshRef.current.position.z = position[2] + velocity.z * elapsed * drag

    // Faster rotation for more flutter effect
    meshRef.current.rotation.x += 0.15
    meshRef.current.rotation.y += 0.2
    meshRef.current.rotation.z += 0.08
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.25, 0.25, 0.03]} />
      <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.1}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
})

export default function ConfettiExplosion({ triggerTime, position = [0, 6, -4] }) {
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    if (!triggerTime) return

    // Create extravagant confetti burst - 300 pieces!
    const pieces = []
    const colors = [
      getCSSColor('--theme-gold'),      // #E2BD6B
      getCSSColor('--theme-cream'),     // #F8E2D4
      getCSSColor('--theme-accent'),    // #B984D8
      getCSSColor('--theme-secondary'), // #B026FF
      getCSSColor('--theme-gold'),      // #E2BD6B
      getCSSColor('--theme-cream'),     // #F8E2D4
      getCSSColor('--theme-accent'),    // #B984D8
      getCSSColor('--theme-secondary'), // #B026FF
      '#FFFFFF'
    ]

    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2
      // More variation in speed for dramatic effect
      const speed = 6 + Math.random() * 18
      // Higher upward bias for more spectacular burst
      const upwardBias = 0.7 + Math.random() * 0.8

      pieces.push({
        id: `${triggerTime}-${i}`,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: Math.cos(angle) * speed,
          y: speed * upwardBias,
          z: Math.sin(angle) * speed
        }
      })
    }

    setConfetti(pieces)

    // Clean up after animation - slightly longer for more pieces
    const timeout = setTimeout(() => {
      setConfetti([])
    }, 4500)

    return () => clearTimeout(timeout)
  }, [triggerTime])

  if (!triggerTime || confetti.length === 0) return null

  return (
    <group position={position}>
      {confetti.map((piece) => (
        <ConfettiParticle
          key={piece.id}
          position={[0, 0, 0]}
          velocity={piece.velocity}
          color={piece.color}
          startTime={triggerTime}
        />
      ))}
    </group>
  )
}
