'use client'

import Link from 'next/link'
import { Suspense, useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useAuctionLive } from '@/hooks/useAuctionLive'
import { useAuctionChat } from '@/hooks/useAuctionChat'
import { ModalContext, AuctionScreenCard, buildScreenLot } from './AuctionScreen'
// replaced axiosBrowserClient with fetch
import { buildStoragePublicUrl } from '@/utils/storage'
import { supabaseBrowser } from '@/utils/supabase/client'
import { ChatBubbleLeftIcon, HomeIcon } from '@heroicons/react/24/solid'
import BiddingModal from './AuctionHouse3D/BiddingModal'
import BidConfirmationModal from './AuctionHouse3D/BidConfirmationModal'
import ChatModal from './AuctionHouse3D/ChatModal'
import GrandStage from './AuctionHouse3D/Scene3D/GrandStage'
import GrandTheatre from './AuctionHouse3D/Scene3D/GrandTheatre'
import GrandSeating from './AuctionHouse3D/Scene3D/GrandSeating' // Previously TheatreTieredSeating
import LockedSeatController from './AuctionHouse3D/Scene3D/LockedSeatController'
import TheatreLighting from './AuctionHouse3D/Scene3D/TheatreLighting'

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
  // Check if there's actually a bid placed by a user (uid is set)
  // When item becomes active, current_bid is created with uid=null and current_price=min_bid
  // Only when someone actually bids does uid get set
  const hasActualBid = activeBid && activeBid.uid != null
  const currentBidValue = awaitingStart
    ? Number(displayItem?.min_bid ?? 0)
    : Number(activeBid?.current_price ?? displayItem?.min_bid ?? 0)
  // Next bid minimum: if there's an actual bid, add increment; otherwise just use min_bid
  const nextBidMinimum = hasActualBid ? currentBidValue + bidIncrement : minBid

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
    hasBid: awaitingStart ? false : hasActualBid,
    auctionEndsAt: auction.end_time ?? null,
    auctionStartsAt: auction.start_time ?? null,
    itemTimerSeconds: awaitingStart ? null : itemTimerDuration,
    itemTimerStartedAt: awaitingStart ? null : itemTimerStartedAt,
    hasNextLot
  }
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
  const [isInfoExpanded, setIsInfoExpanded] = useState(false)
  const [showAudioPrompt, setShowAudioPrompt] = useState(true)
  const audioRef = useRef(null)
  const hasUnlockedAudioRef = useRef(false)
  const isEnablingAudioRef = useRef(false)
  const [itemTimerSeconds, setItemTimerSeconds] = useState(null)
  const [bidConfirmModal, setBidConfirmModal] = useState(null) // { amount, onConfirm, onCancel }
  const [participantCount, setParticipantCount] = useState(0)
  const presenceChannelRef = useRef(null)
  const ownerIdRef = useRef(initialLiveData?.auction?.oid ?? null)
  const guestPresenceIdRef = useRef(null)
  const participantCountRef = useRef(0)

  useEffect(() => {
    console.log('?? AuctionHouse3D: Snapshot changed, rebuilding lot', {
      activeItemId: snapshot?.activeItem?.iid,
      activeItemTitle: snapshot?.activeItem?.title
    })
    const newLot = buildLotFromSnapshot(snapshot)
    setCurrentLot({
      ...newLot,
      bidders: participantCountRef.current
    })
    setLotItems(snapshot?.items ?? [])
    console.log('?? AuctionHouse3D: New lot built', {
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

  // Check if auction has ended and redirect
  useEffect(() => {
    const auctionEnded = snapshot?.auction?.auction_end ?? false
    if (auctionEnded) {
      window.location.href = `/auction/view/${aid}/ended`
    }
  }, [snapshot?.auction?.auction_end , aid])
  

  // Consolidated timer: auction end time + item timer + nowTs - all in ONE interval
  useEffect(() => {
    const endTime = snapshot?.auction?.end_time ? new Date(snapshot.auction.end_time) : null

    const updateAllTimers = () => {
      const now = Date.now()
      setNowTs(now)

      // Update auction end time
      if (endTime) {
        const timeRemaining = formatTimeRemaining(endTime)
        setCurrentLot((prev) => {
          if (prev.timeRemaining === timeRemaining) return prev
          return { ...prev, timeRemaining }
        })
      }

      // Update item timer
      if (currentLot.itemTimerStartedAt && currentLot.itemTimerSeconds) {
        const startedAt = currentLot.itemTimerStartedAt
        const duration = currentLot.itemTimerSeconds
        const elapsed = Math.floor((now - startedAt.getTime()) / 1000)
        const remaining = Math.max(0, duration - elapsed)
        setItemTimerSeconds(remaining)
      } else {
        setItemTimerSeconds(null)
      }
    }

    // Initial update
    updateAllTimers()

    // Single consolidated interval
    const intervalId = setInterval(updateAllTimers, 1000)
    return () => clearInterval(intervalId)
  }, [snapshot?.auction?.end_time, currentLot.itemTimerStartedAt, currentLot.itemTimerSeconds])

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

// Removed standalone nowTs timer - now consolidated with other timers above

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

// Load audio file on mount
useEffect(() => {
  const audioElement = audioRef.current
  if (!audioElement) return undefined

  console.log('[Audio Mount] Audio element mounted, explicitly loading audio file')

  const handleLoadStart = () => {
    console.log('[Audio] loadstart event - browser has started loading')
  }

  const handleLoadedMetadata = () => {
    console.log('[Audio] loadedmetadata event - metadata loaded successfully')
    console.log('[Audio] Duration:', audioElement.duration, 'seconds')
  }

  const handleCanPlay = () => {
    console.log('[Audio] canplay event - audio can start playing')
    console.log('[Audio] readyState:', audioElement.readyState)
  }

  const handleError = (e) => {
    console.error('[Audio] error event - failed to load audio:', e)
    console.error('[Audio] Error details:', {
      error: audioElement.error,
      errorCode: audioElement.error?.code,
      errorMessage: audioElement.error?.message,
      src: audioElement.src,
      currentSrc: audioElement.currentSrc,
      networkState: audioElement.networkState
    })
  }

  const handleStalled = () => {
    console.warn('[Audio] stalled event - download has stopped')
  }

  const handleSuspend = () => {
    console.log('[Audio] suspend event - download intentionally stopped')
  }

  // Add event listeners
  audioElement.addEventListener('loadstart', handleLoadStart)
  audioElement.addEventListener('loadedmetadata', handleLoadedMetadata)
  audioElement.addEventListener('canplay', handleCanPlay)
  audioElement.addEventListener('error', handleError)
  audioElement.addEventListener('stalled', handleStalled)
  audioElement.addEventListener('suspend', handleSuspend)

  // Explicitly load the audio
  audioElement.load()
  console.log('[Audio Mount] Called load() on audio element')
  console.log('[Audio Mount] Initial state:', {
    readyState: audioElement.readyState,
    networkState: audioElement.networkState,
    src: audioElement.src,
    currentSrc: audioElement.currentSrc
  })

  return () => {
    audioElement.removeEventListener('loadstart', handleLoadStart)
    audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
    audioElement.removeEventListener('canplay', handleCanPlay)
    audioElement.removeEventListener('error', handleError)
    audioElement.removeEventListener('stalled', handleStalled)
    audioElement.removeEventListener('suspend', handleSuspend)
  }
}, [])

const handleEnableAudio = useCallback(() => {
  // Prevent multiple simultaneous calls
  if (isEnablingAudioRef.current) {
    console.log('[handleEnableAudio] Already enabling audio, ignoring duplicate call')
    return
  }

  isEnablingAudioRef.current = true
  console.log('[handleEnableAudio] Button clicked!')
  console.log('[handleEnableAudio] audioRef.current:', audioRef.current)

  const audioElement = audioRef.current
  if (!audioElement) {
    console.error('[handleEnableAudio] No audio element found!')
    isEnablingAudioRef.current = false
    setShowAudioPrompt(false)
    return
  }

  // Close the prompt FIRST, before attempting to play
  setShowAudioPrompt(false)
  hasUnlockedAudioRef.current = true

  // Then attempt to play audio after a small delay to let React finish rendering
  setTimeout(() => {
    // Re-check audio element is still valid
    if (!audioRef.current) {
      console.error('[handleEnableAudio] Audio element disappeared after timeout!')
      isEnablingAudioRef.current = false
      return
    }

    console.log('[handleEnableAudio] Attempting to play audio unmuted...')
    console.log('[handleEnableAudio] Audio element state:', {
      paused: audioElement.paused,
      readyState: audioElement.readyState,
      networkState: audioElement.networkState,
      currentSrc: audioElement.currentSrc
    })

    audioElement.muted = false
    audioElement.volume = isMusicMuted ? 0 : musicVolume

    console.log('[handleEnableAudio] Calling play()...')
    const playPromise = audioElement.play()
    console.log('[handleEnableAudio] playPromise:', playPromise)

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[handleEnableAudio] ✓ Audio enabled and playing successfully')
          console.log('[handleEnableAudio] Final audio state:', {
            paused: audioElement.paused,
            volume: audioElement.volume,
            muted: audioElement.muted
          })
          isEnablingAudioRef.current = false
        })
        .catch((error) => {
          console.error('[handleEnableAudio] Failed to play unmuted:', error)
          console.error('[handleEnableAudio] Error name:', error.name)
          console.error('[handleEnableAudio] Error message:', error.message)

          // Try fallback: start muted then unmute
          console.log('[handleEnableAudio] Trying fallback: muted start')
          audioElement.muted = true
          audioElement.volume = musicVolume

          const retryPromise = audioElement.play()
          if (retryPromise !== undefined) {
            retryPromise
              .then(() => {
                console.log('[handleEnableAudio] Playing muted successfully')
                // Successfully playing while muted, now unmute after a short delay
                setTimeout(() => {
                  if (audioRef.current && !isMusicMuted) {
                    console.log('[handleEnableAudio] Unmuting audio')
                    audioRef.current.muted = false
                    audioRef.current.volume = musicVolume
                  }
                }, 200)
                console.log('[handleEnableAudio] ✓ Audio enabled (via muted start)')
              })
              .catch((retryError) => {
                console.error('[handleEnableAudio] Audio playback completely blocked:', retryError)
              })
              .finally(() => {
                isEnablingAudioRef.current = false
              })
          } else {
            isEnablingAudioRef.current = false
          }
        })
    } else {
      isEnablingAudioRef.current = false
    }
  }, 100)
}, [isMusicMuted, musicVolume])

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
    // If there's a current bid (hasBid), add increment; otherwise just use min_bid
    return currentLot.hasBid ? lotBidValue + bidIncrementValue : minBidValue
  }, [lotBidValue, bidIncrementValue, minBidValue, currentLot.hasBid])
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--theme-secondary)] border-t-transparent mx-auto mb-4 shadow-[0_0_30px_rgba(176,38,255,0.6)]"></div>
          <p className="text-white text-lg">Loading Auction House...</p>
        </div>
      </div>
    )
  }

  if (isBeforeStart) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="space-y-4 max-w-xl">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--theme-secondary)] animate-pulse">Auction Preview</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Auction starting soon</h1>
          <p className="text-purple-200">
            The house opens at{' '}
            {auctionStart?.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.{" "}
            Grab a seat and check back shortly.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--theme-secondary)]/50 px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--theme-secondary)]/20 transition shadow-[0_0_20px_rgba(176,38,255,0.3)]"
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
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--theme-secondary)]">Auction Closed</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">This auction has ended</h1>
          <p className="text-purple-200">
            This auction has ended, feel free to explore other auctions.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--theme-secondary)]/50 px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--theme-secondary)]/20 transition shadow-[0_0_20px_rgba(176,38,255,0.3)]"
        >
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen, currentLot, items: lotItems, nextItem: currentLot.nextItem, itemTimerSeconds }}>
      {/* Background Music - Outside main container to prevent unmounting */}
      <audio
        ref={audioRef}
        loop
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/music/auction_music.mp3`}
      />

      <div className="w-full h-screen bg-black relative">

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
              <GrandSeating />
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
              <button className="bg-black/70 hover:bg-[var(--theme-secondary)]/30 text-white px-6 py-3 rounded-xl border border-[var(--theme-secondary)]/40 backdrop-blur-sm font-semibold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(176,38,255,0.3)]">
                <HomeIcon className="w-5 h-5" /> Home
              </button>
            </Link>
          </div>

          {/* Status Bar - Top Right */}
          <div className="absolute top-6 right-6 text-white z-10">
            {/* Mobile: Collapsible Dropdown */}
            <div className="md:hidden">
              <button
                onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                className="bg-black/70 px-6 py-3 rounded-xl border border-[var(--theme-secondary)]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:bg-black/80 transition-all flex items-center gap-2 font-semibold"
              >
                <div className={`w-2 h-2 ${isFetching ? 'bg-[var(--theme-secondary)] animate-ping' : 'bg-[var(--theme-secondary)] animate-pulse'} rounded-full`}></div>
                <span className="text-xs uppercase tracking-wide text-[var(--theme-secondary)]">Info</span>
                <span className={`text-xs transform transition-transform ${isInfoExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Expanded Mobile Content */}
              {isInfoExpanded && (
                <div className="mt-2 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                  {/* Live Auction Status */}
                  <div className="bg-black/70 p-3 rounded-xl border border-[var(--theme-secondary)]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 ${isFetching ? 'bg-[var(--theme-secondary)] animate-ping' : 'bg-[var(--theme-secondary)] animate-pulse'} rounded-full`}></div>
                      <span className="text-xs font-medium uppercase tracking-wide text-[var(--theme-secondary)]">Live Auction</span>
                    </div>
                    <div className="space-y-1">
                      {itemTimerSeconds !== null && (
                        <p className="text-purple-200 text-xs">
                          Item timer: {pad(Math.floor(itemTimerSeconds / 60))}:{pad(itemTimerSeconds % 60)}
                        </p>
                      )}
                      <p className="text-purple-200 text-xs">
                        {currentLot.auctionName || 'Live Lot'} - {currentLot.bidders} bidders
                      </p>
                    </div>
                  </div>

                  {/* Music Controls */}
                  <div className="bg-black/70 p-3 rounded-xl border border-[var(--theme-secondary)]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)]">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setIsMusicMuted(!isMusicMuted)}
                        className="text-lg hover:scale-110 transition-transform"
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
                        className="flex-1 h-1 bg-[var(--theme-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--theme-secondary)]"
                        style={{
                          background: `linear-gradient(to right, var(--theme-secondary) 0%, var(--theme-secondary) ${musicVolume * 100}%, var(--theme-primary) ${musicVolume * 100}%, var(--theme-primary) 100%)`,
                          opacity: isMusicMuted ? 0.5 : 1
                        }}
                      />
                      <span className="text-xs text-purple-300">{isMusicMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}</span>
                    </div>
                  </div>

                  {/* Seller Profile Link */}
                  {snapshot?.auction?.owner?.username && (
                    <Link href={`/user/${snapshot.auction.owner.username}`}>
                      <div className="bg-black/70 p-3 rounded-xl border border-[var(--theme-secondary)]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:border-[var(--theme-accent)] hover:shadow-[0_0_30px_rgba(176,38,255,0.5)] transition-all cursor-pointer">
                        <div className="flex items-center gap-2">
                          <img
                            src={resolveAvatarUrl(snapshot.auction.owner)}
                            alt={snapshot.auction.owner.username}
                            className="w-8 h-8 rounded-full object-cover border-2 border-[var(--theme-secondary)]"
                          />
                          <div>
                            <p className="text-xs text-purple-200 uppercase tracking-wide">Hosted by</p>
                            <p className="text-sm text-[var(--theme-cream)] font-semibold">@{snapshot.auction.owner.username}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: Always Visible Column */}
            <div className="hidden md:flex flex-col gap-3">
              <div className="bg-black/70 p-4 rounded-xl border border-[var(--theme-secondary)]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)]">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 ${isFetching ? 'bg-[var(--theme-secondary)] animate-ping' : 'bg-[var(--theme-secondary)] animate-pulse'} rounded-full`}></div>
                  <span className="text-sm font-medium uppercase tracking-wide text-[var(--theme-secondary)]">Live Auction</span>
                </div>
                <div className="space-y-1">
                  {itemTimerSeconds !== null && (
                    <p className="text-purple-200 text-xs">
                      Item timer: {pad(Math.floor(itemTimerSeconds / 60))}:{pad(itemTimerSeconds % 60)}
                    </p>
                  )}
                  <p className="text-purple-200 text-xs">
                    {currentLot.auctionName || 'Live Lot'} - {currentLot.bidders} active bidders
                  </p>
                </div>
              </div>

              {/* Music Controls */}
              <div className="bg-black/70 p-4 rounded-xl border border-[var(--theme-secondary)]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)]">
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
                    className="w-24 h-1 bg-[var(--theme-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--theme-secondary)]"
                    style={{
                      background: `linear-gradient(to right, var(--theme-secondary) 0%, var(--theme-secondary) ${musicVolume * 100}%, var(--theme-primary) ${musicVolume * 100}%, var(--theme-primary) 100%)`,
                      opacity: isMusicMuted ? 0.5 : 1
                    }}
                  />
                  <span className="text-xs text-purple-300">{isMusicMuted ? '0%' : `${Math.round(musicVolume * 100)}%`}</span>
                </div>
              </div>

              {/* Seller Profile Link */}
              {snapshot?.auction?.owner?.username && (
                <Link href={`/user/${snapshot.auction.owner.username}`}>
                  <div className="bg-black/70 p-4 rounded-xl border border-[var(--theme-secondary)]/40 backdrop-blur-sm shadow-[0_0_20px_rgba(176,38,255,0.3)] hover:border-[var(--theme-accent)] hover:shadow-[0_0_30px_rgba(176,38,255,0.5)] transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveAvatarUrl(snapshot.auction.owner)}
                        alt={snapshot.auction.owner.username}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[var(--theme-secondary)]"
                      />
                      <div>
                        <p className="text-xs text-purple-200 uppercase tracking-wide mb-1">Hosted by</p>
                        <p className="text-sm text-[var(--theme-cream)] font-semibold">@{snapshot.auction.owner.username}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Floating Action Button - Bid (Bottom Left) */}
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-[100]">
            <button
              onClick={() => setIsBidPanelOpen(!isBidPanelOpen)}
              className="w-12 h-12 md:w-14 md:h-14 bg-[var(--theme-secondary)] hover:bg-[var(--theme-primary)] text-white rounded-full shadow-[0_0_30px_rgba(176,38,255,0.6)] flex items-center justify-center transition-all text-xl md:text-2xl"
              title="Place Bid"
            >
              🔨
            </button>
          </div>

          {/* Floating Action Button - Chat (Bottom Right) */}
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[100]">
            <button
              onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
              className="w-12 h-12 md:w-14 md:h-14 bg-[var(--theme-secondary)] hover:bg-[var(--theme-primary)] text-white rounded-full shadow-[0_0_30px_rgba(176,38,255,0.6)] flex items-center justify-center transition-all p-2.5 md:p-3"
              title="Live Chat"
            >
              <ChatBubbleLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Bidding Panel Popup - Bottom Left */}
          <BiddingModal
            isOpen={isBidPanelOpen}
            onClose={() => setIsBidPanelOpen(false)}
            lotBidValue={lotBidValue}
            bidIncrementValue={bidIncrementValue}
            bidAmount={bidAmount}
            setBidAmount={setBidAmount}
            bidValidationError={bidValidationError}
            setBidValidationError={setBidValidationError}
            nextBidMinimum={nextBidMinimum}
            handleBidSubmit={handleBidSubmit}
            isBidding={isBidding}
            bidFeedback={bidFeedback}
            hasBid={currentLot.hasBid}
            status={currentLot.status}
            awaitingMessage={currentLot.awaitingMessage}
          />

          {/* Chat Panel Popup - Bottom Right */}
          <ChatModal
            isOpen={isChatPanelOpen}
            onClose={() => setIsChatPanelOpen(false)}
            chatMessages={chatMessages}
            chatParticipantCount={chatParticipantCount}
            isChatFetching={isChatFetching}
            currentUserId={currentUserId}
            ownerId={ownerId}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChatSubmit={handleChatSubmit}
            isSendingChat={isSendingChat}
            chatFeedback={chatFeedback}
            formatChatTimestamp={formatChatTimestamp}
            resolveAvatarUrl={resolveAvatarUrl}
            chatMessagesEndRef={chatMessagesEndRef}
        />
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
      <BidConfirmationModal bidConfirmModal={bidConfirmModal} />

      {/* Audio Prompt Overlay - Rendered LAST to be on top */}
      {showAudioPrompt && (
        <div className="fixed inset-0 z-[10002] bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-gradient-to-br from-[#1a0b2e] to-[#0f0520] border-2 border-[var(--theme-secondary)] rounded-2xl p-8 max-w-md mx-4 shadow-[0_0_50px_rgba(176,38,255,0.5)] text-center space-y-6 pointer-events-auto">
            <div className="text-6xl mb-4 animate-pulse">🔊</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to the Auction House
            </h2>
            <p className="text-purple-200 text-sm mb-6">
              Enable sound for the full immersive experience with background music during the auction.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleEnableAudio}
                className="w-full bg-[var(--theme-secondary)] hover:bg-[var(--theme-primary)] text-white font-semibold py-3 px-6 rounded-xl shadow-[0_0_30px_rgba(176,38,255,0.6)] transition-all hover:scale-105 cursor-pointer"
              >
                Enable Sound & Enter
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAudioPrompt(false)
                  setIsMusicMuted(true)
                }}
                className="w-full bg-transparent border border-[var(--theme-secondary)]/50 hover:border-[var(--theme-secondary)] text-purple-200 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer"
              >
                Enter Without Sound
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ModalContext.Provider>
  )
}















