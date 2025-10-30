"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function BubbleNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(0); // default = Home

  const imageItems = [
    { src: "/assets/kidshomedrawing.jpg", alt: "Home" },
    { src: "/assets/gavel.jpg", alt: "Auctions" },
    { src: "/assets/pileofstuff.webp", alt: "Categories" },
    { src: "/assets/thinkingguy.jpg", alt: "About" },
  ];

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Auctions", href: "/featured_auctions" },
    { name: "Categories", href: "/categories" },
    { name: "About", href: "/about" },
  ];

  return (
    <nav className="fixed top-0 right-0 w-full flex justify-end p-6 z-[9999]">
      {/* Hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="relative z-[10000] p-2 text-purple-700 hover:text-purple-900 transition-all duration-300"
      >
        {menuOpen ? <X size={34} /> : <Menu size={34} />}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Expanding Bubble Background */}
            <motion.div
              key="bubble-bg"
              initial={{ scale: 0 }}
              animate={{ scale: 60 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 70, damping: 15 }}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-purple-300 origin-center z-[9998]"
            />

            {/* Full Menu Overlay */}
            <motion.div
              key="menu-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25 }}
              className="fixed inset-0 bg-purple-300 flex flex-col md:flex-row items-center justify-between px-10 py-20 z-[9999]"
            >
              {/* Logo (Top Left) */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-6 left-8 flex items-center space-x-3"
              >
                <img
                  src="/assets/logo.png"
                  alt="BidHub Logo"
                  className="w-8 h-8 object-contain"
                />
              </motion.div>

              {/* LEFT SIDE — Floating Image Grid */}
              <div className="grid grid-cols-2 -gap-x-1 gap-y-8 ml-5 md:w-1/2 justify-items-center items-center">
                {/* Left Column */}
                <motion.div
                  onMouseEnter={() => setHoveredCol(0)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className="flex flex-col space-y-8"
                  initial={{ y: -50 }}
                  animate={{
                    y: hoveredCol === 0 ? 30 : -50,
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 14 }}
                >
                  {imageItems.slice(0, 2).map((item, i) => {
                    const isHovered = hoveredLink === i;
                    return (
                      <motion.img
                        key={i}
                        src={item.src}
                        alt={item.alt}
                        className={`w-65 aspect-square object-cover rounded-sm shadow-[0_0_40px_rgba(147,51,234,0.5)]
                          transition-all duration-500 ease-in-out ${
                            isHovered ? "grayscale-0 scale-105" : "grayscale"
                          }`}
                        whileHover={{ y: 10 }}
                      />
                    );
                  })}
                </motion.div>

                {/* Right Column */}
                <motion.div
                  onMouseEnter={() => setHoveredCol(1)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className="flex flex-col space-y-8"
                  initial={{ y: 60 }}
                  animate={{
                    y: hoveredCol === 1 ? 30 : 60,
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 14 }}
                >
                  {imageItems.slice(2, 4).map((item, i) => {
                    const index = i + 2;
                    const isHovered = hoveredLink === index;
                    return (
                      <motion.img
                        key={index}
                        src={item.src}
                        alt={item.alt}
                        className={`w-65 aspect-square object-cover rounded-sm shadow-[0_0_40px_rgba(147,51,234,0.5)]
                          transition-all duration-500 ease-in-out ${
                            isHovered ? "grayscale-0 scale-105" : "grayscale"
                          }`}
                        whileHover={{ y: 10 }}
                      />
                    );
                  })}
                </motion.div>
              </div>

              {/* RIGHT SIDE — Nav Links */}
<motion.ul
  className="flex flex-col items-center md:items-end -space-y-3 text-[11vh] font-semibold text-purple-800 md:w-1/2"
  initial={{ x: 50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ delay: 0.4 }}
>
  {navLinks.map((link, i) => {
    const isHovered = hoveredLink === i;

    return (
      <motion.li
        key={link.name}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 + i * 0.1 }}
        onMouseEnter={() => setHoveredLink(i)}
        onMouseLeave={() => setHoveredLink(null)}
        className="cursor-pointer mr-5 relative flex gap-0"
      >
        <a
          href={link.href}
          onClick={() => setMenuOpen(false)}
          className="relative flex gap-0"
        >
          {/* Rolling letters with color change */}
          {link.name.split("").map((char, idx) => (
            <motion.span
              key={idx}
              className={`inline-block transition-colors duration-300 ${
                isHovered ? "text-white" : "text-purple-700"
              }`}
              animate={
                isHovered
                  ? { rotateX: [0, 360], y: [0, -5, 0] }
                  : { rotateX: 0, y: 0 }
              }
              transition={
                isHovered
                  ? {
                      duration: 0.6,
                      delay: idx * 0.03,
                      ease: [0.25, 1, 0.5, 1],
                    }
                  : {}
              }
            >
              {char}
            </motion.span>
          ))}

          {/* Sliding underline */}
          <span
            className={`absolute left-0 -bottom-1 h-[5px] bg-white transition-all duration-300 ${
              isHovered ? "w-full" : "w-0"
            }`}
          />
        </a>
      </motion.li>
    );
  })}
</motion.ul>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
