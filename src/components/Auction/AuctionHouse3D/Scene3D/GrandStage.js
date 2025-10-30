'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Cylinder, Plane, RoundedBox, Sphere, Torus } from '@react-three/drei'
import * as THREE from 'three'
import ConfettiExplosion from './ConfettiSystem'
import AuctioneerSpeechBubble from './AuctioneerSpeechBubble'
import AuctionScreen from '../../AuctionScreen'

// Helper to get CSS color
const getCSSColor = (varName) => {
  if (typeof window === 'undefined') return '#000000'
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000000'
}

// Cached colors
const CACHED_COLORS = {
  darkPurple: new THREE.Color('#0a0414'),
  primary: new THREE.Color(getCSSColor('--theme-primary')),
  secondary: new THREE.Color(getCSSColor('--theme-secondary')),
  accent: new THREE.Color(getCSSColor('--theme-accent')),
  cream: new THREE.Color(getCSSColor('--theme-cream')),
  gold: new THREE.Color(getCSSColor('--theme-gold'))
}

export default function GrandStage({ confettiTrigger, bidAnnouncement }) {
  const stageRef = useRef()
  const screenRef = useRef()
  const auctioneerRef = useRef()
  const neonArchRef = useRef()
  const neonCrownRef = useRef()
  const discoBallRef = useRef()

  // Pulsing neon animation
  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Pulse the neon arch
    if (neonArchRef.current) {
      neonArchRef.current.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.3
    }

    // Pulse the neon crown
    if (neonCrownRef.current) {
      neonCrownRef.current.material.emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.3
    }

    // Rotate disco ball
    if (discoBallRef.current) {
      discoBallRef.current.rotation.y = time * 0.5
      discoBallRef.current.children.forEach((child, i) => {
        child.material.emissiveIntensity = 1.2 + Math.sin(time * 4 + i) * 0.5
      })
    }
  })

  return (
    <group position={[0, 0, -15]}>
      {/* Extended Stage Platform for Auctioneer */}
      <group>
        {/* Main Stage - Much Longer for Space */}
        <Box args={[35, 1.2, 18]} position={[0, -2, 3]}>
          <meshStandardMaterial
            color="#2d1810"
            roughness={0.4}
            metalness={0.1}
          />
        </Box>

        {/* Stage Apron - Extended Forward */}
        <Box args={[37, 0.8, 6]} position={[0, -2.7, 9]}>
          <meshStandardMaterial
            color="#3d2820"
            roughness={0.3}
            metalness={0.15}
          />
        </Box>

        {/* Stage Steps - Wider and Further */}
        {[0, 1, 2].map((step) => (
          <Box
            key={step}
            args={[39, 0.3, 1.5]}
            position={[0, -3.2 - step * 0.3, 12 + step * 1.5]}
          >
            <meshStandardMaterial
              color={`hsl(${25 + step * 5}, 30%, ${15 + step * 2}%)`}
              roughness={0.5}
            />
          </Box>
        ))}
      </group>

      {/* Ornate Stage Backdrop */}
      <group position={[0, 3, -4]}>
        {/* Main Backdrop */}
        <Plane args={[20, 12]}>
          <meshStandardMaterial
            color={CACHED_COLORS.darkPurple}
            roughness={0.9}
            toneMapped={false}
          />
        </Plane>

        {/* Decorative Arch */}
        <Torus
          ref={neonArchRef}
          args={[9, 0.8, 8, 20]}
          position={[0, 0, 0.1]}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={CACHED_COLORS.secondary}
            roughness={0.2}
            metalness={0.7}
            emissive={CACHED_COLORS.secondary}
            emissiveIntensity={0.5}
          />
        </Torus>

        {/* Gold Crown */}
        <Box ref={neonCrownRef} args={[6, 1.5, 0.3]} position={[0, 8, 0.2]}>
          <meshStandardMaterial
            color={CACHED_COLORS.gold}
            roughness={0.1}
            metalness={0.9}
            emissive={CACHED_COLORS.gold}
            emissiveIntensity={0.4}
          />
        </Box>

        {/* Gold accent strips on arch */}
        {[-1, 1].map((side) => (
          <Box key={side} args={[0.3, 1, 18]} position={[side * 9.5, 0, 0.3]} rotation={[0, 0, side * 0.1]}>
            <meshStandardMaterial
              color={getCSSColor('--theme-gold')}
              roughness={0.2}
              metalness={0.8}
              emissive={getCSSColor('--theme-gold')}
              emissiveIntensity={0.3}
            />
          </Box>
        ))}
      </group>

      {/* Stage Screen */}
      <group position={[0, 3.6, -4.2]}>
        <RoundedBox ref={screenRef} args={[13.2, 6.4, 0.2]} radius={0.16}>
          <meshStandardMaterial color="#050510" emissive="#0a0820" emissiveIntensity={0.32} />
        </RoundedBox>

        {/* Gold Screen Frame */}
        <RoundedBox args={[13.8, 7, 0.12]} radius={0.22} position={[0, 0, -0.12]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-gold')}
            metalness={0.8}
            roughness={0.2}
            emissive={getCSSColor('--theme-gold')}
            emissiveIntensity={0.3}
          />
        </RoundedBox>

        {/* Purple inner frame accent */}
        <RoundedBox args={[13.4, 6.6, 0.08]} radius={0.18} position={[0, 0, -0.08]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-primary')}
            metalness={0.5}
            roughness={0.3}
            emissive={getCSSColor('--theme-secondary')}
            emissiveIntensity={0.2}
          />
        </RoundedBox>

        {/* Enhanced Auction Screen */}
        <AuctionScreen position={[0, 1, 0.1]} scale={[1.1, 1.1, 1]} />
      </group>

      {/* Confetti effect positioned behind screen */}
      <ConfettiExplosion triggerTime={confettiTrigger} position={[0, 6, -4]} />

      {/* Auctioneer Podium - Further Left on Stage */}
      <group position={[-12, -1, 8]}>
        {/* Podium Base - Dark purple */}
        <Cylinder args={[1.5, 2, 2.5, 8]} position={[0, 0.25, 0]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-primary')}
            roughness={0.3}
            metalness={0.5}
            emissive={getCSSColor('--theme-secondary')}
            emissiveIntensity={0.1}
          />
        </Cylinder>

        {/* Gold Podium Top */}
        <Cylinder args={[1.8, 1.8, 0.2, 8]} position={[0, 1.6, 0]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-gold')}
            roughness={0.1}
            metalness={0.9}
            emissive={getCSSColor('--theme-gold')}
            emissiveIntensity={0.2}
          />
        </Cylinder>

        {/* Gold accent ring */}
        <Torus args={[1.6, 0.1, 8, 32]} position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-gold')}
            roughness={0.2}
            metalness={0.8}
            emissive={getCSSColor('--theme-gold')}
            emissiveIntensity={0.3}
          />
        </Torus>

        {/* Auctioneer Figure */}
        <group ref={auctioneerRef} position={[0, 2.8, 0]}>
          {/* Body */}
          <Cylinder args={[0.4, 0.6, 1.8]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#2C1810" roughness={0.8} />
          </Cylinder>

          {/* Head */}
          <Sphere args={[0.3]} position={[0, 1.2, 0]}>
            <meshStandardMaterial color="#D2B48C" roughness={0.6} />
          </Sphere>

          {/* Gavel Arm - Pointing toward center */}
          <Box args={[0.1, 0.8, 0.1]} position={[0.5, 0.4, 0]} rotation={[0, 0, -0.3]}>
            <meshStandardMaterial color="#D2B48C" roughness={0.6} />
          </Box>

          {/* Gavel */}
          <Cylinder args={[0.08, 0.08, 0.4]} position={[0.8, 0.8, 0]} rotation={[0, 0, -0.3]}>
            <meshStandardMaterial color="#8B4513" roughness={0.4} />
          </Cylinder>

          {/* Speech Bubble */}
          <AuctioneerSpeechBubble message={bidAnnouncement?.message} visible={!!bidAnnouncement} />
        </group>
      </group>

      {/* Stage Curtains */}
      <group>
        {/* Left Curtain */}
        <Plane args={[3, 15]} position={[-11, 3, -2]} rotation={[0, 0.2, 0]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-primary')}
            roughness={0.7}
            side={THREE.DoubleSide}
            emissive={getCSSColor('--theme-secondary')}
            emissiveIntensity={0.1}
          />
        </Plane>

        {/* Right Curtain */}
        <Plane args={[3, 15]} position={[11, 3, -2]} rotation={[0, -0.2, 0]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-primary')}
            roughness={0.7}
            side={THREE.DoubleSide}
            emissive={getCSSColor('--theme-secondary')}
            emissiveIntensity={0.1}
          />
        </Plane>
      </group>

      {/* Disco Ball Above Stage */}
      <group ref={discoBallRef} position={[0, 12, -2]}>
        <Sphere args={[1.5, 16, 16]}>
          <meshStandardMaterial
            color={getCSSColor('--theme-secondary')}
            metalness={0.95}
            roughness={0.05}
            emissive={getCSSColor('--theme-secondary')}
            emissiveIntensity={0.5}
          />
        </Sphere>

        {/* Neon Ring Around Disco Ball */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <Sphere
              key={i}
              args={[0.2]}
              position={[Math.cos(angle) * 2, -0.5, Math.sin(angle) * 2]}
            >
              <meshStandardMaterial
                color={getCSSColor('--theme-secondary')}
                metalness={0.8}
                roughness={0.1}
                emissive={getCSSColor('--theme-secondary')}
                emissiveIntensity={1.2}
              />
            </Sphere>
          )
        })}
      </group>
    </group>
  )
}
