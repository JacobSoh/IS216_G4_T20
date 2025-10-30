'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cylinder } from '@react-three/drei'
import * as THREE from 'three'

// Helper to get CSS color
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

export default function LightBeam({ position, targetPosition, color = getCSSColor('--theme-secondary'), opacity = 0.12 }) {
  const beamRef = useRef()
  // Reuse Vector3 objects to avoid allocation every frame
  const startVec = useRef(new THREE.Vector3())
  const endVec = useRef(new THREE.Vector3())
  const directionVec = useRef(new THREE.Vector3())
  const midpointVec = useRef(new THREE.Vector3())

  useFrame(() => {
    if (!beamRef.current || !targetPosition) return

    // Reuse existing vectors instead of creating new ones
    startVec.current.set(position[0], position[1], position[2])
    endVec.current.set(targetPosition.x, targetPosition.y, targetPosition.z)

    directionVec.current.subVectors(endVec.current, startVec.current)
    const distance = directionVec.current.length()

    // Position beam in the middle
    midpointVec.current.addVectors(startVec.current, endVec.current).multiplyScalar(0.5)
    beamRef.current.position.copy(midpointVec.current)

    // Orient beam to point at target
    beamRef.current.lookAt(endVec.current)
    beamRef.current.rotateX(Math.PI / 2)

    // Scale beam to reach target
    beamRef.current.scale.set(1, distance, 1)
  })

  return (
    <group ref={beamRef}>
      {/* Spreading beam - starts wide at 1.5, narrows to 3.5 at bottom */}
      <Cylinder args={[3.5, 1, 1, 16, 1, true]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Cylinder>
    </group>
  )
}
