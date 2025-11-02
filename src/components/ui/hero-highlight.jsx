"use client";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useMotionTemplate } from "motion/react";
import React from "react";

export const HeroHighlight = ({
  children,
  className,
  containerClassName
}) => {
  // Hooks must always be called in the same order:
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { currentTarget, clientX, clientY } = e;
    if (!currentTarget) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div
      className={cn(
        "group relative flex h-[40rem] w-full items-center justify-center bg-transparent",
        containerClassName
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Hover radial glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)",
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />

      {/* Foreground content */}
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
};

export const Highlight = ({ children, className }) => {
  return (
    <motion.span
      initial={{ backgroundSize: "0% 100%" }}
      animate={{ backgroundSize: "100% 100%" }}
      transition={{ duration: 2, ease: "linear", delay: 0.5 }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={cn(
        "relative inline-block rounded-lg bg-gradient-to-r from-indigo-300 to-purple-300 px-1 pb-1 dark:from-indigo-500 dark:to-purple-500",
        className
      )}
    >
      {children}
    </motion.span>
  );
};
