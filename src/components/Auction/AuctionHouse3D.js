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
// replaced axiosBrowserClient with fetch
import { buildStoragePublicUrl } from '@/utils/storage'
import { supabaseBrowser } from '@/utils/supabase/client'
import { ChatBubbleLeftIcon } from '@heroicons/react/24/solid'

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

const buildGuestPresenceId = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return `guest-${globalThis.crypto.randomUUID()}`
  }
  return `guest-${Math.random().toString(36).slice(2, 10)}`
}

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
      auctionStartsAt: null,
      itemTimerSeconds: null,
      itemTimerStartedAt: null
    }
  }
  const auction = snapshot.auction ?? {}
  const items = snapshot.items ?? []
  const active = snapshot.activeItem ?? null
  const next = snapshot.nextItem ?? null
  const ownerId = auction.oid ?? null
  const bidderIds = new Set()
  items.forEach((item) => {
    const bidderId = item.current_bid?.uid
    if (bidderId && bidderId !== ownerId) {
      bidderIds.add(bidderId)
    }
  })
  const bidderCount = bidderIds.size
  const unsoldItems = items.filter((item) => item.sold !== true)
  const auctionComplete = unsoldItems.length === 0 && !active

  if (auctionComplete) {
    return {
      id: null,
      name: 'No items left',
      status: 'completed',
      awaitingMessage: null,
      previewItem: null,
      currentBid: 0,
      timeRemaining: 'Auction closed',
      bidders: 0,
      activeItem: null,
      nextItem: null,
      auctionName: auction.name ?? '',
      imageUrl: null,
      minBid: 0,
      bidIncrement: 0,
      nextBidMinimum: 0,
      hasBid: false,
      auctionEndsAt: auction.end_time ?? null,
      auctionStartsAt: auction.start_time ?? null,
      itemTimerSeconds: null,
      itemTimerStartedAt: null,
      hasNextLot: false
    }
  }

  const awaitingStart = !active
  const primaryUpcoming = awaitingStart ? unsoldItems[0] ?? null : active
  const remainingAfterActive = awaitingStart
    ? unsoldItems.slice(1)
    : unsoldItems.filter((item) => item.iid !== active?.iid)
  const secondaryUpcoming = awaitingStart
    ? remainingAfterActive[0] ?? null
    : next ?? remainingAfterActive[0] ?? null
  const hasNextLot = awaitingStart ? Boolean(secondaryUpcoming) : remainingAfterActive.length > 0
  const displayItem = primaryUpcoming ?? active ?? null
  const activeBid = awaitingStart ? null : active?.current_bid ?? null
  const endDate = auction.end_time ? new Date(auction.end_time) : null
  const minBid = Number(displayItem?.min_bid ?? 0)
  const bidIncrement = Number.isFinite(Number(displayItem?.bid_increment)) && Number(displayItem?.bid_increment) > 0
    ? Number(displayItem?.bid_increment)
    : 0.01
  const currentBidValue = awaitingStart
    ? Number(displayItem?.min_bid ?? 0)
    : Number(activeBid?.current_price ?? displayItem?.min_bid ?? 0)
  const nextBidMinimum = currentBidValue + bidIncrement

  // Get item timer data from auction
  const itemTimerStartedAt = auction.timer_started_at ? new Date(auction.timer_started_at) : null
  const itemTimerDuration = auction.timer_duration_seconds ?? null
  const awaitingStartMessage = 'Please stay seated - the auctioneer will open the first lot shortly.'

  return {
    id: awaitingStart ? null : active?.iid ?? null,
    name: awaitingStart ? awaitingStartMessage : active?.title ?? 'Upcoming Lot',
    status: awaitingStart ? 'awaiting_start' : 'active',
    awaitingMessage: awaitingStart ? awaitingStartMessage : null,
    previewItem: awaitingStart ? primaryUpcoming : null,
    currentBid: awaitingStart ? Number(primaryUpcoming?.min_bid ?? 0) : activeBid?.current_price ?? minBid,
    timeRemaining: awaitingStart ? 'Awaiting host' : formatTimeRemaining(endDate),
    bidders: awaitingStart ? 0 : bidderCount,
    activeItem: active,
    nextItem: secondaryUpcoming,
    auctionName: auction.name ?? '',
    imageUrl: displayItem?.imageUrl ?? null,
    minBid,
    bidIncrement,
    nextBidMinimum,
    hasBid: awaitingStart ? false : Boolean(activeBid),
    auctionEndsAt: auction.end_time ?? null,
    auctionStartsAt: auction.start_time ?? null,
    itemTimerSeconds: awaitingStart ? null : itemTimerDuration,
    itemTimerStartedAt: awaitingStart ? null : itemTimerStartedAt,
    hasNextLot
  }
}

const TIER_CONFIG = [
  { name: 'orchestra', y: -3, z: 5, rows: 8, seatsPerRow: 16, platformHeight: 0.5 },
  { name: 'mezzanine', y: 0, z: 15, rows: 6, seatsPerRow: 14, platformHeight: 0.8 },
  { name: 'balcony', y: 4, z: 23, rows: 4, seatsPerRow: 12, platformHeight: 1.0 }
]

const SEAT_COLOR_BY_TIER = ['#4D067B', '#7209B7', '#B984DB']
const OCCUPANT_PALETTE = ['#F8E2D4', '#E2BD6B', '#B984DB', '#F8E2D4', '#7209B7', '#B984DB']
const ACCENT_PALETTE = ['#4D067B', '#7209B7', '#4D067B', '#7209B7', '#4D067B']
function ConfettiParticle({ position, velocity, color, startTime }) {
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
}

function ConfettiExplosion({ triggerTime, position = [0, 6, -4] }) {
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    if (!triggerTime) return

    // Create extravagant confetti burst - 300 pieces!
    const pieces = []
    const colors = ['#E2BD6B', '#F8E2D4', '#B984DB', '#7209B7', '#E2BD6B', '#F8E2D4', '#B984DB', '#7209B7', '#FFFFFF']

    for (let i = 0; i < 300; i++) {
      const angle = (Math.random() * Math.PI * 2)
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

function AuctioneerSpeechBubble({ message, visible }) {
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
          color="#F8E2D4"
          transparent
          opacity={opacity}
          roughness={0.2}
          metalness={0.1}
        />
      </RoundedBox>

      {/* Speech bubble border - thicker gold border */}
      <RoundedBox args={[9.3, 3.3, 0.12]} radius={0.32} position={[0, 0, -0.08]}>
        <meshStandardMaterial
          color="#E2BD6B"
          transparent
          opacity={opacity}
          roughness={0.1}
          metalness={0.8}
          emissive="#E2BD6B"
          emissiveIntensity={0.4}
        />
      </RoundedBox>

      {/* Speech bubble tail pointing to auctioneer - positioned on the right side now */}
      <group position={[4, -1, 0]}>
        <Box args={[0.8, 0.8, 0.12]} rotation={[0, 0, Math.PI / 4]}>
          <meshStandardMaterial
            color="#F8E2D4"
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
            color: '#4D067B',
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

function GrandStage({ confettiTrigger, bidAnnouncement }) {
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
            color={new THREE.Color('#0a0414')}
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
            color={new THREE.Color('#7209B7')}
            roughness={0.2}
            metalness={0.7}
            emissive={new THREE.Color('#7209B7')}
            emissiveIntensity={0.5}
          />
        </Torus>

        {/* Gold Crown */}
        <Box ref={neonCrownRef} args={[6, 1.5, 0.3]} position={[0, 8, 0.2]}>
          <meshStandardMaterial
            color={new THREE.Color('#E2BD6B')}
            roughness={0.1}
            metalness={0.9}
            emissive={new THREE.Color('#E2BD6B')}
            emissiveIntensity={0.4}
          />
        </Box>

        {/* Gold accent strips on arch */}
        {[-1, 1].map((side) => (
          <Box key={side} args={[0.3, 1, 18]} position={[side * 9.5, 0, 0.3]} rotation={[0, 0, side * 0.1]}>
            <meshStandardMaterial
              color="#E2BD6B"
              roughness={0.2}
              metalness={0.8}
              emissive="#E2BD6B"
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
            color="#E2BD6B"
            metalness={0.8}
            roughness={0.2}
            emissive="#E2BD6B"
            emissiveIntensity={0.3}
          />
        </RoundedBox>

        {/* Purple inner frame accent */}
        <RoundedBox args={[13.4, 6.6, 0.08]} radius={0.18} position={[0, 0, -0.08]}>
          <meshStandardMaterial
            color="#4D067B"
            metalness={0.5}
            roughness={0.3}
            emissive="#7209B7"
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
            color="#4D067B"
            roughness={0.3}
            metalness={0.5}
            emissive="#7209B7"
            emissiveIntensity={0.1}
          />
        </Cylinder>

        {/* Gold Podium Top */}
        <Cylinder args={[1.8, 1.8, 0.2, 8]} position={[0, 1.6, 0]}>
          <meshStandardMaterial
            color="#E2BD6B"
            roughness={0.1}
            metalness={0.9}
            emissive="#E2BD6B"
            emissiveIntensity={0.2}
          />
        </Cylinder>

        {/* Gold accent ring */}
        <Torus args={[1.6, 0.1, 8, 32]} position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color="#E2BD6B"
            roughness={0.2}
            metalness={0.8}
            emissive="#E2BD6B"
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
            color="#4D067B"
            roughness={0.7}
            side={THREE.DoubleSide}
            emissive="#7209B7"
            emissiveIntensity={0.1}
          />
        </Plane>

        {/* Right Curtain */}
        <Plane args={[3, 15]} position={[11, 3, -2]} rotation={[0, -0.2, 0]}>
          <meshStandardMaterial
            color="#4D067B"
            roughness={0.7}
            side={THREE.DoubleSide}
            emissive="#7209B7"
            emissiveIntensity={0.1}
          />
        </Plane>
      </group>

      {/* Disco Ball Above Stage */}
      <group ref={discoBallRef} position={[0, 12, -2]}>
        <Sphere args={[1.5, 16, 16]}>
          <meshStandardMaterial
            color="#7209B7"
            metalness={0.95}
            roughness={0.05}
            emissive="#7209B7"
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
                color="#7209B7"
                metalness={0.8}
                roughness={0.1}
                emissive="#7209B7"
                emissiveIntensity={1.2}
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
      {/* Club Floor with Neon Pattern */}
      <group>
        <Plane
          args={[120, 120]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -4, 5]}
        >
          <meshStandardMaterial
            color="#0a0414"
            roughness={0.3}
            metalness={0.4}
          />
        </Plane>

        {/* Neon Floor Pattern Rings */}
        {[15, 25, 35, 45].map((radius, i) => (
          <Ring
            key={i}
            args={[radius - 0.2, radius + 0.2, 64]}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -3.98, 5]}
          >
            <meshStandardMaterial
              color="#7209B7"
              roughness={0.1}
              metalness={0.6}
              emissive="#7209B7"
              emissiveIntensity={0.3 + i * 0.1}
            />
          </Ring>
        ))}

        {/* Center Neon Medallion */}
        <Cylinder
          args={[8, 8, 0.1]}
          rotation={[0, 0, 0]}
          position={[0, -3.95, 5]}
        >
          <meshStandardMaterial
            color="#7209B7"
            roughness={0.1}
            metalness={0.7}
            emissive="#7209B7"
            emissiveIntensity={0.5}
          />
        </Cylinder>
      </group>

      {/* Dark Club Ceiling */}
      <Plane
        args={[120, 120]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 30, 5]}
      >
        <meshStandardMaterial
          color="#000000"
          roughness={0.9}
          metalness={0.05}
        />
      </Plane>

      {/* Club Side Walls with Neon Accents */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Main Wall */}
          <Plane
            args={[120, 35]}
            rotation={[0, Math.PI / 2 * side, 0]}
            position={[60 * side, 12.5, 5]}
          >
            <meshStandardMaterial
              color="#0d0518"
              roughness={0.7}
              metalness={0.2}
            />
          </Plane>

          {/* Neon Columns - Better Positioned */}
          {[-30, -10, 10, 30, 50].map((z) => (
            <group key={z}>
              <Cylinder
                args={[1.2, 1, 25]}
                position={[58 * side, 12.5, z + 5]}
              >
                <meshStandardMaterial
                  color="#4D067B"
                  roughness={0.3}
                  metalness={0.4}
                  emissive="#7209B7"
                  emissiveIntensity={0.2}
                />
              </Cylinder>
              {/* Gold Column Capital */}
              <Cylinder
                args={[1.8, 1.2, 2]}
                position={[58 * side, 24, z + 5]}
              >
                <meshStandardMaterial
                  color="#E2BD6B"
                  roughness={0.1}
                  metalness={0.9}
                  emissive="#E2BD6B"
                  emissiveIntensity={0.3}
                />
              </Cylinder>
            </group>
          ))}

          {/* Neon Wall Strips - Better Spaced */}
          {[-20, 0, 20, 40].map((z) => (
            <Box
              key={z}
              args={[0.3, 20, 12]}
              position={[59.5 * side, 10, z + 5]}
            >
              <meshStandardMaterial
                color="#7209B7"
                roughness={0.2}
                metalness={0.6}
                emissive="#7209B7"
                emissiveIntensity={0.4}
              />
            </Box>
          ))}
        </group>
      ))}

      {/* Rear Wall with Club Entrance */}
      <group position={[0, 12.5, 65]}>
        <Plane args={[120, 35]}>
          <meshStandardMaterial
            color="#0d0518"
            roughness={0.7}
            metalness={0.2}
          />
        </Plane>

        {/* Neon Entrance Arch */}
        <Torus
          args={[8, 1.5, 16, 32]}
          position={[0, -5, -0.5]}
        >
          <meshStandardMaterial
            color="#7209B7"
            roughness={0.1}
            metalness={0.8}
            emissive="#7209B7"
            emissiveIntensity={0.6}
          />
        </Torus>

        {/* Club Entrance Doors */}
        <Box args={[12, 18, 0.5]} position={[0, -8, -0.3]}>
          <meshStandardMaterial
            color="#4D067B"
            roughness={0.3}
            metalness={0.5}
            emissive="#7209B7"
            emissiveIntensity={0.2}
          />
        </Box>
      </group>

      {/* Front Wall Behind Stage */}
      <group position={[0, 12.5, -30]}>
        <Plane args={[120, 35]}>
          <meshStandardMaterial
            color="#0d0518"
            roughness={0.7}
            metalness={0.2}
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

function LightBeam({ position, targetPosition, color = "#7209B7", opacity = 0.12 }) {
  const beamRef = useRef()

  useFrame(() => {
    if (!beamRef.current || !targetPosition) return

    // Calculate direction and distance
    const start = new THREE.Vector3(...position)
    const end = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y,
      targetPosition.z
    )
    const direction = new THREE.Vector3().subVectors(end, start)
    const distance = direction.length()

    // Position beam in the middle
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    beamRef.current.position.copy(midpoint)

    // Orient beam to point at target
    beamRef.current.lookAt(end)
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

function MovingSpotlights() {
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
              color="#7209B7"
              distance={50}
              decay={1.8}
            />
            <primitive object={targetRefs.current[i]} />

            {/* Visible light beam - wider and more subtle */}
            <LightBeam
              position={pos}
              targetPosition={targetPositions[i]}
              color="#7209B7"
              opacity={0.12}
            />

            {/* Spotlight housing */}
            <group position={pos}>
              <Cylinder args={[0.4, 0.3, 0.6, 8]}>
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
              </Cylinder>
            </group>
          </group>
        )
      })}
    </group>
  )
}

function DiscoLights() {
  const [flashStates, setFlashStates] = useState(Array(12).fill(1))

  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Random flashing effect - each light has a chance to flash
    setFlashStates(prev => prev.map((_, i) => {
      const base = Math.sin(time * 2 + i) * 0.5 + 0.5
      const random = Math.random() > 0.85 ? Math.random() * 2 : 1
      return base * random
    }))
  })

  const positions = [
    [-20, 15, -10], [20, 15, -10],
    [-15, 18, 0], [15, 18, 0],
    [-25, 16, 10], [25, 16, 10],
    [-18, 17, 20], [18, 17, 20],
    [-22, 15, 30], [22, 15, 30],
    [0, 20, -5], [0, 20, 15]
  ]

  return (
    <>
      {positions.map((pos, i) => (
        <spotLight
          key={i}
          position={pos}
          angle={0.4}
          penumbra={0.5}
          intensity={flashStates[i] * 3}
          color="#7209B7"
          distance={30}
          decay={2}
        />
      ))}
    </>
  )
}

function TheatreLighting() {
  const lightRef = useRef()

  return (
    <>
      {/* Club ambient lighting */}
      <ambientLight intensity={0.1} color="#4D067B" />

      {/* Main stage neon purple spotlight */}
      <spotLight
        position={[0, 20, -8]}
        angle={0.6}
        penumbra={0.4}
        intensity={3}
        color="#7209B7"
        target-position={[0, 2, -15]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Side stage neon lights */}
      <spotLight
        position={[-8, 15, -10]}
        angle={0.5}
        penumbra={0.6}
        intensity={2.5}
        color="#B984DB"
        target-position={[0, 4, -15]}
      />
      <spotLight
        position={[8, 15, -10]}
        angle={0.5}
        penumbra={0.6}
        intensity={2.5}
        color="#B984DB"
        target-position={[0, 4, -15]}
      />

      {/* Auctioneer purple spotlight */}
      <spotLight
        ref={lightRef}
        position={[0, 12, -12]}
        angle={0.3}
        penumbra={0.3}
        intensity={2}
        color="#7209B7"
        target-position={[0, 2, -15]}
      />

      {/* Disco ball illumination */}
      <pointLight
        position={[0, 12, -2]}
        intensity={2}
        color="#7209B7"
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
            color="#7209B7"
            distance={25}
          />
        )
      })}

      {/* Screen neon glow effect */}
      <pointLight
        position={[0, 4, -14]}
        intensity={1.2}
        color="#7209B7"
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
            color="#7209B7"
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
            color="#7209B7"
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

export default function AuctionHouse3D({
  aid,
  initialLiveData,
  initialChatMessages = [],
  currentUserId = null,
  pollingMs = 7000 // Deprecated - keeping for backwards compatibility
}) {
  const { snapshot, isFetching, refresh } = useAuctionLive(aid, initialLiveData)
  const ownerId = snapshot?.auction?.oid ?? null
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBidPanelOpen, setIsBidPanelOpen] = useState(false)
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false)
  const [currentLot, setCurrentLot] = useState(() => buildLotFromSnapshot(initialLiveData))
  const [lotItems, setLotItems] = useState(initialLiveData?.items ?? [])
  const [bidAmount, setBidAmount] = useState('')
  const [bidFeedback, setBidFeedback] = useState(null)
  const [bidValidationError, setBidValidationError] = useState(null)
  const [isBidding, setIsBidding] = useState(false)
  const [nowTs, setNowTs] = useState(() => Date.now())
  const {
    messages: chatMessages,
    isFetching: isChatFetching,
    setMessages: setChatMessages,
    refresh: refreshChat
  } = useAuctionChat(aid, initialChatMessages, { enabled: true })
  const [chatInput, setChatInput] = useState('')
  const [chatFeedback, setChatFeedback] = useState(null)
  const [isSendingChat, setIsSendingChat] = useState(false)
  const chatMessagesEndRef = useRef(null)
  const [confettiTrigger, setConfettiTrigger] = useState(null)
  const [bidAnnouncement, setBidAnnouncement] = useState(null)
  const [isMusicMuted, setIsMusicMuted] = useState(false)
  const [musicVolume, setMusicVolume] = useState(0.3)
  const audioRef = useRef(null)
  const hasUnlockedAudioRef = useRef(false)
  const [itemTimerSeconds, setItemTimerSeconds] = useState(null)
  const [bidConfirmModal, setBidConfirmModal] = useState(null) // { amount, onConfirm, onCancel }
  const [participantCount, setParticipantCount] = useState(0)
  const presenceChannelRef = useRef(null)
  const ownerIdRef = useRef(initialLiveData?.auction?.oid ?? null)
  const guestPresenceIdRef = useRef(null)
  const participantCountRef = useRef(0)

  useEffect(() => {
    console.log('🎯 AuctionHouse3D: Snapshot changed, rebuilding lot', {
      activeItemId: snapshot?.activeItem?.iid,
      activeItemTitle: snapshot?.activeItem?.title
    })
    const newLot = buildLotFromSnapshot(snapshot)
    setCurrentLot({
      ...newLot,
      bidders: participantCountRef.current
    })
    setLotItems(snapshot?.items ?? [])
    console.log('🎯 AuctionHouse3D: New lot built', {
      newLotId: newLot?.id,
      newLotName: newLot?.name
    })
  }, [snapshot])

  useEffect(() => {
    ownerIdRef.current = snapshot?.auction?.oid ?? null
  }, [snapshot?.auction?.oid])

  useEffect(() => {
    participantCountRef.current = participantCount
  }, [participantCount])

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

  // Item timer countdown calculation
  useEffect(() => {
    if (!currentLot.itemTimerStartedAt || !currentLot.itemTimerSeconds) {
      setItemTimerSeconds(null)
      return
    }

    const updateItemTimer = () => {
      const startedAt = currentLot.itemTimerStartedAt
      const duration = currentLot.itemTimerSeconds
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      const remaining = Math.max(0, duration - elapsed)
      setItemTimerSeconds(remaining)
    }

    updateItemTimer()
    const intervalId = setInterval(updateItemTimer, 1000)
    return () => clearInterval(intervalId)
  }, [currentLot.itemTimerStartedAt, currentLot.itemTimerSeconds])

  useEffect(() => {
    if (!aid) return undefined

    const supabase = supabaseBrowser()
    const presenceKey =
      currentUserId ?? guestPresenceIdRef.current ?? buildGuestPresenceId()

    if (!guestPresenceIdRef.current) {
      guestPresenceIdRef.current = presenceKey
    } else if (currentUserId && guestPresenceIdRef.current !== currentUserId) {
      guestPresenceIdRef.current = currentUserId
    }

    const channel = supabase.channel(`auction-presence:${aid}`, {
      config: {
        presence: {
          key: guestPresenceIdRef.current
        }
      }
    })

    const updateParticipantCount = () => {
      const state = channel.presenceState()
      const allParticipants = Object.values(state).flat()
      const uniqueIds = new Set()

      allParticipants.forEach((entry) => {
        const participantId =
          entry?.userId ?? entry?.id ?? entry?.presenceKey ?? entry?.presence_key ?? null
        if (participantId) {
          uniqueIds.add(participantId)
        }
      })

      const ownerId = ownerIdRef.current
      if (ownerId) {
        uniqueIds.delete(ownerId)
      }

      setParticipantCount(uniqueIds.size)
    }

    channel
      .on('presence', { event: 'sync' }, updateParticipantCount)
      .on('presence', { event: 'join' }, updateParticipantCount)
      .on('presence', { event: 'leave' }, updateParticipantCount)

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          userId: guestPresenceIdRef.current,
          joinedAt: new Date().toISOString()
        })
        updateParticipantCount()
      }
    })

    presenceChannelRef.current = channel

    return () => {
      setParticipantCount(0)
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current)
        presenceChannelRef.current = null
      }
    }
  }, [aid, currentUserId])

  useEffect(() => {
    setCurrentLot((prev) => {
      if (!prev) return prev
      if (prev.bidders === participantCount) {
        return prev
      }
      return {
        ...prev,
        bidders: participantCount
      }
    })
  }, [participantCount])

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
  if (!bidValidationError) return undefined
  const id = window.setTimeout(() => setBidValidationError(null), 4000)
  return () => window.clearTimeout(id)
}, [bidValidationError])

useEffect(() => {
  if (chatMessagesEndRef.current) {
    chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }
}, [chatMessages])

useEffect(() => {
  if (audioRef.current) {
    if (isMusicMuted) {
      audioRef.current.volume = 0
    } else {
      audioRef.current.volume = musicVolume
    }
  }
}, [isMusicMuted, musicVolume])

useEffect(() => {
  // Auto-play music when component mounts
  const playMusic = async () => {
    if (!audioRef.current) return
    try {
      await audioRef.current.play()
      hasUnlockedAudioRef.current = true
    } catch (error) {
      console.log('Autoplay prevented:', error)
      // Autoplay might be blocked by browser, user will need to interact first
    }
  }
  playMusic()
}, [])

useEffect(() => {
  if (hasUnlockedAudioRef.current) return undefined

  const cleanup = () => {
    window.removeEventListener('pointerdown', handleUserInteraction)
    window.removeEventListener('keydown', handleUserInteraction)
    window.removeEventListener('touchstart', handleUserInteraction)
  }

  const attemptUnlock = async () => {
    if (!audioRef.current) return
    try {
      await audioRef.current.play()
      hasUnlockedAudioRef.current = true
      cleanup()
    } catch (error) {
      console.log('Playback still locked, waiting for another interaction.', error)
    }
  }

  function handleUserInteraction() {
    if (hasUnlockedAudioRef.current) {
      cleanup()
      return
    }
    attemptUnlock()
  }

  window.addEventListener('pointerdown', handleUserInteraction, { once: false })
  window.addEventListener('keydown', handleUserInteraction, { once: false })
  window.addEventListener('touchstart', handleUserInteraction, { once: false })

  return () => {
    cleanup()
  }
}, [])

  const handleBidSubmit = async () => {
    if (!aid || !currentLot.activeItem?.iid) return

    // Clear previous validation error
    setBidValidationError(null)

    const parsedAmount = Number(bidAmount)
    const minimumRequired = currentLot.nextBidMinimum ?? currentLot.minBid ?? 0

    // Validation: Check if it's a valid number
    if (Number.isNaN(parsedAmount) || bidAmount.trim() === '') {
      setBidValidationError('Please enter a valid number')
      return
    }

    // Validation: Check if it meets minimum requirement
    if (parsedAmount < minimumRequired) {
      setBidValidationError(`Bid must be at least $${minimumRequired.toFixed(2)}`)
      return
    }

    // Show confirmation modal
    return new Promise((resolve) => {
      setBidConfirmModal({
        amount: parsedAmount,
        itemName: currentLot.name,
        onConfirm: async () => {
          setBidConfirmModal(null)
          await placeBidInternal(parsedAmount)
          resolve()
        },
        onCancel: () => {
          setBidConfirmModal(null)
          resolve()
        }
      })
    })
  }

  const placeBidInternal = async (parsedAmount) => {
    try {
      setIsBidding(true)
      await fetch(`${window.location.origin}/api/auctions/${aid}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iid: currentLot.activeItem.iid, amount: parsedAmount })
      }).then(async (r) => { if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error || 'Unable to place bid'); } });
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
      setBidValidationError(null) // Clear any validation errors
      setConfettiTrigger(Date.now()) // Trigger confetti explosion
      setBidAnnouncement({
        message: `The bid for ${currentLot.name} has increased to $${parsedAmount.toLocaleString()}!!`,
        timestamp: Date.now()
      })
      setBidAmount('') // Clear the input so user can enter fresh
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
      await fetch(`${window.location.origin}/api/auctions/${aid}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput.trim() })
      }).then(async (r) => { if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error || 'Unable to send message'); } });
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
  const modalLotData = useMemo(() => buildScreenLot(currentLot, currentLot.nextItem, itemTimerSeconds), [currentLot, itemTimerSeconds])
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

  // Clear validation error when bid panel opens
  useEffect(() => {
    if (isBidPanelOpen) {
      setBidValidationError(null)
      setBidFeedback(null)
    }
  }, [isBidPanelOpen])

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#7209B7] border-t-transparent mx-auto mb-4 shadow-[0_0_30px_rgba(176,38,255,0.6)]"></div>
          <p className="text-white text-lg">Loading Auction House...</p>
        </div>
      </div>
    )
  }

  if (isBeforeStart) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="space-y-4 max-w-xl">
          <p className="text-xs uppercase tracking-[0.32em] text-[#7209B7] animate-pulse">Auction Preview</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Auction starting soon</h1>
          <p className="text-purple-200">
            The house opens at{' '}
            {auctionStart?.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.{" "}
            Grab a seat and check back shortly.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[#7209B7]/50 px-5 py-3 text-sm font-semibold text-white hover:bg-[#7209B7]/20 transition shadow-[0_0_20px_rgba(176,38,255,0.3)]"
        >
          Return Home
        </Link>
      </div>
    )
  }

  if (isAfterEnd) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="space-y-4 max-w-xl">
          <p className="text-xs uppercase tracking-[0.32em] text-[#7209B7]">Auction Closed</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">This auction has ended</h1>
          <p className="text-purple-200">
            This auction has ended, feel free to explore other auctions.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[#7209B7]/50 px-5 py-3 text-sm font-semibold text-white hover:bg-[#7209B7]/20 transition shadow-[0_0_20px_rgba(176,38,255,0.3)]"
        >
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen, currentLot, items: lotItems, nextItem: currentLot.nextItem, itemTimerSeconds }}>
      <div className="w-full h-screen bg-black relative">
        {/* Background Music */}
        <audio ref={audioRef} loop autoPlay>
          <source src="/auction_music.mp3" type="audio/mpeg" />
        </audio>

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
              background: '#000000'
            }}
          >
            <Suspense fallback={null}>
              <TheatreLighting />
              <GrandTheatre />
              <GrandStage confettiTrigger={confettiTrigger} bidAnnouncement={bidAnnouncement} />
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
              <button className="bg-black/70 hover:bg-[#7209B7]/30 text-white px-6 py-3 rounded-xl border border-[#7209B7]/40 backdrop-blur-sm font-semibold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(176,38,255,0.3)]">
                <span>←</span> Home
              </button>
            </Link>
          </div>

          {/* Status Bar - Top Right */}
          <div className="absolute top-6 right-6 text-white z-10 flex flex-col gap-3">
            <div className="bg-black/70 p-4 rounded-xl border border-[#7209B7]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)]">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 ${isFetching ? 'bg-[#7209B7] animate-ping' : 'bg-[#7209B7] animate-pulse'} rounded-full`}></div>
                <span className="text-sm font-medium uppercase tracking-wide text-[#7209B7]">Live Auction</span>
              </div>
              <div className="space-y-1">
                <p className="text-purple-200 text-xs">
                  Auction ends: {currentLot.timeRemaining}
                </p>
                {itemTimerSeconds !== null && (
                  <p className="text-purple-200 text-xs">
                    Item timer: {pad(Math.floor(itemTimerSeconds / 60))}:{pad(itemTimerSeconds % 60)}
                  </p>
                )}
                <p className="text-purple-200 text-xs">
                  {currentLot.auctionName || 'Live Lot'} · {currentLot.bidders} active bidders
                </p>
              </div>
            </div>

            {/* Music Controls */}
            <div className="bg-black/70 p-4 rounded-xl border border-[#7209B7]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)]">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setIsMusicMuted(!isMusicMuted)}
                  className="text-2xl hover:scale-110 transition-transform"
                  title={isMusicMuted ? 'Unmute Music' : 'Mute Music'}
                >
                  {isMusicMuted ? '🔇' : '🔊'}
                </button>
                <span className="text-xs text-purple-200 uppercase tracking-wide">Music</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-300">🔉</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  disabled={isMusicMuted}
                  className="w-24 h-1 bg-[#4D067B] rounded-lg appearance-none cursor-pointer accent-[#7209B7]"
                  style={{
                    background: `linear-gradient(to right, #7209B7 0%, #7209B7 ${musicVolume * 100}%, #4D067B ${musicVolume * 100}%, #4D067B 100%)`,
                    opacity: isMusicMuted ? 0.5 : 1
                  }}
                />
                <span className="text-xs text-purple-300">{isMusicMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}</span>
              </div>
            </div>
          </div>

          {/* Floating Action Button - Bid (Bottom Left) */}
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-[100]">
            <button
              onClick={() => setIsBidPanelOpen(!isBidPanelOpen)}
              className="w-12 h-12 md:w-14 md:h-14 bg-[#7209B7] hover:bg-[#4D067B] text-white rounded-full shadow-[0_0_30px_rgba(176,38,255,0.6)] flex items-center justify-center text-xl md:text-2xl transition-all"
              title="Place Bid"
            >
              🔨
            </button>
          </div>

          {/* Floating Action Button - Chat (Bottom Right) */}
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[100]">
            <button
              onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
              className="w-12 h-12 md:w-14 md:h-14 bg-[#7209B7] hover:bg-[#4D067B] text-white rounded-full shadow-[0_0_30px_rgba(176,38,255,0.6)] flex items-center justify-center text-xl md:text-2xl transition-all"
              title="Live Chat"
            >
              <ChatBubbleLeftIcon />
            </button>
          </div>

          {/* Bidding Panel Popup - Bottom Left */}
          {isBidPanelOpen && (
            <div className="absolute bottom-20 left-4 md:bottom-24 md:left-6 w-[calc(100vw-2rem)] max-w-sm md:w-96 text-white z-[200]">
              <div className="bg-black/90 p-4 md:p-6 rounded-xl border border-[#7209B7]/50 backdrop-blur-sm shadow-[0_0_40px_rgba(176,38,255,0.5)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg md:text-xl font-bold text-[#7209B7]">
                    🔨 Place Your Bid
                  </h3>
                  <button
                    onClick={() => setIsBidPanelOpen(false)}
                    className="text-purple-300 hover:text-white text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Current Bid Info */}
                  <div className="bg-[#4D067B]/80 p-3 md:p-4 rounded-lg space-y-2 border border-[#7209B7]/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-300 text-xs md:text-sm uppercase tracking-wide">Current Bid</p>
                        <p className="text-xl md:text-2xl font-bold text-[#E2BD6B]">${lotBidValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-purple-300 text-xs md:text-sm uppercase tracking-wide">Min Increment</p>
                        <p className="text-lg font-semibold text-purple-200">${bidIncrementValue.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bid Input */}
                  <div>
                    <label className="text-xs md:text-sm text-purple-200 mb-2 block">
                      Your Bid Amount
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step={bidIncrementValue}
                      value={bidAmount}
                      onChange={(event) => {
                        setBidAmount(event.target.value)
                        // Clear validation error when user types
                        if (bidValidationError) {
                          setBidValidationError(null)
                        }
                      }}
                      placeholder={`Min: $${nextBidMinimum.toFixed(2)}`}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-black/60 border border-[#7209B7]/40 rounded-lg text-white text-sm md:text-base focus:outline-none focus:border-[#7209B7] focus:shadow-[0_0_10px_rgba(176,38,255,0.3)]"
                    />
                    {bidValidationError && (
                      <p className="mt-2 text-[11px] md:text-xs text-red-400">
                        {bidValidationError}
                      </p>
                    )}
                    {!bidValidationError && (
                      <p className="mt-2 text-[11px] md:text-xs text-purple-300">
                        Enter in increments of ${bidIncrementValue.toFixed(2)}.
                      </p>
                    )}
                  </div>

                  {/* Place Bid Button */}
                  <button
                    onClick={handleBidSubmit}
                    disabled={isBidding}
                    className="w-full py-3 md:py-4 bg-[#7209B7] hover:bg-[#4D067B] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-sm md:text-base shadow-[0_0_20px_rgba(176,38,255,0.4)]"
                  >
                    {isBidding ? 'Submitting...' : 'Place Bid'}
                  </button>
                  {bidFeedback && (
                    <p className="text-xs md:text-sm text-[#7209B7]">{bidFeedback}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Panel Popup - Bottom Right */}
          {isChatPanelOpen && (
            <div className="absolute bottom-20 right-4 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] max-w-sm md:w-96 h-80 md:h-96 text-white z-[200]">
              <div className="bg-black/90 rounded-xl border border-[#7209B7]/50 backdrop-blur-sm shadow-[0_0_40px_rgba(176,38,255,0.5)] h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-3 md:p-4 border-b border-[#7209B7]/30 flex justify-between items-center">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#7209B7]">
                      <ChatBubbleLeftIcon/> Live Chat
                    </h3>
                    <p className="text-xs text-purple-300">
                      {chatParticipantCount} messages • {isChatFetching ? 'Updating…' : 'Live'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsChatPanelOpen(false)}
                    className="text-purple-300 hover:text-white text-xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-purple-300 italic text-center">No messages yet. Start the conversation!</p>
                  )}
                  {chatMessages.map((chat) => {
                    const isOwn = currentUserId && chat.uid === currentUserId
                    const isOwnerMessage = ownerId ? chat.uid === ownerId : false
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
                            className="h-7 w-7 rounded-full object-cover border border-[#7209B7]/40"
                            width={28}
                            height={28}
                          />
                        </div>
                        <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-3 py-2 shadow-sm ${
                              isOwn
                                ? 'bg-[#7209B7] text-white rounded-br-md'
                                : 'bg-[#4D067B] text-white border border-[#7209B7]/30 rounded-bl-md'
                            }`}
                          >
                            <p className="text-[10px] font-semibold mb-0.5 opacity-90 flex items-center gap-1.5">
                              <span>{chat.sender?.username ?? 'Guest'}</span>
                              {isOwnerMessage && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-wider" style={{ backgroundColor: '#F8E2D4', color: '#4D067B' }}>
                                  Owner
                                </span>
                              )}
                            </p>
                            <p className="text-sm break-words leading-relaxed">
                              {chat.message}
                            </p>
                          </div>
                          <span className={`text-[9px] text-purple-300 mt-0.5 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {formatChatTimestamp(chat.sent_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-3 md:p-4 border-t border-[#7209B7]/30">
                  <form className="flex gap-2" onSubmit={handleChatSubmit}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-2 md:px-3 py-2 bg-black/60 border border-[#7209B7]/40 rounded-lg text-xs md:text-sm text-white focus:outline-none focus:border-[#7209B7] focus:shadow-[0_0_10px_rgba(176,38,255,0.3)]"
                    />
                    <button
                      type="submit"
                      disabled={isSendingChat || !chatInput.trim()}
                      className="px-3 md:px-4 py-2 bg-[#7209B7] hover:bg-[#4D067B] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all text-xs md:text-sm shadow-[0_0_15px_rgba(176,38,255,0.4)]"
                    >
                      {isSendingChat ? 'Sending…' : 'Send'}
                    </button>
                  </form>
                  {chatFeedback && (
                    <p className="mt-2 text-[11px] md:text-xs text-[#7209B7]">{chatFeedback}</p>
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 md:p-8"
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

      {/* Bid Confirmation Modal */}
      {bidConfirmModal && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div
            className="rounded-2xl border-2 p-6 md:p-8 max-w-md w-full"
            style={{
              borderColor: '#7209B7',
              backgroundColor: '#130a1f',
              boxShadow: '0 0 60px rgba(114, 9, 183, 0.6)'
            }}
          >
            <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#F8E2D4' }}>
              🔨 Confirm Your Bid
            </h3>

            <p className="text-sm md:text-base mb-6" style={{ color: '#B984DB' }}>
              You are about to place a bid. Please review the details below:
            </p>

            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(114, 9, 183, 0.4)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-semibold" style={{ color: '#B984DB' }}>Item</span>
              </div>
              <p className="font-bold text-base md:text-lg mb-3" style={{ color: '#F8E2D4' }}>{bidConfirmModal.itemName}</p>

              <div className="pt-3 border-t" style={{ borderColor: 'rgba(114, 9, 183, 0.3)' }}>
                <span className="text-xs uppercase font-semibold block mb-1" style={{ color: '#B984DB' }}>Your Bid Amount</span>
                <p className="text-2xl md:text-3xl font-bold" style={{ color: '#E2BD6B' }}>
                  ${bidConfirmModal.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <p className="text-xs md:text-sm mb-6" style={{ color: '#B984DB' }}>
              Do you want to place this bid?
            </p>

            <div className="flex gap-3">
              <button
                onClick={bidConfirmModal.onCancel}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all hover:opacity-80"
                style={{
                  backgroundColor: '#444',
                  color: '#F8E2D4'
                }}
              >
                Cancel
              </button>
              <button
                onClick={bidConfirmModal.onConfirm}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#E2BD6B',
                  color: '#4D067B'
                }}
              >
                Confirm Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ModalContext.Provider>
  )
}















