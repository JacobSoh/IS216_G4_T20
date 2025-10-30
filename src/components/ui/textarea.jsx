"use client";
import * as React from "react"
import { cn } from "@/lib/utils"
import { useMotionTemplate, useMotionValue, motion } from "motion/react";

const Textarea = React.forwardRef(({ className, type, ...props }, ref) => {
  const radius = 100; // change this to increase the rdaius of the hover effect
  const [visible, setVisible] = React.useState(false);

  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY
  }) {
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  return (
    <motion.div
      style={{
        background: useMotionTemplate`
      radial-gradient(
        ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
        var(--theme-secondary),
        transparent 80%
      )
    `,
      }}
      onMouseMove={handleMouseMove} 
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input rounded-md p-[2px] transition duration-300">
      <textarea
        type={type}
        className={cn(
          `shadow-input flex min-h-10 w-full rounded-md ring bg-background ring-[var(--theme-primary)] px-3 py-2 text-sm text-[var(--theme-surface-contrast)] transition duration-400 group-hover/input:shadow-none file:border-0 file:bg-[var(--theme-primary-darker)] file:text-sm file:font-medium placeholder:text-[var(--theme-placeholder)] focus-visible:ring-[2px] focus-visible:ring-[color:var(--theme-secondary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50`,
          className
        )}
        ref={ref}
        {...props} />
    </motion.div>
  );
});
Textarea.displayName = "Textarea";

export { Textarea }
