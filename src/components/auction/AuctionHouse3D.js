'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense, useRef, useEffect, useState, useMemo, createContext, useContext } from 'react'
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
import { useAuctionLive } from '@/hooks/useAuctionLive'
import { useAuctionChat } from '@/hooks/useAuctionChat'
import AuctionScreen, { ModalContext, AuctionScreenCard, buildScreenLot } from './AuctionScreen'
import { axiosBrowserClient } from '@/utils/axios/client'
import { buildStoragePublicUrl } from '@/utils/storage'

const pad = (value) => String(Math.max(0, Math.floor(value))).padStart(2, '0')

const formatTimeRemaining = (endTime) => {
  if (!endTime) return '--:--:--'
  const diff = endTime.getTime() - Date.now()
  if (diff <= 0) return '00:00:00'
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

const formatChatTimestamp = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const resolveAvatarUrl = (sender) => {
  if (!sender) {
    return DEFAULT_AVATAR
  }
  const bucket = sender.avatar_bucket || 'avatar'
  const objectPath = sender.object_path || 'default.png'
  return (
    buildStoragePublicUrl({
      bucket,
      objectPath
    }) || DEFAULT_AVATAR
  )
}

const DEFAULT_AVATAR = '/images/avatar-placeholder.png'

const buildLotFromSnapshot = (snapshot) => {
  if (!snapshot) {
    return {
      id: null,
      name: 'Pending Reveal',
      currentBid: 0,
      timeRemaining: '--:--:--',
      bidders: 0,
      activeItem: null,
      nextItem: null,
      auctionName: '',
      imageUrl: null,
      minBid: 0,
      hasBid: false,
      auctionEndsAt: null,
      auctionStartsAt: null
    }
  }
  const auction = snapshot.auction ?? {}
  const items = snapshot.items ?? []
  const active = snapshot.activeItem ?? null
  const next = snapshot.nextItem ?? null
  const bidderCount = items.reduce((acc, item) => {
    const hasBidder = Boolean(item.current_bid?.uid)
    return acc + (hasBidder ? 1 : 0)
  }, 0)
  const activeBid = active?.current_bid ?? null
  const endDate = auction.end_time ? new Date(auction.end_time) : null
  const minBid = Number(active?.min_bid ?? 0)
  const bidIncrement = Number.isFinite(Number(active?.bid_increment)) && Number(active?.bid_increment) > 0
    ? Number(active?.bid_increment)
    : 0.01
  const currentBidValue = Number(activeBid?.current_price ?? 0)
  const nextBidMinimum = currentBidValue + bidIncrement
  return {
    id: active?.iid ?? null,
    name: active?.title ?? 'Upcoming Lot',
    currentBid: activeBid?.current_price ?? minBid,
    timeRemaining: formatTimeRemaining(endDate),
    bidders: bidderCount,
    activeItem: active,
    nextItem: next,
    auctionName: auction.name ?? '',
    imageUrl: active?.imageUrl ?? null,
    minBid,
    bidIncrement,
    nextBidMinimum,
    hasBid: Boolean(activeBid),
    auctionEndsAt: auction.end_time ?? null,
    auctionStartsAt: auction.start_time ?? null
  }
}

const TIER_CONFIG = [
  { name: 'orchestra', y: -3, z: 5, rows: 8, seatsPerRow: 16, platformHeight: 0.5 },
  { name: 'mezzanine', y: 0, z: 15, rows: 6, seatsPerRow: 14, platformHeight: 0.8 },
  { name: 'balcony', y: 4, z: 23, rows: 4, seatsPerRow: 12, platformHeight: 1.0 }
]

const SEAT_COLOR_BY_TIER = ['#8B0000', '#B22222', '#A0522D']
const OCCUPANT_PALETTE = ['#f4c1c1', '#b5d6ff', '#f5dea3', '#c7f9cc', '#d5b5ff', '#f7e7ce']
const ACCENT_PALETTE = ['#352315', '#52311c', '#101010', '#6b3e24', '#8a4b32']
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

      {/* Stage Screen */}
      <group position={[0, 3.6, -4.2]}>
        <RoundedBox ref={screenRef} args={[13.2, 6.4, 0.2]} radius={0.16}>
          <meshStandardMaterial color="#060b16" emissive="#0b1426" emissiveIntensity={0.32} />
        </RoundedBox>

        {/* Ornate Screen Frame */}
        <RoundedBox args={[13.8, 7, 0.12]} radius={0.22} position={[0, 0, -0.12]}>
          <meshStandardMaterial
            color="#3d2f1f"
            metalness={0.28}
            roughness={0.4}
            emissive="#DAA520"
            emissiveIntensity={0.06}
          />
        </RoundedBox>

        {/* Enhanced Auction Screen */}
        <AuctionScreen position={[0, 1, 0.1]} scale={[1.1, 1.1, 1]} />
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
    const assignments = new Map()
    seatMeta.forEach((seat) => {
      if (seat.key === viewerSeatKey) return

      if (Math.random() < 0.5) {
        const bodyColor = occupantPalette[Math.floor(Math.random() * occupantPalette.length)]
        const accentColor = accentPalette[Math.floor(Math.random() * accentPalette.length)]
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

    // Prevent any position changes via external controls
    const originalSet = camera.position.set
    camera.position.set = (x, y, z) => {
      return originalSet.call(
        camera.position,
        fixedPosition.current.x,
        fixedPosition.current.y,
        fixedPosition.current.z
      )
    }

    // Handle pointer-based rotation manually (mouse + touch)
    let isDragging = false
    let previousPointerPosition = { x: 0, y: 0 }
    let rotation = { x: 0, y: 0 }
    let hasDragged = false
    let suppressClick = false
    let activePointerId = null

    const previousTouchAction = gl.domElement.style.touchAction
    const previousUserSelect = gl.domElement.style.userSelect
    gl.domElement.style.touchAction = 'none'
    gl.domElement.style.userSelect = 'none'

    const isWithinCanvas = (clientX, clientY) => {
      const rect = gl.domElement.getBoundingClientRect()
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      )
    }

    const startDrag = (clientX, clientY, pointerId = null) => {
      isDragging = true
      hasDragged = false
      activePointerId = pointerId
      previousPointerPosition = { x: clientX, y: clientY }
    }

    const updateDrag = (clientX, clientY) => {
      if (!isDragging) return

      const deltaMove = {
        x: clientX - previousPointerPosition.x,
        y: clientY - previousPointerPosition.y
      }

      rotation.y += deltaMove.x * 0.002
      rotation.x += deltaMove.y * 0.002

      if (!hasDragged && (Math.abs(deltaMove.x) > 1 || Math.abs(deltaMove.y) > 1)) {
        hasDragged = true
      }

      rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.x))

      camera.position.copy(fixedPosition.current)

      const spherical = new THREE.Spherical()
      spherical.setFromVector3(targetPosition.current.clone().sub(fixedPosition.current))
      spherical.theta += rotation.y
      spherical.phi += rotation.x

      const newTarget = new THREE.Vector3()
      newTarget.setFromSpherical(spherical).add(fixedPosition.current)
      camera.lookAt(newTarget)

      previousPointerPosition = { x: clientX, y: clientY }
    }

    const endDrag = () => {
      if (!isDragging) return
      isDragging = false
      activePointerId = null

      if (hasDragged) {
        suppressClick = true
        setTimeout(() => { suppressClick = false }, 0)
      }
    }

    const handlePointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (!isWithinCanvas(event.clientX, event.clientY)) return

      if (event.pointerType !== 'mouse') {
        event.preventDefault()
      }
      startDrag(event.clientX, event.clientY, event.pointerId)
    }

    const handlePointerMove = (event) => {
      if (!isDragging) return
      if (activePointerId !== null && event.pointerId !== activePointerId) return
      if (event.pointerType !== 'mouse') {
        event.preventDefault()
      }
      updateDrag(event.clientX, event.clientY)
    }

    const handlePointerUp = (event) => {
      if (activePointerId !== null && event.pointerId !== activePointerId) return
      endDrag()
    }

    const handlePointerCancel = (event) => {
      if (activePointerId !== null && event.pointerId !== activePointerId) return
      isDragging = false
      activePointerId = null
    }

    const handleMouseDown = (event) => {
      if (event.button !== 0) return
      if (!isWithinCanvas(event.clientX, event.clientY)) return
      startDrag(event.clientX, event.clientY)
    }

    const handleMouseMove = (event) => {
      updateDrag(event.clientX, event.clientY)
    }

    const handleMouseUp = () => {
      endDrag()
    }

    const handleClickCapture = (event) => {
      if (!suppressClick) return
      suppressClick = false
      event.preventDefault()
      event.stopPropagation()
    }

    const supportsPointerEvents = typeof window !== 'undefined' && 'onpointerdown' in window

    if (supportsPointerEvents) {
      document.addEventListener('pointerdown', handlePointerDown)
      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
      document.addEventListener('pointercancel', handlePointerCancel)
    } else {
      document.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('click', handleClickCapture, true)

    return () => {
      if (supportsPointerEvents) {
        document.removeEventListener('pointerdown', handlePointerDown)
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
        document.removeEventListener('pointercancel', handlePointerCancel)
      } else {
        document.removeEventListener('mousedown', handleMouseDown)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
      document.removeEventListener('click', handleClickCapture, true)
      camera.position.set = originalSet
      gl.domElement.style.touchAction = previousTouchAction
      gl.domElement.style.userSelect = previousUserSelect
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

export default function AuctionHouse3D({
  aid,
  initialLiveData,
  initialChatMessages = [],
  currentUserId = null,
  pollingMs = 7000
}) {
  const { snapshot, isFetching, refresh } = useAuctionLive(aid, initialLiveData, pollingMs)
  const chatPollMs = Math.max(3000, pollingMs || 5000)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBidPanelOpen, setIsBidPanelOpen] = useState(false)
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)
  const [currentLot, setCurrentLot] = useState(() => buildLotFromSnapshot(initialLiveData))
  const [lotItems, setLotItems] = useState(initialLiveData?.items ?? [])
  const [bidAmount, setBidAmount] = useState('')
  const [bidFeedback, setBidFeedback] = useState(null)
  const [isBidding, setIsBidding] = useState(false)
  const [nowTs, setNowTs] = useState(() => Date.now())
  const {
    messages: chatMessages,
    isFetching: isChatFetching,
    setMessages: setChatMessages,
    refresh: refreshChat
  } = useAuctionChat(aid, initialChatMessages, { enabled: true, pollInterval: chatPollMs })
  const [chatInput, setChatInput] = useState('')
  const [chatFeedback, setChatFeedback] = useState(null)
  const [isSendingChat, setIsSendingChat] = useState(false)
  const chatMessagesEndRef = useRef(null)

  useEffect(() => {
    setCurrentLot(buildLotFromSnapshot(snapshot))
    setLotItems(snapshot?.items ?? [])
  }, [snapshot])

  useEffect(() => {
    if (!snapshot?.auction?.end_time) return undefined
    const endTime = new Date(snapshot.auction.end_time)
    const updateTicker = () => {
      setCurrentLot((prev) => ({
        ...prev,
        timeRemaining: formatTimeRemaining(endTime)
      }))
    }
    updateTicker()
    const id = window.setInterval(updateTicker, 1000)
    return () => window.clearInterval(id)
  }, [snapshot?.auction?.end_time])

useEffect(() => {
  if (!bidFeedback) return undefined
  const id = window.setTimeout(() => setBidFeedback(null), 3500)
  return () => window.clearTimeout(id)
}, [bidFeedback])

useEffect(() => {
  const id = window.setInterval(() => setNowTs(Date.now()), 1000)
  return () => window.clearInterval(id)
}, [])

useEffect(() => {
  if (isChatPanelOpen) {
    refreshChat()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isChatPanelOpen])

useEffect(() => {
  if (!chatFeedback) return undefined
  const id = window.setTimeout(() => setChatFeedback(null), 3000)
  return () => window.clearTimeout(id)
}, [chatFeedback])

useEffect(() => {
  if (chatMessagesEndRef.current) {
    chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }
}, [chatMessages])

  const handleBidSubmit = async () => {
    if (!aid || !currentLot.activeItem?.iid) return
    const parsedAmount = Number(bidAmount)
    const minimumRequired = currentLot.nextBidMinimum ?? currentLot.minBid ?? 0
    if (Number.isNaN(parsedAmount) || parsedAmount < minimumRequired) {
      setBidFeedback(`Enter at least $${minimumRequired.toFixed(2)}`)
      return
    }

    try {
      setIsBidding(true)
      await axiosBrowserClient.post(`/api/auctions/${aid}/bid`, {
        iid: currentLot.activeItem.iid,
        amount: parsedAmount
      })
      const nextRequired = parsedAmount + bidIncrementValue
      setCurrentLot((prev) => {
        if (!prev) {
          return prev
        }
        const updatedActiveItem = prev.activeItem
          ? {
              ...prev.activeItem,
              current_bid: {
                ...(prev.activeItem.current_bid ?? {}),
                current_price: parsedAmount
              }
            }
          : prev.activeItem
        return {
          ...prev,
          hasBid: true,
          currentBid: parsedAmount,
          displayPriceValue: parsedAmount,
          displayPriceLabel: 'Current Bid',
          nextBidMinimum: nextRequired,
          activeItem: updatedActiveItem
        }
      })
      setLotItems((prevItems) =>
        prevItems.map((item) =>
          item.iid === currentLot.activeItem?.iid
            ? {
                ...item,
                current_bid: {
                  ...(item.current_bid ?? {}),
                  current_price: parsedAmount
                }
              }
            : item
        )
      )
      setBidFeedback('Bid placed successfully')
      setBidAmount(nextRequired.toFixed(2))
      refresh?.()
    } catch (error) {
      setBidFeedback(error?.message ?? 'Unable to place bid')
    } finally {
      setIsBidding(false)
    }
  }

  const isLoading = !currentLot || !initialLiveData && !snapshot

  const handleChatSubmit = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault()
    }
    if (!aid || !chatInput.trim()) {
      return
    }
    try {
      setIsSendingChat(true)
      await axiosBrowserClient.post(`/api/auctions/${aid}/chat`, {
        message: chatInput.trim()
      })
      setChatInput('')
      setChatFeedback('Message sent')
      // Refresh to get the latest messages from server including the new one
      await refreshChat?.()
    } catch (error) {
      setChatFeedback(error?.message ?? 'Unable to send message')
    } finally {
      setIsSendingChat(false)
    }
  }

  const lotBidValue = useMemo(() => Number(currentLot.currentBid ?? 0), [currentLot.currentBid])
  const minBidValue = useMemo(() => Number(currentLot.minBid ?? 0), [currentLot.minBid])
  const bidIncrementValue = useMemo(
    () => (Number.isFinite(Number(currentLot.bidIncrement)) && Number(currentLot.bidIncrement) > 0 ? Number(currentLot.bidIncrement) : 0.01),
    [currentLot.bidIncrement]
  )
  const nextBidMinimum = useMemo(() => {
    return lotBidValue + bidIncrementValue
  }, [lotBidValue, bidIncrementValue])
  const modalLotData = useMemo(() => buildScreenLot(currentLot, currentLot.nextItem), [currentLot, currentLot.nextItem])
  const auctionStart = useMemo(
    () => (currentLot.auctionStartsAt ? new Date(currentLot.auctionStartsAt) : null),
    [currentLot.auctionStartsAt]
  )
  const auctionEnd = useMemo(
    () => (currentLot.auctionEndsAt ? new Date(currentLot.auctionEndsAt) : null),
    [currentLot.auctionEndsAt]
  )
  const isBeforeStart = auctionStart ? nowTs < auctionStart.getTime() : false
  const isAfterEnd = auctionEnd ? nowTs > auctionEnd.getTime() : false
  const chatParticipantCount = chatMessages.length

  useEffect(() => {
    if (!isBidPanelOpen) return undefined
    if (!bidAmount) {
      setBidAmount(nextBidMinimum.toFixed(2))
    }
    return undefined
  }, [isBidPanelOpen, nextBidMinimum, bidAmount])

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

  if (isBeforeStart) {
    return (
      <div className="w-full h-screen bg-[var(--custom-bg-primary)] flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="space-y-4 max-w-xl">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--custom-bright-blue)]">Auction Preview</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--custom-text-primary)]">Auction starting soon</h1>
          <p className="text-[var(--custom-text-secondary)]">
            The house opens at{' '}
            {auctionStart?.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.{" "}
            Grab a seat and check back shortly.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--custom-border-color)] px-5 py-3 text-sm font-semibold text-[var(--custom-text-primary)] hover:bg-[var(--custom-bg-secondary)] transition"
        >
          Return Home
        </Link>
      </div>
    )
  }

  if (isAfterEnd) {
    return (
      <div className="w-full h-screen bg-[var(--custom-bg-primary)] flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="space-y-4 max-w-xl">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--custom-bright-blue)]">Auction Closed</p>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--custom-text-primary)]">This auction has ended</h1>
          <p className="text-[var(--custom-text-secondary)]">
            This auction has ended, feel free to explore other auctions.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--custom-border-color)] px-5 py-3 text-sm font-semibold text-[var(--custom-text-primary)] hover:bg-[var(--custom-bg-secondary)] transition"
        >
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen, currentLot, items: lotItems, nextItem: currentLot.nextItem }}>
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
                <div className={`w-3 h-3 ${isFetching ? 'bg-yellow-400 animate-ping' : 'bg-green-500 animate-pulse'} rounded-full`}></div>
                <span className="text-sm font-medium uppercase tracking-wide">Live Auction</span>
              </div>
              <p className="text-[var(--custom-text-muted)] text-xs mt-1">
                Time remaining: {currentLot.timeRemaining}
              </p>
              <p className="text-[var(--custom-text-muted)] text-xs">
                {currentLot.auctionName || 'Live Lot'} · {currentLot.bidders} active bidders
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
                  <div className="bg-[var(--custom-bg-secondary)] p-3 md:p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[var(--custom-text-muted)] text-xs md:text-sm uppercase tracking-wide">Current Bid</p>
                        <p className="text-xl md:text-2xl font-bold text-[var(--custom-cream-yellow)]">${lotBidValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[var(--custom-text-muted)] text-xs md:text-sm uppercase tracking-wide">Min Increment</p>
                        <p className="text-lg font-semibold text-[var(--custom-bright-blue)]">${bidIncrementValue.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bid Input */}
                  <div>
                    <label className="text-xs md:text-sm text-[var(--custom-text-secondary)] mb-2 block">
                      Your Bid Amount
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step={bidIncrementValue}
                      min={nextBidMinimum}
                      value={bidAmount}
                      onChange={(event) => setBidAmount(event.target.value)}
                      placeholder={`Min: $${nextBidMinimum.toFixed(2)}`}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-[var(--custom-bg-secondary)] border border-[var(--custom-border-color)] rounded-lg text-[var(--custom-text-primary)] text-sm md:text-base focus:outline-none focus:border-[var(--custom-bright-blue)]"
                    />
                    <p className="mt-2 text-[11px] md:text-xs text-[var(--custom-text-muted)]">
                      Enter in increments of ${bidIncrementValue.toFixed(2)}.
                    </p>
                  </div>

                  {/* Place Bid Button */}
                  <button
                    onClick={handleBidSubmit}
                    disabled={isBidding}
                    className="w-full py-3 md:py-4 bg-[var(--custom-accent-red)] hover:bg-[#8b1f22] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-sm md:text-base"
                  >
                    {isBidding ? 'Submitting...' : 'Place Bid'}
                  </button>
                  {bidFeedback && (
                    <p className="text-xs md:text-sm text-[var(--custom-cream-yellow)]">{bidFeedback}</p>
                  )}
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
                      {chatParticipantCount} messages • {isChatFetching ? 'Updating…' : 'Live'}
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
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-[var(--custom-text-muted)] italic text-center">No messages yet. Start the conversation!</p>
                  )}
                  {chatMessages.map((chat) => {
                    const isOwn = currentUserId && chat.uid === currentUserId
                    const avatarUrl = resolveAvatarUrl(chat.sender)
                    return (
                      <div
                        key={chat.chat_id ?? `${chat.sent_at}-${chat.uid}`}
                        className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className="flex-shrink-0">
                          <Image
                            src={avatarUrl}
                            alt={chat.sender?.username ?? 'Guest avatar'}
                            className="h-7 w-7 rounded-full object-cover border border-[var(--custom-border-color)]"
                            width={28}
                            height={28}
                          />
                        </div>
                        <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-3 py-2 shadow-sm ${
                              isOwn
                                ? 'bg-[var(--custom-bright-blue)] text-white rounded-br-md'
                                : 'bg-[var(--custom-bg-secondary)] text-[var(--custom-text-primary)] border border-[var(--custom-border-color)] rounded-bl-md'
                            }`}
                          >
                            <p className="text-[10px] font-semibold mb-0.5 opacity-90">
                              {chat.sender?.username ?? 'Guest'}
                            </p>
                            <p className="text-sm break-words leading-relaxed">
                              {chat.message}
                            </p>
                          </div>
                          <span className={`text-[9px] text-[var(--custom-text-muted)] mt-0.5 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {formatChatTimestamp(chat.sent_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 md:p-4 border-t border-[var(--custom-border-color)]">
                  <form className="flex gap-2" onSubmit={handleChatSubmit}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-2 md:px-3 py-2 bg-[var(--custom-bg-secondary)] border border-[var(--custom-border-color)] rounded-lg text-xs md:text-sm text-[var(--custom-text-primary)] focus:outline-none focus:border-[var(--custom-bright-blue)]"
                    />
                    <button
                      type="submit"
                      disabled={isSendingChat || !chatInput.trim()}
                      className="px-3 md:px-4 py-2 bg-[var(--custom-bright-blue)] hover:bg-[var(--custom-ocean-blue)] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all text-xs md:text-sm"
                    >
                      {isSendingChat ? 'Sending…' : 'Send'}
                    </button>
                  </form>
                  {chatFeedback && (
                    <p className="mt-2 text-[11px] md:text-xs text-[var(--custom-cream-yellow)]">{chatFeedback}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Fullscreen Modal - Outside Canvas */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(0,0,0,0.85)] p-4 md:p-8"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <AuctionScreenCard lotData={modalLotData} variant="modal" onClose={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
    </ModalContext.Provider>
  )
}















