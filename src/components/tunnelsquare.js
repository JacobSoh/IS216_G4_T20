import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TunnelSquares({ show = true, onComplete }) {
  const [squares, setSquares] = useState([]);
  const totalSquares = 15;
  const interval = 150;

  useEffect(() => {
    if (!show) return;

    let count = 0;
    const timer = setInterval(() => {
      count++;
      const isFinal = count === totalSquares;

      setSquares((prev) => [...prev, { id: count, final: isFinal }]);

      if (isFinal) {
        clearInterval(timer);

        // Wait for final animation duration before calling complete
        setTimeout(() => {
          onComplete?.(); // 👈 triggers after final square animation ends
        }, 2000);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [show]);

  return (
    <div className="absolute inset-0 flex items-center justify-center perspective-[1000px] overflow-hidden z-40">
      <AnimatePresence>
        {squares.map(({ id, final }) => (
          <motion.div
            key={id}
            className="absolute border border-purple-500 shadow-[0_0_30px_#a855f7]"
            initial={{ opacity: 0, scale: 0.1, z: -2000 }}
            animate={
              final
                ? {
                    opacity: [0, 1, 1, 1],
                    scale: [0.1, 1, 50],
                    z: [-2000, 0, 0],
                    transition: { duration: 2, ease: "linear" },
                  }
                : {
                    opacity: [0, 1, 1, 0],
                    scale: [0.1, 25],
                    z: [-2000, 600],
                    transition: { duration: 2, ease: "linear" },
                  }
            }
            exit={{ opacity: 0 }}
            style={{
              width:
                typeof window !== "undefined"
                  ? window.innerWidth < 640
                    ? "70px" // mobile (sm)
                    : window.innerWidth < 1024
                    ? "100px" // tablet (md)
                    : "125px" // desktop (lg)
                  : "125px",
              height:
                typeof window !== "undefined"
                  ? window.innerHeight < 640
                    ? "120px" // mobile (sm)
                    : window.innerHeight < 1024
                    ? "100px" // tablet (md)
                    : "80px" // desktop (lg)
                  : "80px"
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
