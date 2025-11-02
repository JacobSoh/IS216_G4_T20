"use client";

import React, { useEffect, useMemo, useRef } from "react";
// Use explicit ESM module paths for better bundler compatibility
import { createTimeline } from "animejs";

/**
 * HammerLoader
 * A construction/deconstruction loader animation using anime.js
 * - Animates discrete hammer parts assembling into place, then breaking apart like puzzle pieces
 * - Loops continuously
 *
 * Props:
 * - size: number (px) – overall rendered size (default 96)
 * - speed: number – multiplier for animation speed (default 1)
 * - className: string – extra class names on container
 */
export default function HammerLoader({ size = 96, speed = 1, className = "" }) {
  const rootRef = useRef(null);

  // Precompute scatter positions so the motion feels consistent each loop
  const scatter = useMemo(() => {
    // Offsets and rotations for parts when "exploded"
    return {
      headFront:  { x: -36, y: -28, r: -25, s: 0.85 },
      headBack:   { x:  34, y: -26, r:  26, s: 0.88 },
      claw:       { x:  40, y:  24, r:  28, s: 0.9  },
      neck:       { x: -28, y:  30, r: -18, s: 0.92 },
      handleTop:  { x: -18, y:  38, r: -12, s: 0.92 },
      handleMid:  { x:  18, y:  40, r:  12, s: 0.92 },
      handleEnd:  { x:  28, y:  32, r:  20, s: 0.9  },
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    // Utility to set initial scattered state
    const setScattered = () => {
      Object.entries(scatter).forEach(([key, cfg]) => {
        const el = root.querySelector(`[data-part="${key}"]`);
        if (!el) return;
        // Ensure transforms are applied relative to each part's bbox center
        el.style.transformOrigin = '50% 50%';
        el.style.transformBox = 'fill-box';
        el.style.willChange = 'transform, opacity';
        el.style.transform = `translate(${cfg.x}px, ${cfg.y}px) rotate(${cfg.r}deg) scale(${cfg.s})`;
        el.style.opacity = "0";
      });
    };

    setScattered();

    const dur = (v) => v / Math.max(0.25, speed);

    const timeline = createTimeline({ autoplay: false, loop: true });

    // Assemble sequence: fade + move each piece into place with slight overlaps
    const pieces = [
      "headBack",
      "headFront",
      "claw",
      "neck",
      "handleTop",
      "handleMid",
      "handleEnd",
    ];

    pieces.forEach((part, idx) => {
      const selector = `[data-part='${part}']`;
      const target = root.querySelector(selector);
      if (!target) return;
      timeline.add(
        target,
        {
          translateX: 0,
          translateY: 0,
          rotate: 0,
          scale: 1,
          opacity: [0, 1],
          duration: dur(600),
          easing: "easeOutQuad",
        },
        idx === 0 ? 0 : `-=${dur(420)}`
      );
    });

    // Gentle settle bounce for all parts together
    timeline.add(
      root.querySelectorAll("[data-part]"),
      {
        scale: [1, 1.02, 1],
        duration: dur(500),
        easing: "easeInOutSine",
      }
    );

    // Hold assembled state briefly
    timeline.add({
      duration: dur(600),
    });

    // Deconstruct: explode back to scatter positions with a slight rotation
    pieces
      .slice()
      .reverse()
      .forEach((part, idx) => {
        const cfg = scatter[part];
        const selector = `[data-part='${part}']`;
        const target = root.querySelector(selector);
        if (!target) return;
        timeline.add(
          target,
          {
            translateX: cfg.x,
            translateY: cfg.y,
            rotate: cfg.r,
            scale: cfg.s,
            opacity: [1, 0.05],
            duration: dur(520),
            easing: "easeInQuad",
          },
          idx === 0 ? "+=0" : `-=${dur(360)}`
        );
      });

    // Fade all out before next loop and reset transform for crisp restarts
    timeline.add(
      root.querySelectorAll("[data-part]"),
      {
        opacity: 0,
        duration: dur(200),
        complete: () => setScattered(),
      }
    );

    timeline.play();

    return () => timeline.pause();
  }, [scatter, speed]);

  // Colors follow app theme vars; override via className if needed
  const px = Math.max(48, Number(size) || 96);
  const stroke = "var(--theme-border)";
  const metal = "#d1d5db"; // Tailwind gray-300
  const metalDark = "#9ca3af"; // gray-400
  const wood = "#a16207"; // amber-700
  const grip = "#6b7280"; // gray-500

  return (
    <div
      ref={rootRef}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: px, height: px }}
      aria-label="Loading"
      role="status"
    >
      {/*
        ViewBox sized to 100x100. Hammer oriented diagonally for visual interest.
        Each significant piece gets data-part for individual animation.
      */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head back (anvil side) */}
        <g data-part="headBack" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
          <rect x="38" y="20" width="24" height="12" rx="2" fill={metalDark} stroke={stroke} strokeWidth="0.75" />
        </g>

        {/* Head front (striking face) */}
        <g data-part="headFront" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
          <rect x="58" y="22" width="10" height="8" rx="1.5" fill={metal} stroke={stroke} strokeWidth="0.75" />
        </g>

        {/* Claw */}
        <g data-part="claw" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
          <path d="M36 24 C30 22, 28 28, 30 32 C34 30, 36 28, 38 26" fill={metal} stroke={stroke} strokeWidth="0.75" />
        </g>

        {/* Neck joining head to handle */}
        <g data-part="neck" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
          <rect x="44" y="30" width="8" height="8" rx="1.25" fill={metalDark} stroke={stroke} strokeWidth="0.75" />
        </g>

        {/* Handle segments to look like puzzle pieces */}
        <g data-part="handleTop" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
          <rect x="46" y="38" width="6" height="16" rx="2" fill={wood} stroke={stroke} strokeWidth="0.6" />
        </g>
        <g data-part="handleMid" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
          <rect x="46" y="54" width="6" height="18" rx="2" fill={wood} stroke={stroke} strokeWidth="0.6" />
        </g>
        <g data-part="handleEnd" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
          <rect x="44.5" y="72" width="9" height="12" rx="3" fill={grip} stroke={stroke} strokeWidth="0.6" />
        </g>

        {/* Optional subtle shadow for depth */}
        <ellipse cx="50" cy="88.5" rx="18" ry="3.5" fill="rgba(0,0,0,0.12)" />
      </svg>
    </div>
  );
}
