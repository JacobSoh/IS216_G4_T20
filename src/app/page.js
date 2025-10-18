// FuturisticAuction.jsx

'use client'
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FuturisticAuction() {
  const scrollRef = useRef(null);
  const [auctionClicks, setAuctionClicks] = useState(0);
  const [faqOpen, setFaqOpen] = useState([false, false, false, false]);
  const [showFrame, setShowFrame] = useState(true);
  const [letters, setLetters] = useState({ large: [], small: [] });
  const cursorRef = useRef(null);


  const largeText = "VINTAGE\nRETRO\nFINDS";
  const smallText =
    "Discover pre-loved treasures\nfrom timeless eras, curated\nfor the modern collector";

  // Split text into letters for animation
  useEffect(() => {
    const splitLetters = (text) =>
      text.split("\n").map((line) => line.split(""));
    setLetters({ large: splitLetters(largeText), small: splitLetters(smallText) });
  }, []);

  // Flickering letters
  useEffect(() => {
    const interval = setInterval(() => {
      const allLetters = document.querySelectorAll(".letter");
      allLetters.forEach((el) => el.classList.remove("flicker"));
      const flickers = Array.from(allLetters)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.random() > 0.5 ? 2 : 1);
      flickers.forEach((el) => {
        if (!el.classList.contains("lit")) el.classList.add("flicker");
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Custom cursor movement
  useEffect(() => {
    const moveCursor = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  // Scroll effects for frame visibility
  useEffect(() => {
    const handleScroll = () => {
      const top = scrollRef.current?.scrollTop ?? 0;
      const heroHeight = window.innerHeight;
      setShowFrame(top <= heroHeight * 0.3);
    };
    const node = scrollRef.current;
    node?.addEventListener("scroll", handleScroll);
    return () => node?.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (index) => {
    const sections = document.querySelectorAll(".section");
    sections[index]?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAuctionClick = (e) => {
    setAuctionClicks((prev) => {
      const next = prev + 1;
      const money = document.createElement("div");
      money.textContent = "💰";
      money.className = "absolute text-3xl animate-float pointer-events-none";
      money.style.left = `${e.clientX}px`;
      money.style.top = `${e.clientY}px`;
      document.body.appendChild(money);
      setTimeout(() => money.remove(), 2000);
      return next;
    });
  };

  const toggleFAQ = (index) => {
    setFaqOpen((prev) =>
      prev.map((v, i) => (i === index ? !v : v))
    );
  };

  return (
    <div
      ref={scrollRef}
      className="scroll-smooth h-screen overflow-y-scroll snap-y snap-mandatory bg-black text-white relative"
    >
      {/* Border frame */}
      <motion.div
        animate={{ opacity: showFrame ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-[76px] left-[12px] right-[12px] bottom-[12px] border-2 border-purple-500 pointer-events-none z-[1000] shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.3)] rounded-lg"
      />

      {/* Glow background */}
      <motion.div
        animate={{ opacity: showFrame ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_60%)] pointer-events-none"
      />

      {/* HERO SECTION */}
      <section className="section relative h-screen snap-start flex items-center justify-between px-12 pt-24 scroll-mt-24">
        <div className="absolute top-14 left-12 w-1/2 space-y-8 z-50">
          {/* Large text */}
          <div className="large-text text-[8vw] font-bold leading-tight tracking-tight">
            {letters.large.map((line, li) => (
              <div key={li}>
                {line.map((ch, i) => (
                  <span
                    key={i}
                    className="letter inline-block text-transparent cursor-pointer px-1 -mx-1 transition-all duration-200"
                    style={{
                      WebkitTextStroke: "1px rgba(168,85,247,0.3)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.target;
                      el.classList.add("lit");
                      el.classList.remove("flicker");
                      el.style.color = "#8b5cf6";
                      el.style.textShadow =
                        "0 0 30px rgba(168,85,247,0.8)";
                      setTimeout(() => {
                        el.classList.remove("lit");
                        el.style.color = "transparent";
                        el.style.textShadow = "none";
                      }, 2000);
                    }}
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Small text */}
          <div className="text-[1.5vw] font-light tracking-wide leading-relaxed">
            {letters.small.map((line, li) => (
              <div key={li}>
                {line.map((ch, i) => (
                  <span
                    key={i}
                    className="letter inline-block text-transparent cursor-pointer px-1 -mx-1"
                    style={{
                      WebkitTextStroke: "0.5px rgba(139,92,246,0.15)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.target;
                      el.classList.add("lit");
                      el.classList.remove("flicker");
                      el.style.color = "#8b5cf6";
                      setTimeout(() => {
                        el.classList.remove("lit");
                        el.style.color = "transparent";
                      }, 2000);
                    }}
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute right-[12%] top-1/2 -translate-y-1/2 w-[350px] h-[450px] border-2 border-dashed border-purple-400/40 flex items-center justify-center text-purple-400/60 text-lg">
          Items Placeholder
        </div>

        <button
          onClick={() => scrollToSection(1)}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 border-2 border-purple-500 text-white px-12 py-4 rounded-md shadow-[0_0_30px_rgba(168,85,247,0.5),inset_0_0_15px_rgba(168,85,247,0.2)] hover:bg-purple-500/20 hover:shadow-[0_0_50px_rgba(168,85,247,0.9),inset_0_0_25px_rgba(168,85,247,0.4)] transition-all duration-500"
        >
          DISCOVER →
        </button>
      </section>

      {/* SECTION 2 */}
      <section className="section min-h-screen snap-start bg-gradient-to-br from-purple-100 to-purple-200 text-purple-900 flex items-center px-12 relative">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="w-1/2 space-y-8">
            <h2 className="text-[6vw] font-bold leading-tight text-purple-700">
              EXPLORE<br />CURATED<br />COLLECTIONS
            </h2>
            <p className="text-xl text-purple-800">
              Every piece tells a story, every item carries history.
              Discover unique vintage treasures handpicked from around the
              world.
            </p>
          </div>
        </div>
        <div className="absolute bottom-12 right-12 w-[400px] h-[300px] border-2 border-dashed border-purple-700/40 flex items-center justify-center text-purple-700/60">
          Image Placeholder
        </div>
      </section>

      {/* SECTION 3: Carousel */}
      <section className="section snap-start bg-black text-white px-12 py-30">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-purple-500 mb-4">Featured Auctions</h2>
          <p className="max-w-3xl mx-auto text-purple-400 text-lg">
            Browse through our carefully curated vintage collections.
            Each item has been authenticated and preserved to bring you the
            best quality pieces from different eras.
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="min-w-[350px] h-[400px] flex items-center justify-center border-2 border-purple-400/30 rounded-xl bg-purple-400/10 text-purple-400/70 text-lg snap-center"
            >
              Collection {n}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Auction */}
      <section
        id="auction"
        className="min-h-screen snap-start bg-gradient-to-b from-[#1a0033] to-black flex flex-col items-center justify-center relative overflow-hidden"
      >
        <h2 className="text-5xl text-purple-400 mb-8 text-center">LIVE AUCTION</h2>
        <p className="text-2xl mb-8">
          Clicks: {auctionClicks} / 5
        </p>
        <button
          onClick={handleAuctionClick}
          disabled={auctionClicks >= 5}
          className={`px-16 py-6 text-2xl rounded-lg border-4 transition-all duration-300 ${auctionClicks >= 5
              ? "bg-gradient-to-r from-green-500 to-emerald-400 border-green-400 shadow-[0_0_40px_rgba(16,185,129,0.6)]"
              : "bg-gradient-to-r from-purple-600 to-purple-500 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:scale-105"
            }`}
        >
          {auctionClicks >= 5 ? "BID PLACED ✓" : "PLACE BID"}
        </button>
      </section>


      {/* SECTION 5: About + FAQ */}
      <section className="section snap-start bg-black text-white px-12 pt-20 pb-30 flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
        <div className="flex-1">
          <h2 className="text-3xl text-purple-500 mb-6">About Us</h2>
          <p className="text-purple-200 leading-relaxed text-lg">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua...
            <br />
            <br />
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur...
          </p>
        </div>
        <div className="flex-1">
          <h2 className="text-3xl text-purple-500 mb-6">FAQ</h2>
          {[
            "How does bidding work?",
            "Are items authenticated?",
            "What payment methods do you accept?",
            "Do you ship internationally?",
          ].map((q, i) => (
            <div
              key={i}
              className="border border-purple-400/40 rounded-lg mb-4 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(i)}
                className="w-full flex justify-between items-center px-6 py-4 text-left bg-purple-400/10 hover:bg-purple-400/20 transition-all"
              >
                {q}
                <span
                  className={`transform transition-transform ${faqOpen[i] ? "rotate-180" : ""
                    }`}
                >
                  ▼
                </span>
              </button>
              <AnimatePresence>
                {faqOpen[i] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 py-4 text-purple-300 bg-black/50"
                  >
                    This is the answer to "{q}". Lorem ipsum dolor sit amet,
                    consectetur adipiscing elit.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Cursor */}
      <div
        ref={cursorRef}
        className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="25"
            y="20"
            width="50"
            height="60"
            rx="3"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
          />
          <line
            x1="25"
            y1="35"
            x2="75"
            y2="35"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <circle cx="40" cy="50" r="3" fill="#a855f7" />
          <circle cx="60" cy="50" r="3" fill="#a855f7" />
          <path
            d="M35 65 Q50 72 65 65"
            stroke="#ffffff"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Floating animation */}
      <style>{`
        .animate-float {
          animation: floatUp 2s ease-out forwards;
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(-200px) rotate(360deg); }
        }
        .flicker {
          animation: flicker 0.15s infinite;
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
