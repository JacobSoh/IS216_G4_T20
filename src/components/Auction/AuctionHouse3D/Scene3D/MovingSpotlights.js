'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cylinder } from '@react-three/drei'
import * as THREE from 'three'
import LightBeam from './LightBeam'

// Helper to get CSS color
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

export default function MovingSpotlights() {
  const groupRef = useRef()
  const spotlightRefs = useRef([])
  const targetRefs = useRef([])
  const [targetPositions, setTargetPositions] = useState(Array(4).fill({ x: 0, y: 0, z: 0 }))

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Each spotlight scans in a different pattern
    const newTargetPositions = spotlightRefs.current.map((spotlight, i) => {
      if (!spotlight) return { x: 0, y: 0, z: 0 }

      const speed = 0.25 + i * 0.08
      const radius = 18 + i * 4

      // Circular scanning pattern with variation per spotlight
      const angle = time * speed + (i * Math.PI * 2 / 4)
      const targetX = Math.cos(angle) * radius
      const targetZ = Math.sin(angle) * radius + 10
      const targetY = -3 + Math.sin(time * 1.5 + i) * 1.5

      // Update target position
      if (targetRefs.current[i]) {
        targetRefs.current[i].position.set(targetX, targetY, targetZ)
        spotlight.target = targetRefs.current[i]
        spotlight.target.updateMatrixWorld()
      }

      return { x: targetX, y: targetY, z: targetZ }
    })

    setTargetPositions(newTargetPositions)
  })

  const positions = [
    [-28, 26, -8],
    [28, 26, -8],
    [-22, 27, 20],
    [22, 27, 20]
  ]

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => {
        // Create target object for each spotlight
        if (!targetRefs.current[i]) {
          targetRefs.current[i] = new THREE.Object3D()
          targetRefs.current[i].position.set(0, 0, 0)
        }

        return (
          <group key={i}>
            <spotLight
              ref={(el) => {
                if (el) {
                  spotlightRefs.current[i] = el
                  el.target = targetRefs.current[i]
                }
              }}
              position={pos}
              angle={0.4}
              penumbra={0.6}
              intensity={6}
              color={getCSSColor('--theme-secondary')}
              distance={50}
              decay={1.8}
            />
            <primitive object={targetRefs.current[i]} />

            {/* Visible light beam - wider and more subtle */}
            <LightBeam
              position={pos}
              targetPosition={targetPositions[i]}
              color={getCSSColor('--theme-secondary')}
              opacity={0.12}
            />

            {/* Spotlight housing */}
            <group position={pos}>
              <Cylinder args={[0.4, 0.3, 0.6, 8]}>
                <meshStandardMaterial
                  color={getCSSColor('--theme-primary')}
                  roughness={0.2}
                  metalness={0.9}
                  emissive={getCSSColor('--theme-secondary')}
                  emissiveIntensity={0.3}
                />
              </Cylinder>
            </group>
          </group>
        )
      })}
    </group>
  )
}
