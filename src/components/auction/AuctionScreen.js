'use client'

import { useContext, useMemo, createContext } from 'react'
import { Html } from '@react-three/drei'

// This context is provided by AuctionHouse3D
const ModalContext = createContext()

export default function AuctionScreen({ position = [0, 4, -3.5], scale = [1, 1, 1] }) {
  const modalContext = useContext(ModalContext)
  if (!modalContext) {
    console.error('AuctionScreen must be used within ModalContext.Provider')
  }

  const {
    setIsModalOpen = () => {},
    currentLot = {},
    nextItem = null,
    items = []
  } = modalContext ?? {}

  const lotLabel = useMemo(() => {
    if (!currentLot?.id) return 'Lot —'
    return `Lot #${currentLot.id}`
  }, [currentLot])

  const currentBidDisplay = useMemo(() => {
    const bid = Number(currentLot?.currentBid ?? 0)
    return bid.toLocaleString()
  }, [currentLot])

  const nextLotPreview = useMemo(() => {
    if (nextItem) return nextItem
    if (!items?.length) return null
    return items.find((item) => item?.iid !== currentLot?.id) ?? null
  }, [currentLot, items, nextItem])

  const handleModalToggle = () => {
    setIsModalOpen((prev) => !prev)
  }

  return (
    <group position={position} scale={scale}>
      <Html transform position={[0, 0, 0.11]}>
        <div
          onClick={handleModalToggle}
          style={{
            width: '800px',
            height: '450px',
            backgroundColor: '#0a0f1a',
            border: '3px solid #33A1E0',
            borderRadius: '12px',
            padding: '20px',
            fontFamily: 'system-ui, sans-serif',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            pointerEvents: 'auto',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              textAlign: 'center',
              borderBottom: '2px solid #1e3548',
              paddingBottom: '15px',
              marginBottom: '15px'
            }}
          >
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#fff9af',
                margin: '0 0 5px 0'
              }}
            >
              LIVE AUCTION
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#b8c5d1',
                margin: 0
              }}
            >
              {lotLabel} · {currentLot?.bidders ?? 0} active bidders
            </p>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: '0 0 20px 0'
              }}
            >
              {currentLot?.name ?? 'Upcoming lot'}
            </h2>

            <div
              style={{
                display: 'flex',
                gap: '40px',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#8a9ba8',
                    margin: '0 0 5px 0'
                  }}
                >
                  Current Bid
                </p>
                <p
                  style={{
                    fontSize: '42px',
                    fontWeight: 'bold',
                    color: '#fff9af',
                    margin: 0
                  }}
                >
                  ${currentBidDisplay}
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#8a9ba8',
                    margin: '0 0 5px 0'
                  }}
                >
                  Time Remaining
                </p>
                <p
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#b2292d',
                    margin: 0,
                    fontFamily: 'monospace'
                  }}
                >
                  {currentLot?.timeRemaining ?? '--:--:--'}
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '2px solid #1e3548',
              paddingTop: '15px',
              textAlign: 'center'
            }}
          >
            <p
              style={{
                fontSize: '20px',
                color: '#33A1E0',
                margin: '0 0 6px 0',
                fontWeight: 'bold'
              }}
            >
              dYZ_ Tap to expand auction details
            </p>
            {nextLotPreview && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#b8c5d1',
                  margin: 0
                }}
              >
                Next up: {nextLotPreview.title}
              </p>
            )}
          </div>
        </div>
      </Html>
    </group>
  )
}

export { ModalContext }
