import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function BubbleNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 right-0 w-full flex justify-end p-6 z-[9999]">
      {/* Transparent Hamburger Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="relative z-[10000] p-2 text-purple-700 hover:text-purple-900 transition-all duration-300"
      >
        {menuOpen ? <X size={34} /> : <Menu size={34} />}
      </button>

      {/* Expanding Bubble Background + Full Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Bubble Expansion Animation */}
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
            ></motion.div>

            {/* Full Overlay Content */}
            <motion.div
              key="menu-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25 }}
              className="fixed inset-0 bg-purple-300 flex flex-col md:flex-row items-center justify-between px-10 py-20 z-[9999]"
            >
              {/* LEFT SIDE — Placeholder Squares */}
              <motion.div
                className="flex flex-col items-center justify-center space-y-8 md:w-1/2"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-64 h-64 bg-purple-400 rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.5)]"></div>
                <div className="w-48 h-48 bg-purple-400 rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.5)]"></div>
              </motion.div>

              {/* RIGHT SIDE — Links */}
              <motion.ul
                className="flex flex-col items-center md:items-end space-y-8 text-4xl font-semibold text-purple-800 md:w-1/2"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {["Home", "Auctions", "Gallery", "Contact"].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="cursor-pointer hover:text-yellow-400 transition-colors duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item}
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
