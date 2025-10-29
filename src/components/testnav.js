import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function BubbleNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCol, setHoveredCol] = useState(null);

  // ✅ Easily customizable images and link refs here
  const imageItems = [
    { src: "/assets/Heaphones.jpg", alt: "Headphones" },
    { src: "/assets/Jacket.jpg", alt: "Jacket" },
    { src: "/assets/Shoes.avif", alt: "Shoes" },
    { src: "/assets/Sports.jpeg", alt: "Sports" },
  ];

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Auctions", href: "/featured_auctions" },
    { name: "Categories", href: "/categories" },
    { name: "About", href: "/about" },
  ];

  return (
    <nav className="fixed top-0 right-0 w-full flex justify-end p-6 z-[9999]">
      {/* Transparent Hamburger Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="relative z-[10000] p-2 text-purple-700 hover:text-purple-900 transition-all duration-300"
      >
        {menuOpen ? <X size={34} /> : <Menu size={34} />}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Bubble Expansion */}
            <motion.div
              key="bubble-bg"
              initial={{ scale: 0 }}
              animate={{ scale: 60 }}
              exit={{ scale: 0 }}
              transition={{
                type: "spring",
                stiffness: 70,
                damping: 15,
              }}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-purple-300 origin-center z-[9998]"
            />

            {/* Full Overlay */}
            <motion.div
              key="menu-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25 }}
              className="fixed inset-0 bg-purple-300 flex flex-col md:flex-row items-center justify-between px-10 py-20 z-[9999]"
            >
              {/* LEFT SIDE — Interactive Image Grid */}
              <div className="grid grid-cols-2 gap-x-0 gap-y-8 md:w-1/2 justify-items-center items-center">
                {/* Left Column */}
                <motion.div
                  onMouseEnter={() => setHoveredCol(0)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className="flex flex-col space-y-8"
                  initial={{ y: -50 }}
                  animate={{
                    y: hoveredCol === 0 ? 30 : -50,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 14,
                  }}
                >
                  {imageItems.slice(0, 2).map((item, i) => (
                    <motion.img
                      key={i}
                      src={item.src}
                      alt={item.alt}
                      className="w-48 aspect-square object-cover rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.5)] hover:scale-105 transition-transform duration-300"
                      whileHover={{ y: 10 }}
                    />
                  ))}
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
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 14,
                  }}
                >
                  {imageItems.slice(2, 4).map((item, i) => (
                    <motion.img
                      key={i}
                      src={item.src}
                      alt={item.alt}
                      className="w-48 aspect-square object-cover rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.5)] hover:scale-105 transition-transform duration-300"
                      whileHover={{ y: 10 }}
                    />
                  ))}
                </motion.div>
              </div>

              {/* RIGHT SIDE — Links */}
              <motion.ul
                className="flex flex-col items-center md:items-end space-y-8 text-4xl font-semibold text-purple-800 md:w-1/2"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.name}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="cursor-pointer hover:text-teal-100 hover:underline transition-colors duration-300"
                  >
                    <a href={link.href} onClick={() => setMenuOpen(false)}>
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
