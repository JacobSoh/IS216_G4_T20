'use client'

import { Suspense, useRef, useEffect, useState, createContext, useContext } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  Text,
  Box,
  Plane,
  Sphere,
  RoundedBox,
  Html,
  Cylinder,
  Ring,
  Torus,
  useTexture
} from '@react-three/drei'
import * as THREE from 'three'
import Link from 'next/link'
import AuctionScreen, { ModalContext } from './AuctionScreen'
function GrandStage() {
  const stageRef = useRef()
  const screenRef = useRef()
  const auctioneerRef = useRef()

  // Removed animation for better performance

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
            color={new THREE.Color('#0a0f1a')}
            roughness={0.9}
            toneMapped={false}
          />
        </Plane>

        {/* Decorative Arch */}
        <Torus
          args={[9, 0.8, 8, 20]}
          position={[0, 0, 0.1]}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={new THREE.Color('#8B4513')}
            roughness={0.3}
            metalness={0.4}
          />
        </Torus>

        {/* Ornate Crown */}
        <Box args={[6, 1.5, 0.3]} position={[0, 8, 0.2]}>
          <meshStandardMaterial
            color={new THREE.Color('#DAA520')}
            roughness={0.1}
            metalness={0.8}
            emissive={new THREE.Color('#DAA520')}
            emissiveIntensity={0.1}
          />
        </Box>
      </group>

      {/* Massive Auction Screen - Even Bigger */}
      <group position={[0, 4, -3.5]}>
        <RoundedBox
          ref={screenRef}
          args={[28, 16, 0.3]}
          radius={0.2}
        >
          <meshStandardMaterial
            color="#000015"
            emissive="#001122"
            emissiveIntensity={0.4}
          />
        </RoundedBox>

        {/* Ornate Screen Frame */}
        <RoundedBox
          args={[29, 17, 0.2]}
          radius={0.3}
          position={[0, 0, -0.15]}
        >
          <meshStandardMaterial
            color="#3d2f1f"
            metalness={0.2}
            roughness={0.5}
            emissive="#DAA520"
            emissiveIntensity={0.05}
          />
        </RoundedBox>

        {/* Enhanced Auction Screen - Even Bigger */}
        <AuctionScreen position={[0, 0, 0.16]} scale={[3.5, 3.5, 1]} />
      </group>

      {/* Auctioneer Podium - Further Left on Stage */}
      <group position={[-12, -1, 8]}>
        {/* Podium Base */}
        <Cylinder args={[1.5, 2, 2.5, 8]} position={[0, 0.25, 0]}>
          <meshStandardMaterial
            color="#8B4513"
            roughness={0.3}
            metalness={0.4}
          />
        </Cylinder>

        {/* Podium Top */}
        <Cylinder args={[1.8, 1.8, 0.2, 8]} position={[0, 1.6, 0]}>
          <meshStandardMaterial
            color="#DAA520"
            roughness={0.1}
            metalness={0.8}
          />
        </Cylinder>

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
        </group>
      </group>

      {/* Stage Curtains */}
      <group>
        {/* Left Curtain */}
        <Plane args={[3, 15]} position={[-11, 3, -2]} rotation={[0, 0.2, 0]}>
          <meshStandardMaterial
            color="#8B0000"
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </Plane>

        {/* Right Curtain */}
        <Plane args={[3, 15]} position={[11, 3, -2]} rotation={[0, -0.2, 0]}>
          <meshStandardMaterial
            color="#8B0000"
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </Plane>
      </group>

      {/* Chandelier Above Stage */}
      <group position={[0, 12, -2]}>
        <Cylinder args={[2, 1, 3]} rotation={[Math.PI, 0, 0]}>
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.9}
            roughness={0.1}
            emissive="#FFD700"
            emissiveIntensity={0.3}
          />
        </Cylinder>

        {/* Simplified Chandelier Crystals */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2
          return (
            <Sphere
              key={i}
              args={[0.15]}
              position={[Math.cos(angle) * 1.5, -2, Math.sin(angle) * 1.5]}
            >
              <meshStandardMaterial
                color="#E0E0E0"
                metalness={0.1}
                roughness={0.1}
              />
            </Sphere>
          )
        })}
      </group>
    </group>
  )
}

function GrandTheatre() {
  // User sits at (0, 7, 27) - Simple box enclosure that works
  return (
    <group>
      {/* Elegant Theatre Floor with Pattern */}
      <group>
        <Plane
          args={[120, 120]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -4, 5]}
        >
          <meshStandardMaterial
            color="#2C1810"
            roughness={0.5}
            metalness={0.1}
          />
        </Plane>

        {/* Floor Pattern Rings */}
        {[15, 25, 35, 45].map((radius, i) => (
          <Ring
            key={i}
            args={[radius - 0.2, radius + 0.2, 64]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -3.98, 5]}
          >
            <meshStandardMaterial
              color={`hsl(${25 + i * 8}, 45%, ${18 + i * 4}%)`}
              roughness={0.3}
              metalness={0.3}
            />
          </Ring>
        ))}

        {/* Center Medallion */}
        <Cylinder
          args={[8, 8, 0.1]}
          rotation={[0, 0, 0]}
          position={[0, -3.95, 5]}
        >
          <meshStandardMaterial
            color="#8B4513"
            roughness={0.2}
            metalness={0.4}
          />
        </Cylinder>
      </group>

      {/* Simple Matching Ceiling */}
      <Plane
        args={[120, 120]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 30, 5]}
      >
        <meshStandardMaterial
          color="#3d2f1f"
          roughness={0.5}
          metalness={0.05}
        />
      </Plane>

      {/* Elegant Side Walls with Paneling */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Main Wall */}
          <Plane
            args={[120, 35]}
            rotation={[0, Math.PI / 2 * side, 0]}
            position={[60 * side, 12.5, 5]}
          >
            <meshStandardMaterial
              color="#3d2f1f"
              roughness={0.5}
              metalness={0.05}
            />
          </Plane>

          {/* Classical Columns - Better Positioned */}
          {[-30, -10, 10, 30, 50].map((z) => (
            <group key={z}>
              <Cylinder
                args={[1.2, 1, 25]}
                position={[58 * side, 12.5, z + 5]}
              >
                <meshStandardMaterial
                  color="#8B4513"
                  roughness={0.3}
                  metalness={0.2}
                />
              </Cylinder>
              {/* Column Capital */}
              <Cylinder
                args={[1.8, 1.2, 2]}
                position={[58 * side, 24, z + 5]}
              >
                <meshStandardMaterial
                  color="#DAA520"
                  roughness={0.1}
                  metalness={0.7}
                />
              </Cylinder>
            </group>
          ))}

          {/* Wall Panels - Better Spaced */}
          {[-20, 0, 20, 40].map((z) => (
            <Box
              key={z}
              args={[0.3, 20, 12]}
              position={[59.5 * side, 10, z + 5]}
            >
              <meshStandardMaterial
                color="#654321"
                roughness={0.4}
                metalness={0.1}
              />
            </Box>
          ))}
        </group>
      ))}

      {/* Rear Wall with Grand Entrance */}
      <group position={[0, 12.5, 65]}>
        <Plane args={[120, 35]}>
          <meshStandardMaterial
            color="#3d2f1f"
            roughness={0.5}
            metalness={0.05}
          />
        </Plane>

        {/* Grand Entrance Arch */}
        <Torus
          args={[8, 1.5, 16, 32]}
          position={[0, -5, -0.5]}
        >
          <meshStandardMaterial
            color="#8B4513"
            roughness={0.2}
            metalness={0.6}
          />
        </Torus>

        {/* Entrance Doors */}
        <Box args={[12, 18, 0.5]} position={[0, -8, -0.3]}>
          <meshStandardMaterial
            color="#654321"
            roughness={0.6}
            metalness={0.2}
          />
        </Box>
      </group>

      {/* Front Wall Behind Stage - Matching Color */}
      <group position={[0, 12.5, -30]}>
        <Plane args={[120, 35]}>
          <meshStandardMaterial
            color="#3d2f1f"
            roughness={0.5}
            metalness={0.05}
          />
        </Plane>

      </group>
    </group>
  )
}

function TheatreTieredSeating() {
  const seats = []

  // Create proper tiered platform seating like real theatres
  const tiers = [
    { name: "orchestra", y: -3, z: 5, rows: 8, seatsPerRow: 16, platformHeight: 0.5 },
    { name: "mezzanine", y: 0, z: 15, rows: 6, seatsPerRow: 14, platformHeight: 0.8 },
    { name: "balcony", y: 4, z: 23, rows: 4, seatsPerRow: 12, platformHeight: 1.0 }
  ]

  tiers.forEach((tier, tierIndex) => {
    // Create the platform for this tier
    seats.push(
      <Box
        key={`platform-${tier.name}`}
        args={[tier.seatsPerRow * 1.5 + 4, tier.platformHeight, tier.rows * 2 + 2]}
        position={[0, tier.y - tier.platformHeight/2, tier.z + tier.rows]}
      >
        <meshStandardMaterial
          color="#3D2817"
          roughness={0.4}
          metalness={0.1}
        />
      </Box>
    )

    // Create rows of seats on the platform
    for (let row = 0; row < tier.rows; row++) {
      for (let seat = 0; seat < tier.seatsPerRow; seat++) {
        const seatX = (seat - tier.seatsPerRow/2 + 0.5) * 1.5
        const seatZ = tier.z + row * 2
        const seatY = tier.y

        // All seats are now filled - user sits in one of them

        const seatKey = `${tier.name}-${row}-${seat}`

        seats.push(
          <group
            key={seatKey}
            position={[seatX, seatY, seatZ]}
          >
            {/* Seat Back */}
            <Box args={[0.8, 1.6, 0.12]} position={[0, 0.8, 0.3]}>
              <meshStandardMaterial
                color={tierIndex === 0 ? "#8B0000" : tierIndex === 1 ? "#B22222" : "#A0522D"}
                roughness={0.5}
              />
            </Box>

            {/* Seat Cushion */}
            <Box args={[0.8, 0.15, 0.8]} position={[0, 0.075, 0]}>
              <meshStandardMaterial
                color={tierIndex === 0 ? "#8B0000" : tierIndex === 1 ? "#B22222" : "#A0522D"}
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
          </group>
        )
      }
    }
  })

  return <group>{seats}</group>
}

function LockedSeatController() {
  const { camera, gl } = useThree()
  const [isLocked, setIsLocked] = useState(false)
  const fixedPosition = useRef(new THREE.Vector3(0, 7, 27)) // Balcony middle row center - higher angle view
  const targetPosition = useRef(new THREE.Vector3(0, 4, -15))

  useEffect(() => {
    // Lock camera position immediately
    camera.position.copy(fixedPosition.current)
    camera.lookAt(targetPosition.current)
    setIsLocked(true)

    // Prevent any position changes
    const originalSetPosition = camera.position.set.bind(camera.position)
    camera.position.set = (x, y, z) => {
      // Only allow the fixed position
      return originalSetPosition(
        fixedPosition.current.x,
        fixedPosition.current.y,
        fixedPosition.current.z
      )
    }

    // Handle mouse/touch rotation manually
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let rotation = { x: 0, y: 0 }

    const handleMouseDown = (event) => {
      isDragging = true
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      }
    }

    const handleMouseUp = () => {
      isDragging = false
    }

    const handleMouseMove = (event) => {
      if (!isDragging) return

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      }

      // Convert mouse movement to rotation (inverted for natural feel)
      rotation.y += deltaMove.x * 0.002 // Horizontal rotation
      rotation.x += deltaMove.y * 0.002 // Vertical rotation

      // Allow full 360-degree horizontal rotation, limited vertical
      // rotation.y can be unlimited for full horizontal rotation
      rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.x))  // 60° up/down

      // Apply rotation while keeping position fixed
      camera.position.copy(fixedPosition.current)

      // Calculate new look target based on rotation
      const spherical = new THREE.Spherical()
      spherical.setFromVector3(targetPosition.current.clone().sub(fixedPosition.current))
      spherical.theta += rotation.y
      spherical.phi += rotation.x

      const newTarget = new THREE.Vector3()
      newTarget.setFromSpherical(spherical).add(fixedPosition.current)
      camera.lookAt(newTarget)

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      }
    }

    // Add event listeners
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [camera, gl])

  // Continuously enforce position lock
  useFrame(() => {
    if (isLocked && !camera.position.equals(fixedPosition.current)) {
      camera.position.copy(fixedPosition.current)
    }
  })

  return null // No OrbitControls - we handle everything manually
}

function TheatreLighting() {
  const lightRef = useRef()

  // Removed animation for better performance

  return (
    <>
      {/* Dramatic ambient lighting */}
      <ambientLight intensity={0.15} color="#2C1810" />

      {/* Main stage dramatic spotlights */}
      <spotLight
        position={[0, 20, -8]}
        angle={0.6}
        penumbra={0.4}
        intensity={2.5}
        color="#fff9af"
        target-position={[0, 2, -15]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Side stage warm lights */}
      <spotLight
        position={[-8, 15, -10]}
        angle={0.5}
        penumbra={0.6}
        intensity={1.8}
        color="#FFB366"
        target-position={[0, 4, -15]}
      />
      <spotLight
        position={[8, 15, -10]}
        angle={0.5}
        penumbra={0.6}
        intensity={1.8}
        color="#FFB366"
        target-position={[0, 4, -15]}
      />

      {/* Auctioneer spotlight */}
      <spotLight
        ref={lightRef}
        position={[0, 12, -12]}
        angle={0.3}
        penumbra={0.3}
        intensity={1.5}
        color="#ffffff"
        target-position={[0, 2, -15]}
      />

      {/* Chandelier illumination */}
      <pointLight
        position={[0, 12, -2]}
        intensity={1.2}
        color="#FFD700"
        distance={15}
        decay={1}
      />

      {/* Audience subtle lighting */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <pointLight
            key={i}
            position={[Math.cos(angle) * 20, 8, Math.sin(angle) * 20]}
            intensity={0.3}
            color="#8B4513"
            distance={25}
          />
        )
      })}

      {/* Screen glow effect */}
      <pointLight
        position={[0, 4, -14]}
        intensity={0.8}
        color="#001122"
        distance={12}
      />

      {/* Wall sconce lighting */}
      {Array.from({ length: 12 }).map((_, i) => {
        const side = i % 2 === 0 ? -1 : 1
        const z = -20 + (Math.floor(i / 2) * 10)
        return (
          <pointLight
            key={i}
            position={[25 * side, 6, z]}
            intensity={0.4}
            color="#FFD700"
            distance={8}
          />
        )
      })}

      {/* Balcony lighting */}
      {[-1, 1].map((side) => (
        Array.from({ length: 3 }).map((_, level) => (
          <pointLight
            key={`${side}-${level}`}
            position={[25 * side, 2 + level * 5, 0]}
            intensity={0.5}
            color="#8B4513"
            distance={15}
          />
        ))
      )).flat()}
    </>
  )
}

export default function AuctionHouse3D() {
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBidPanelOpen, setIsBidPanelOpen] = useState(false)
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)
  const [currentLot, setCurrentLot] = useState({
    id: 1,
    name: "Vintage Watch Collection",
    currentBid: 2500,
    timeRemaining: "00:05:42",
    bidders: 12
  })

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[var(--custom-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--custom-bright-blue)] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[var(--custom-text-primary)] text-lg">Loading Auction House...</p>
        </div>
      </div>
    )
  }

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen, currentLot }}>
      <div className="w-full h-screen bg-[var(--custom-bg-primary)] relative">
        {/* 3D Canvas Layer */}
        <div className="absolute inset-0 z-0" style={{ visibility: isModalOpen ? 'hidden' : 'visible' }}>
          <Canvas
            camera={{
              position: [0, 0, 4.8],
              fov: 60,
              near: 0.1,
              far: 200
            }}
            shadows
            style={{
              background: 'var(--custom-bg-primary)'
            }}
          >
            <Suspense fallback={null}>
              <TheatreLighting />
              <GrandTheatre />
              <GrandStage />
              <TheatreTieredSeating />
              <LockedSeatController />

              {/* Environment for reflections */}
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>

      {/* UI Overlay Layer */}
      {!isModalOpen && (
        <>
          <div className="absolute top-6 left-6 z-10 pointer-events-auto">
            <Link href="/">
              <button className="bg-[var(--custom-bg-tertiary)] hover:bg-[var(--custom-navy-blue)] text-[var(--custom-text-primary)] px-6 py-3 rounded-xl border border-[var(--custom-border-color)] backdrop-blur-sm font-semibold transition-all flex items-center gap-2">
                <span>←</span> Home
              </button>
            </Link>
          </div>

          {/* Status Bar - Top Right */}
          <div className="absolute top-6 right-6 text-[var(--custom-text-primary)] z-10">
            <div className="bg-[var(--custom-bg-tertiary)] p-4 rounded-xl border border-[var(--custom-border-color)] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">LIVE AUCTION</span>
              </div>
              <p className="text-[var(--custom-text-muted)] text-xs mt-1">
                {currentLot.bidders} Active Bidders
              </p>
            </div>
          </div>

          {/* Floating Action Button - Bid (Bottom Left) */}
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-[100]">
            <button
              onClick={() => setIsBidPanelOpen(!isBidPanelOpen)}
              className="w-12 h-12 md:w-14 md:h-14 bg-[var(--custom-accent-red)] hover:bg-[#8b1f22] text-white rounded-full shadow-lg flex items-center justify-center text-xl md:text-2xl transition-all"
              title="Place Bid"
            >
              🔨
            </button>
          </div>

          {/* Floating Action Button - Chat (Bottom Right) */}
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[100]">
            <button
              onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
              className="w-12 h-12 md:w-14 md:h-14 bg-[var(--custom-bright-blue)] hover:bg-[var(--custom-ocean-blue)] text-white rounded-full shadow-lg flex items-center justify-center text-xl md:text-2xl transition-all"
              title="Live Chat"
            >
              💬
            </button>
          </div>

          {/* Bidding Panel Popup - Bottom Left */}
          {isBidPanelOpen && (
            <div className="absolute bottom-20 left-4 md:bottom-24 md:left-6 w-[calc(100vw-2rem)] max-w-sm md:w-96 text-[var(--custom-text-primary)] z-[200]">
              <div className="bg-[var(--custom-bg-tertiary)] p-4 md:p-6 rounded-xl border border-[var(--custom-border-color)] backdrop-blur-sm shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg md:text-xl font-bold text-[var(--custom-cream-yellow)]">
                    🔨 Place Your Bid
                  </h3>
                  <button
                    onClick={() => setIsBidPanelOpen(false)}
                    className="text-[var(--custom-text-muted)] hover:text-[var(--custom-text-primary)] text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Current Bid Info */}
                  <div className="bg-[var(--custom-bg-secondary)] p-3 md:p-4 rounded-lg">
                    <p className="text-[var(--custom-text-muted)] text-xs md:text-sm">Current Bid</p>
                    <p className="text-xl md:text-2xl font-bold text-[var(--custom-cream-yellow)]">
                      ${currentLot.currentBid.toLocaleString()}
                    </p>
                  </div>

                  {/* Bid Input */}
                  <div>
                    <label className="text-xs md:text-sm text-[var(--custom-text-secondary)] mb-2 block">
                      Your Bid Amount (Min increment: $2)
                    </label>
                    <input
                      type="number"
                      step="2"
                      min={currentLot.currentBid + 2}
                      placeholder={`Min: $${(currentLot.currentBid + 2).toLocaleString()}`}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-[var(--custom-bg-secondary)] border border-[var(--custom-border-color)] rounded-lg text-[var(--custom-text-primary)] text-sm md:text-base focus:outline-none focus:border-[var(--custom-bright-blue)]"
                    />
                  </div>

                  {/* Place Bid Button */}
                  <button className="w-full py-3 md:py-4 bg-[var(--custom-accent-red)] hover:bg-[#8b1f22] text-white font-bold rounded-lg transition-all text-sm md:text-base">
                    Place Bid
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Panel Popup - Bottom Right */}
          {isChatPanelOpen && (
            <div className="absolute bottom-20 right-4 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] max-w-sm md:w-96 h-80 md:h-96 text-[var(--custom-text-primary)] z-[200]">
              <div className="bg-[var(--custom-bg-tertiary)] rounded-xl border border-[var(--custom-border-color)] backdrop-blur-sm shadow-2xl h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-3 md:p-4 border-b border-[var(--custom-border-color)] flex justify-between items-center">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[var(--custom-bright-blue)]">
                      💬 Live Chat
                    </h3>
                    <p className="text-xs text-[var(--custom-text-muted)]">
                      {currentLot.bidders} participants online
                    </p>
                  </div>
                  <button
                    onClick={() => setIsChatPanelOpen(false)}
                    className="text-[var(--custom-text-muted)] hover:text-[var(--custom-text-primary)] text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
                  {/* Example messages */}
                  <div className="bg-[var(--custom-bg-secondary)] p-2 md:p-3 rounded-lg">
                    <p className="text-xs text-[var(--custom-bright-blue)] font-semibold">User123</p>
                    <p className="text-xs md:text-sm text-[var(--custom-text-secondary)]">Great item!</p>
                  </div>
                  <div className="bg-[var(--custom-bg-secondary)] p-2 md:p-3 rounded-lg">
                    <p className="text-xs text-[var(--custom-cream-yellow)] font-semibold">Bidder42</p>
                    <p className="text-xs md:text-sm text-[var(--custom-text-secondary)]">Going for this one</p>
                  </div>
                  <div className="bg-[var(--custom-bg-secondary)] p-2 md:p-3 rounded-lg">
                    <p className="text-xs text-[var(--custom-bright-blue)] font-semibold">User123</p>
                    <p className="text-xs md:text-sm text-[var(--custom-text-secondary)]">Good luck everyone!</p>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-3 md:p-4 border-t border-[var(--custom-border-color)]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 px-2 md:px-3 py-2 bg-[var(--custom-bg-secondary)] border border-[var(--custom-border-color)] rounded-lg text-xs md:text-sm text-[var(--custom-text-primary)] focus:outline-none focus:border-[var(--custom-bright-blue)]"
                    />
                    <button className="px-3 md:px-4 py-2 bg-[var(--custom-bright-blue)] hover:bg-[var(--custom-ocean-blue)] text-white rounded-lg font-semibold transition-all text-xs md:text-sm">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Fullscreen Modal - Outside Canvas */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: '90vw',
              height: '90vh',
              maxWidth: '1200px',
              maxHeight: '800px',
              backgroundColor: '#0a0f1a',
              border: '3px solid #33A1E0',
              borderRadius: '12px',
              padding: '40px',
              fontFamily: 'system-ui, sans-serif',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#b2292d',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{
              textAlign: 'center',
              borderBottom: '2px solid #1e3548',
              paddingBottom: '30px',
              marginBottom: '30px'
            }}>
              <h1 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#fff9af',
                margin: '0 0 10px 0'
              }}>
                LIVE AUCTION
              </h1>
              <p style={{
                fontSize: '18px',
                color: '#b8c5d1',
                margin: 0
              }}>
                Lot #{currentLot.id} • {currentLot.bidders} Active Bidders
              </p>
            </div>

            {/* Main Content */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: '0 0 40px 0'
              }}>
                {currentLot.name}
              </h2>

              <div style={{
                display: 'flex',
                gap: '80px',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <div>
                  <p style={{
                    fontSize: '24px',
                    color: '#8a9ba8',
                    margin: '0 0 10px 0'
                  }}>
                    Current Bid
                  </p>
                  <p style={{
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: '#fff9af',
                    margin: 0
                  }}>
                    ${currentLot.currentBid.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p style={{
                    fontSize: '24px',
                    color: '#8a9ba8',
                    margin: '0 0 10px 0'
                  }}>
                    Time Remaining
                  </p>
                  <p style={{
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: '#b2292d',
                    margin: 0,
                    fontFamily: 'monospace'
                  }}>
                    {currentLot.timeRemaining}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              borderTop: '2px solid #1e3548',
              paddingTop: '30px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '24px',
                color: '#33A1E0',
                margin: 0,
                fontWeight: 'bold'
              }}>
                🎯 Interactive bidding interface - Click outside to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </ModalContext.Provider>
  )
}