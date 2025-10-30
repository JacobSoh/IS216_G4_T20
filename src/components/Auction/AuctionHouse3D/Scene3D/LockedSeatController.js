'use client'

import { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function LockedSeatController() {
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

  // Enforce position lock only when necessary (skip equals check - just copy if locked)
  const lastLockedState = useRef(false)
  useFrame(() => {
    if (isLocked) {
      // Always enforce when locked (small performance cost, but ensures lock)
      camera.position.copy(fixedPosition.current)
    }
    lastLockedState.current = isLocked
  })

  return null // No OrbitControls - we handle everything manually
}
