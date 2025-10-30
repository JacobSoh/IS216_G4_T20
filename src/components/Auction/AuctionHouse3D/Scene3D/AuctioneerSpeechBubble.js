'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox, Box } from '@react-three/drei'

// Helper to read CSS theme colors
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

export default function AuctioneerSpeechBubble({ message, visible }) {
  const bubbleRef = useRef()
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (visible && message) {
      setOpacity(1)
      const timeout = setTimeout(() => {
        setOpacity(0)
      }, 3000) // Show for 3 seconds
      return () => clearTimeout(timeout)
    } else {
      setOpacity(0)
    }
  }, [visible, message])

  useFrame(() => {
    if (bubbleRef.current) {
      // Smooth opacity transition
      const currentOpacity = bubbleRef.current.material.opacity
      const targetOpacity = opacity
      bubbleRef.current.material.opacity += (targetOpacity - currentOpacity) * 0.1
    }
  })

  if (!message) return null

  return (
    <group position={[-5, 2, 0]}>
      {/* Speech bubble background - bigger and more obvious */}
      <RoundedBox ref={bubbleRef} args={[9, 3, 0.15]} radius={0.3}>
        <meshStandardMaterial
          color={getCSSColor('--theme-cream')}
          transparent
          opacity={opacity}
          roughness={0.2}
          metalness={0.1}
        />
      </RoundedBox>

      {/* Speech bubble border - thicker gold border */}
      <RoundedBox args={[9.3, 3.3, 0.12]} radius={0.32} position={[0, 0, -0.08]}>
        <meshStandardMaterial
          color={getCSSColor('--theme-gold')}
          transparent
          opacity={opacity}
          roughness={0.1}
          metalness={0.8}
          emissive={getCSSColor('--theme-gold')}
          emissiveIntensity={0.4}
        />
      </RoundedBox>

      {/* Speech bubble tail pointing to auctioneer - positioned on the right side now */}
      <group position={[4, -1, 0]}>
        <Box args={[0.8, 0.8, 0.12]} rotation={[0, 0, Math.PI / 4]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-cream')}
            transparent
            opacity={opacity}
            roughness={0.2}
            metalness={0.1}
          />
        </Box>
      </group>

      {/* Text */}
      <Html
        transform
        position={[0, 0, 0.15]}
        style={{
          opacity: opacity,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          width: '450px',
          height: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: getCSSColor('--theme-primary'),
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            lineHeight: '1.4',
            wordWrap: 'break-word',
            overflow: 'hidden',
            overflowWrap: 'break-word',
            hyphens: 'auto'
          }}
        >
          {message}
        </div>
      </Html>
    </group>
  )
}
