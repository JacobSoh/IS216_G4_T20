// FuturisticAuction.jsx
'use client';
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createTimeline, stagger, splitText } from 'animejs';
import { supabaseBrowser } from "@/utils/supabase/client";
import { AuctionMinimal, AuctionMinimalSkeleton } from "@/components/LandingAuction";
import { AuctionHoverPicture, AuctionHoverPictureSkeleton } from "@/components/landingauctionhover";


// ---------- Main Component ----------
export default function FuturisticAuction() {
  const scrollRef = useRef(null);
  const sectionRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFrame(entry.isIntersecting); // true only if hero is in viewport
      },
      { threshold: 0.3 }
    );

    observer.observe(heroRef.current);

    return () => observer.disconnect();
  }, []);

  // ---------- Featured Auctions Section ----------
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch auctions from Supabase
  useEffect(() => {
    const fetchAuctions = async () => {
      const { data, error } = await supabaseBrowser()
        .from('auction')
        .select('aid, name, description, start_time, end_time, thumbnail_bucket, object_path')
        .limit(5);

      if (error) console.error(error);
      else setAuctions(data);
      setLoading(false);
    };

    fetchAuctions();
  }, []);



  const [auctionClicks, setAuctionClicks] = useState(0);
  const [showFrame, setShowFrame] = useState(true);
  const [letters, setLetters] = useState({ large: [], small: [] });

  const largeText = "VINTAGE\nRETRO\nFINDS";
  const smallText = "Discover pre-loved treasures\nfrom timeless eras, curated\nfor the modern collector";

  // ---------- Split Text for Hero Animation ----------
  useEffect(() => {
    const splitLetters = (text) => text.split("\n").map(line => line.split(""));
    setLetters({ large: splitLetters(largeText), small: splitLetters(smallText) });
  }, []);

  // ---------- Animate Info Section ----------
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { lines } = splitText(".info-heading", { lines: { wrap: "clip" }, words: true, chars: false });
    const { lines: paragraphLines } = splitText(".info-para", { lines: { wrap: "clip" }, words: true, chars: false });

    const animateIn = () => {
      createTimeline({ loop: false, defaults: { ease: "inOut(3)", duration: 650 } })
        .add(lines, { y: ["100%", "0%"], opacity: [0, 1] }, stagger(250))
        .add(paragraphLines, { y: ["100%", "0%"], opacity: [0, 1] }, stagger(150))
        .init();
    };

    const animateOut = () => {
      createTimeline({ loop: false, defaults: { ease: "inOut(3)", duration: 650 } })
        .add(lines, { y: ["0%", "-100%"], opacity: [1, 0] }, stagger(250))
        .add(paragraphLines, { y: ["0%", "-100%"], opacity: [1, 0] }, stagger(150))
        .init();
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? animateIn() : animateOut());
    }, { threshold: 0.3 });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // ---------- Flickering Letters ----------
  useEffect(() => {
    const interval = setInterval(() => {
      const allLetters = document.querySelectorAll(".letter");
      allLetters.forEach(el => el.classList.remove("flicker"));
      const flickers = Array.from(allLetters)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.random() > 0.5 ? 2 : 1);
      flickers.forEach(el => !el.classList.contains("lit") && el.classList.add("flicker"));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (index) => {
    const sections = document.querySelectorAll(".section");
    sections[index]?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAuctionClick = (e) => {
    setAuctionClicks(prev => {
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

  return (
    <div ref={scrollRef} className="scroll-smooth h-screen overflow-y-scroll snap-y snap-mandatory bg-black text-white relative">
      {/* Border frame */}
      <motion.div
        animate={{ opacity: showFrame ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-[12px] left-[12px] right-[12px] bottom-[12px] border-2 border-purple-500 pointer-events-none z-[1000] shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.3)] rounded-lg"
      />
      {/* Glow background */}
      <motion.div
        animate={{ opacity: showFrame ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_60%)] pointer-events-none"
      />

      {/* HERO SECTION */}
      <section ref={heroRef} className="section relative h-screen flex items-center justify-between px-12 pt-24 scroll-mt-24">
        <div className="absolute top-10 left-12 w-1/2 space-y-8 z-50">
          {/* Large text */}
          <div className="large-text text-[8vw] font-bold leading-[0.85] tracking-tight">
            {letters.large.map((line, li) => (
              <div key={li}>
                {line.map((ch, i) => (
                  <span
                    key={i}
                    className="letter inline-block text-transparent cursor-pointer px-1 -mx-1 transition-all duration-200"
                    style={{ WebkitTextStroke: "1px rgba(168,85,247,0.3)" }}
                    onMouseEnter={(e) => {
                      const el = e.target;
                      el.classList.add("lit");
                      el.classList.remove("flicker");
                      el.style.color = "#8b5cf6";
                      el.style.textShadow = "0 0 30px rgba(168,85,247,0.8)";
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
          <div className="text-[1.5vw] font-sans tracking-wide leading-tight">
            {letters.small.map((line, li) => (
              <div key={li}>
                {line.map((ch, i) => (
                  <span
                    key={i}
                    className="letter inline-block text-transparent cursor-pointer px-1 -mx-1 transition-colors duration-500"
                    style={{ WebkitTextStroke: "0.5px rgba(168,85,247,0.25)" }}
                    onMouseEnter={(e) => {
                      const el = e.target;
                      const parent = el.parentElement;
                      const letters = Array.from(parent.querySelectorAll(".letter"));
                      const index = letters.indexOf(el);
                      const nearby = [index - 2, index - 1, index, index + 1, index + 2];
                      nearby.forEach((i) => {
                        if (letters[i]) {
                          const l = letters[i];
                          l.classList.add("lit");
                          l.classList.remove("flicker");
                          l.style.color = "#a78bfa";
                          l.style.textShadow = "0 0 30px rgba(168,85,247,0.8)";
                          setTimeout(() => {
                            l.classList.remove("lit");
                            l.style.color = "transparent";
                            l.style.textShadow = "none";
                          }, 1500);
                        }
                      });
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
          className="absolute bottom-20 left-1/2 -translate-x-1/2 border-2 border-purple-500 text-white px-12 py-4 rounded-md shadow-[0_0_30px_rgba(168,85,247,0.5),inset_0_0_15px_rgba(168,85,247,0.2)] hover:bg-purple-500/20 hover:shadow-[0_0_100px_rgba(168,85,247,0.9),inset_0_0_100px_rgba(168,85,247,0.4)] transition-all duration-500"
        >
          DISCOVER →
        </button>
      </section>


      {/* SECTION 2: Info */}
      <section
        ref={sectionRef}
        className="section min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 text-purple-900 flex flex-col lg:flex-row justify-between px-24 relative"
      >
        <div className="flex-1 flex flex-col justify-center py-24">
          <div className="max-w-3xl -translate-y-30 -ml-10">
            <h2 className="info-heading text-[7vw] font-bold leading-[0.9] text-purple-700">
              EXPLORE<br />CURATED<br />COLLECTIONS
            </h2>

            <p className="info-para text-xl text-purple-800 max-w-2xl mt-12">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>

        <div className="flex flex-col h-[80vh] my-auto -mr-10">
          <div className="sticky top-20 w-[400px] h-[300px] mr-8 border-2 border-dashed border-purple-700/40 flex items-center justify-center text-purple-700/60 rounded-2xl shadow-lg">
            Image Placeholder
          </div>
        </div>
      </section>

      {/* SECTION 3: Featured Auctions */}

      <section className="section min-h-screen  bg-gradient-to-br from-purple-700 to-purple-800 px-12 py-30">
        <div className="text-center mb-12">
          <Link
            href="/featured_auctions"
            className="inline-block text-[8vw] text-black mb-4 hover:text-green-200 transition-colors duration-300 relative group"
          >
            Featured Auctions
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-green-300 transition-all duration-300 group-hover:w-full" />
          </Link>

          <p className="max-w-3xl mx-auto text-black text-lg mt-4">
            Browse through our carefully curated vintage collections.Gonna add some picture effect soon
          </p>
        </div>

        {/* Grid layout: exactly 2 per row on all larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <AuctionHoverPictureSkeleton key={i} />
            ))
            : auctions.map((auction) => {
              const picUrl =
                auction.thumbnail_bucket && auction.object_path
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${auction.thumbnail_bucket}/${auction.object_path}`
                  : null;


              return (
                <AuctionHoverPicture
                  key={auction.aid}
                  name={auction.name}
                  picUrl={picUrl}
                />
              );
            })}
        </div>


      </section>




      {/* SECTION 4: Live Auction */}
<section
  id="auction"
  className="relative w-full flex flex-col items-center justify-center overflow-hidden"
>
  {/* Background Image */}
  <div
    className="w-full h-[90vh] bg-cover bg-center"
    style={{
      backgroundImage:
        "url('https://img.freepik.com/premium-photo/empty-elegant-classic-theatre-with-spotlight-shot-from-stage-opera-house-with-beautiful-golden-decoration-ready-recieve-audience-play-ballet-show_263512-9763.jpg')",
    }}
  />

  {/* Vertical Gradient on top portion */}
  <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-blue-900 to-yellow-200"></div>

  {/* Content */}
  <div className="absolute top-1/2 w-full flex flex-col items-center transform -translate-y-1/2 z-10">
    <h2 className="text-5xl text-purple-400 mb-8 text-center">
      LIVE AUCTION
    </h2>
    <p className="text-2xl mb-8">Clicks: {auctionClicks} / 3</p>
    <button
      onClick={handleAuctionClick}
      disabled={auctionClicks >= 3}
      className={`px-16 py-6 text-2xl rounded-lg border-4 transition-all duration-300 ${
        auctionClicks >= 3
          ? "bg-gradient-to-r from-green-500 to-emerald-400 border-green-400 shadow-[0_0_40px_rgba(16,185,129,0.6)]"
          : "bg-gradient-to-r from-purple-600 to-purple-500 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:scale-105"
      }`}
    >
      {auctionClicks >= 3 ? "BID PLACED ✓" : "PLACE BID"}
    </button>
  </div>
</section>



      {/* SECTION 5: About + FAQ */}
      <section className="section bg-black text-white px-12 flex flex-col lg:flex-row items-start justify-center gap-12 max-w-6xl mx-auto h-screen">
        <div className="flex-1 flex flex-col justify-start items-start mt-12">
          <h2 className="text-3xl text-purple-500 mb-6">About Us</h2>
          <p className="text-purple-200 leading-relaxed text-lg">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua...
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-start items-start mt-12">
          <h2 className="text-3xl text-purple-500 mb-6">FAQ</h2>

          <Accordion type="single" collapsible className="space-y-2 w-full">
            {[
              "How does bidding work?",
              "Are items authenticated?",
              "What payment methods do you accept?",
              "Do you ship internationally?",
            ].map((q, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-purple-400/40 rounded-lg">
                <AccordionTrigger className="px-6 py-4 text-left bg-purple-400/10 hover:bg-purple-400/20 transition-all">{q}</AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-purple-300 bg-black/50">
                  This is the answer to "{q}". Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Floating animation styles */}
      <style>{`
        .animate-float { animation: floatUp 2s ease-out forwards; }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(-200px) rotate(360deg); }
        }
        .flicker { animation: flicker 0.15s infinite; }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
