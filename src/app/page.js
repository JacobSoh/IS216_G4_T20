"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createTimeline, stagger, splitText } from "animejs";
import { supabaseBrowser } from "@/utils/supabase/client";
import {
  AuctionHoverPicture,
  AuctionHoverPictureSkeleton,
} from "@/components/AuctionCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import BubbleNav from "@/components/testnav";
import TunnelSquares from "@/components/tunnelsquare";
//import { motion } from "motion/react";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { useResponsive } from "@/components/responsive";

// ---------- Main Component ----------
export default function FuturisticAuction() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  //const scrollRef = useRef(null);
  const sectionRef = useRef(null);
  const heroRef = useRef(null);
  const [showTunnel, setShowTunnel] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  // Check if animation has been shown this session
  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem('hasSeenHomeAnimation');
    if (hasSeenAnimation === 'true') {
      // Skip animation, show landing immediately
      setShowTunnel(false);
      setShowLanding(true);
    } else {
      // Mark animation as seen for this session
      sessionStorage.setItem('hasSeenHomeAnimation', 'true');
    }
  }, []);

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const borderOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  const [timeLeft, setTimeLeft] = useState(60);
  const [currentBid, setCurrentBid] = useState(100);
  const [userBid, setUserBid] = useState("");
  const [result, setResult] = useState("");

  const faqs = [
  {
    question: "How does bidding work?",
    answer:
      "You can browse live auctions, place your bid, and watch the countdown. Winning requires being the highest bidder when the timer ends.",
  },
  {
    question: "Are items authenticated?",
    answer:
      "All items listed are verified by our team to ensure authenticity and quality before being auctioned.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept major credit/debit cards, PayPal, and other secure online payment methods. All transactions are encrypted.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes, we ship to select countries. Shipping fees and estimated delivery times are calculated at checkout.",
  },
];

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      if (currentBid > 100) {
        setResult("🎉 You won!");
      } else {
        setResult("❌ You lost!");
      }
    }
  }, [timeLeft]);

  const handleBid = () => {
    if (Number(userBid) > currentBid) {
      setCurrentBid(Number(userBid));
      setResult("✅ New highest bid!");
    } else {
      setResult("⚠️ Bid must be higher!");
    }
  };

  var settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
    pauseOnHover: true,
  };
  if (isTablet) {
    settings.slidesToShow = 2;
  }

  if (isMobile) {
    settings.slidesToShow = 1;
  }

  // ---------- Featured Auctions Section ----------
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch auctions from Supabase
  useEffect(() => {
    const fetchAuctions = async () => {
      const { data, error } = await supabaseBrowser()
        .from("auction")
        .select(
          "aid, name, description, start_time, thumbnail_bucket, object_path"
        )
        .limit(5);

      if (error) console.error("error retriving auction data", error);
      else setAuctions(data);
      setLoading(false);
    };

    fetchAuctions();
  }, []);

  const [auctionClicks, setAuctionClicks] = useState(0);
  const [showFrame, setShowFrame] = useState(false);
  const [letters, setLetters] = useState({ large: [], small: [] });

  const largeText = "VINTAGE\nRETRO\nFINDS";
  const smallText = "";
  //"Discover pre-loved treasures\nfrom timeless eras, curated\nfor the modern collector"
  // ---------- Split Text for Hero Animation ----------
  useEffect(() => {
    const splitLetters = (text) =>
      text.split("\n").map((line) => line.split(""));
    setLetters({
      large: splitLetters(largeText),
      small: splitLetters(smallText),
    });
  }, []);

  // ---------- Animate Info Section ----------
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { lines } = splitText(".info-heading", {
      lines: { wrap: "clip" },
      words: true,
      chars: false,
    });
    const { lines: paragraphLines } = splitText(".info-para", {
      lines: { wrap: "clip" },
      words: true,
      chars: false,
    });

    const animateIn = () => {
      createTimeline({
        loop: false,
        defaults: { ease: "inOut(3)", duration: 650 },
      })
        .add(lines, { y: ["100%", "0%"], opacity: [0, 1] }, stagger(250))
        .add(
          paragraphLines,
          { y: ["100%", "0%"], opacity: [0, 1] },
          stagger(150)
        )
        .init();
    };

    const animateOut = () => {
      createTimeline({
        loop: false,
        defaults: { ease: "inOut(3)", duration: 650 },
      })
        .add(lines, { y: ["0%", "-100%"], opacity: [1, 0] }, stagger(250))
        .add(
          paragraphLines,
          { y: ["0%", "-100%"], opacity: [1, 0] },
          stagger(150)
        )
        .init();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.isIntersecting ? animateIn() : animateOut()
        );
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // ---------- Flickering Letters ----------
  useEffect(() => {
    const interval = setInterval(() => {
      const allLetters = document.querySelectorAll(".letter");
      allLetters.forEach((el) => el.classList.remove("flicker"));
      const flickers = Array.from(allLetters)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.random() > 0.5 ? 2 : 1);
      flickers.forEach(
        (el) => !el.classList.contains("lit") && el.classList.add("flicker")
      );
    }, 2000);
    return () => clearInterval(interval);
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

  return (
    <div className="scroll-smooth h-screen overflow-y-scroll snap-y snap-mandatory bg-black text-white relative">
      {/*Nav Menu*/}
      {showLanding && <BubbleNav />}

      {showLanding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        ></motion.div>
      )}
      {/* Glowing border */}
      <motion.div
        ref={ref}
        style={{ opacity: showLanding ? borderOpacity : 0 }}
        animate={{ opacity: showLanding ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="fixed top-[12px] left-[12px] right-[12px] bottom-[12px] border-2 border-purple-500 pointer-events-none z-[1000] shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_20px_rgba(168,85,247,0.3)] rounded-lg"
      />

      <motion.div
        animate={{ opacity: showLanding ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_60%)] pointer-events-none"
      />
      {/* Landing Section*/}
      <section
        ref={heroRef}
        className="section relative h-screen flex items-center justify-center px-12 scroll-mt-24 overflow-hidden"
      >
        {/* 🔮 Tunnel Animation */}
        <TunnelSquares
          show={!showLanding}
          onComplete={() => {
            setShowLanding(true);
          }}
        />

        {/* ✨ Hero Content — appears only after final square */}
        {showLanding && (
          <motion.div
            className="flex flex-col items-center justify-center text-center space-y-8 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Large Text */}
            <div className="large-text text-[8vw] font-bold leading-[0.88] tracking-tight">
              {letters.large.map((line, li) => (
                <div key={li}>
                  {line.map((ch, i) => (
                    <span
                      key={i}
                      className="letter inline-block text-transparent cursor-pointer px-1.5 -mx-1 transition-all duration-200"
                      style={{ WebkitTextStroke: "4px rgba(168,85,247,0.3)" }}
                      onMouseEnter={(e) => {
                        const el = e.target;
                        el.classList.add("lit");
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

            {/* Small Text */}
            <div className="text-[1.5vw] font-sans tracking-wide leading-tight">
              {letters.small.map((line, li) => (
                <div key={li}>
                  {line.map((ch, i) => (
                    <span
                      key={i}
                      className="letter inline-block text-transparent cursor-pointer px-1 -mx-1 transition-colors duration-500"
                      style={{
                        WebkitTextStroke: "0.5px rgba(168,85,247,0.25)",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.target;
                        const parent = el.parentElement;
                        const letters = Array.from(
                          parent.querySelectorAll(".letter")
                        );
                        const index = letters.indexOf(el);
                        const nearby = [
                          index - 2,
                          index - 1,
                          index,
                          index + 1,
                          index + 2,
                        ];
                        nearby.forEach((i) => {
                          if (letters[i]) {
                            const l = letters[i];
                            l.classList.add("lit");
                            l.style.color = "#a78bfa";
                            l.style.textShadow =
                              "0 0 30px rgba(168,85,247,0.8)";
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

            {/* Scroll Button */}
            <button
              onClick={() => scrollToSection(1)}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 border-2 border-purple-500 text-white px-12 py-4 rounded-md shadow-[0_0_30px_rgba(168,85,247,0.5),inset_0_0_15px_rgba(168,85,247,0.2)] hover:bg-purple-500/20 hover:shadow-[0_0_100px_rgba(168,85,247,0.9),inset_0_0_100px_rgba(168,85,247,0.4)] transition-all duration-500"
            >
              DISCOVER →
            </button>
          </motion.div>
        )}
      </section>

      {/* Info */}
      <section
        ref={sectionRef}
        className="section min-h-screen bg-gradient-to-b from-purple-100 to-purple-300 text-purple-900 flex flex-col lg:flex-row justify-between px-24 relative"
      >
        <div className="flex-1 flex flex-col justify-center py-24">
          <div className="max-w-3xl -translate-y-16 -ml-10">
            <h2 className="info-heading text-[7vw] font-bold leading-[0.9] text-purple-700">
              EXPLORE
              <br />
              CURATED
              <br />
              COLLECTIONS
            </h2>

            <p className="info-para text-xl text-purple-800 max-w-2xl mt-12">
              Explore a world of pre-loved treasures — from timeless antiques to
              everyday essentials and trending gadgets.
              <br></br>
              <br></br>
              Whether you’re a collector, a bargain hunter, or just browsing for
              fun, there’s something here for you. Start bidding, connect with
              others, and make each find your own.
            </p>
          </div>
        </div>
        {/* Desktop Sticky Image */}
        {isDesktop && (
          <div className="flex flex-col h-[80vh] my-auto -mr-10">
            <div className="sticky top-20 w-[400px] h-[300px] mr-8 flex items-center justify-center text-purple-700/60 rounded-2xl">
              <img
                className="shadow-lg w-full h-full object-cover rounded-sm"
                src="/assets/thrift.jpg"
                alt="thrift store"
              />
            </div>
          </div>
        )}

        {/* Small/Tablet Image below text */}
        {(isTablet || isMobile) && (
          <div className="flex justify-center -mt-20 mb-20">
            <img
              className="shadow-lg w-[90%] max-w-md h-auto object-cover rounded-sm"
              src="/assets/thrift.jpg"
              alt="thrift store"
            />
          </div>
        )}
      </section>

      {/* Featured Auctions */}
      <section className="section min-h-screen bg-gradient-to-b from-purple-300 to-purple-200 px-12 pt-4 pb-20">
        {/* Header */}
        <div className="text-center mb-20 mt-15">
          <Link
            href="/featured_auctions"
            className="inline-block md:text-5xl lg:text-6xl font-bold text-purple-700 leading-none hover:text-white transition-colors duration-300 relative group"
          >
            Featured Auctions
            <span className="absolute bottom-0 left-0 w-0 h-[4px] bg-white transition-all duration-300 group-hover:w-full" />
          </Link>

          <p className="md:text-2xl lg:text-3xl mx-auto text-purple-700 mt-4">
            Browse through our carefully curated vintage collections
          </p>
        </div>

        <Slider {...settings}>
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
                  <Link
                    key={auction.aid}
                    href={`/auction/view/${auction.aid}`}
                    passHref
                  >
                    <div className="cursor-pointer">
                      <AuctionHoverPicture
                        name={auction.name}
                        picUrl={picUrl}
                        hoverTextColor="white"
                      />
                    </div>
                  </Link>
                );
              })}
        </Slider>
      </section>

      {/* Live Auction */}
      <section
        id="auction"
        className={`relative w-full flex flex-col items-center justify-start overflow-hidden bg-gradient-to-b from-purple-200 to-purple-300
        ${isDesktop ? "h-auto" : isTablet ? "min-h-[120vh]" : "min-h-[150vh]"}
      `}
      >
        {/* Top Section: Video + Text */}
        <div
          className={`relative mt-[18vh] w-[85%] z-10 flex ${
            isDesktop
              ? "flex-col md:flex-row items-start justify-between space-y-16 md:space-y-0"
              : "flex-col items-center justify-center space-y-10"
          }`}
        >
          {/* Video */}
          <video
            src="/assets/vidu-video-3006995670702686.mp4"
            className={`
            ${isDesktop ? "-mt-4 md:w-[40vw] md:h-[56vh]" : ""}
            ${isTablet ? "w-full h-[40vh]" : ""}
            ${isMobile ? "w-full h-[30vh]" : ""}
            object-cover rounded-2xl z-20 transform transition-transform duration-500 ease-out hover:scale-110 shadow-[0_0_40px_rgba(168,85,247,0.6)]
          `}
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Text */}
          <div
            className={`flex flex-col justify-center ${
              isDesktop
                ? "md:w-[45%] text-left space-y-6"
                : "w-full text-center space-y-6 mt-4"
            }`}
          >
            <h2
              className={`text-6xl font-bold text-purple-600 drop-shadow-[0_0_25px_rgba(168,85,247,0.9)] ${
                isMobile ? "text-4xl" : ""
              }`}
            >
              How do I bid?
            </h2>

            <p
              className={`text-lg text-purple-700/90 leading-relaxed whitespace-pre-line ${
                isMobile ? "text-base" : ""
              }`}
            >
              Joining an auction is simple and exciting. Start by{" "}
              <span className="font-semibold text-purple-800">
                browsing the live listings
              </span>{" "}
              to discover unique items that catch your eye — from rare
              collectibles to everyday treasures.
              {"\n"}
              When you find something you love,{" "}
              <span className="font-semibold text-purple-800">
                place your bid
              </span>{" "}
              and watch the timer count down.
            </p>
          </div>
        </div>

        {/* Bottom Section: Bidding Area */}
        <div
          className={`flex flex-col items-center justify-center text-center mt-20 mb-25 w-[90%] ${
            isTablet ? "space-y-6" : "space-y-10"
          }`}
        >
          <h3 className="text-[6vh] font-semibold text-purple-600 drop-shadow-[0_0_25px_rgba(168,85,247,0.9)]">
            Try it out now
          </h3>

          <div
            className={`grid w-full items-center justify-items-center ${
              isDesktop
                ? "grid-cols-3 gap-20"
                : isTablet
                ? "grid-cols-3 gap-12"
                : "grid-cols-1 gap-6"
            }`}
          >
            {/* LEFT */}
            <div
              className={`flex flex-col items-center ${
                isDesktop ? "md:items-start text-left" : "text-center"
              } space-y-5`}
            >
              <h3 className="text-3xl font-semibold text-purple-600 drop-shadow-[0_0_25px_rgba(168,85,247,0.9)]">
                Minecraft Diamond Sword
              </h3>
              <p className="text-base text-purple-600 max-w-md leading-relaxed">
                A rare collectible from the world of Minecraft.
              </p>
              <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0 mt-4">
                <div>
                  <h4 className="text-lg font-medium text-purple-500">
                    Time Left
                  </h4>
                  <p className="text-3xl font-bold text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]">
                    120s
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-purple-500">
                    Current Bid
                  </h4>
                  <p className="text-3xl font-semibold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    $100
                  </p>
                </div>
              </div>
            </div>

            {/* CENTER IMAGE */}
            <img
              src="assets/newdsword.jpg"
              className={`
    rounded-2xl border-4 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)]
    object-cover aspect-square
    ${isDesktop ? "w-96" : ""}
    ${isTablet ? "w-56" : ""}
    ${isMobile ? "w-full max-w-xs" : ""}
  `}
            />

            {/* RIGHT */}
            <div
              className={`flex flex-col items-center ${
                isDesktop ? "md:items-end" : ""
              } space-y-6`}
            >
              <input
                type="number"
                placeholder="Enter your bid"
                className="w-64 px-6 py-3 rounded-lg bg-transparent border border-purple-600/60 text-center text-xl text-purple-100 placeholder-white focus:outline-none"
              />
              <button className="px-12 py-4 text-2xl font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:scale-[1.03] transition-all duration-300">
                Place Bid
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section
        className={`section bg-purple-300 text-white w-full min-h-screen px-6 md:px-12 flex flex-col ${
          isDesktop
            ? "lg:flex-row items-start justify-start gap-12 py-12"
            : "items-center justify-center gap-8 py-12"
        }`}
      >
        {/* Left Side — Large Placeholder Image + Text */}
        <div
          className={`flex-1 flex flex-col items-start justify-start space-y-6 ${
            isDesktop ? "w-1/2" : "w-full items-center text-center"
          }`}
        >
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`${isDesktop ? "" : "max-w-3xl mx-auto"}`}
          >
            <h2 className="text-6xl md:text-5xl sm:text-4xl font-bold text-purple-600 drop-shadow-[0_0_25px_rgba(168,85,247,0.9)]">
              Why use BidHub?
            </h2>

            <p className="mt-4 text-purple-700 leading-relaxed text-lg max-w-2xl md:max-w-full mx-auto">
              Our platform makes online auctions{" "}
              <span className="font-semibold text-purple-600">
                fair, transparent, and effortless
              </span>
              . Track your bids in real time, compete confidently, and uncover
              unique items — from rare collectibles to cutting-edge tech.
              <br />
              Bidding here is more than shopping — it’s an{" "}
              <span className="font-semibold text-purple-600">
                experience of discovery and excitement
              </span>
              . Join a growing community of collectors, explore trending
              auctions, and turn each bid into a moment worth remembering. With
              intuitive navigation across devices, every auction becomes a
              seamless journey.
            </p>
          </motion.div>

          {/* Large Placeholder Image */}
          <img
            src="assets/shophouse.jpg"
            className={`
            ${isDesktop ? "w-[90vh] h-[65vh]" : "w-full max-w-md h-auto"}
            ${isTablet ? "w-full max-w-4xl h-auto mx-auto" : ""}
            ${isMobile ? "w-full h-auto mx-auto" : ""}
          bg-purple-400/50 border-2 border-purple-500 rounded-2xl shadow-[0_0_35px_rgba(168,85,247,0.7)] object-cover`}
          />
        </div>

        {/* Right Side — Smaller Image + Button */}
        <div
          className={`flex-1 flex flex-col items-center justify-center space-y-4 ${
            isDesktop
              ? "mt-40 lg:mt-0 lg:translate-y-60"
              : "mt-12 w-full max-w-md mx-auto"
          }`}
        >
          {/* Small Placeholder */}
          <img
            src="assets/Artistguy.jpg"
            className={`${
              isDesktop ? "w-60 h-60" : "w-48 h-48"
            } bg-purple-400/50 border-2 border-purple-500 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.7)] object-cover`}
          />

          {/* Button */}
          <a href="/about">
            <button
              className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-purple-400 bg-purple-600/20 
               hover:bg-purple-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all duration-300 text-white"
            >
              Find Out More About Us
            </button>
          </a>
        </div>
      </section>

      {/* FAQ SECTION + Contact*/}
      <section
        className={`bg-gradient-to-b from-purple-300 to-purple-400 text-white w-full flex flex-col ${
          isDesktop
            ? "lg:flex-row items-start justify-start gap-12 px-12 py-20 h-[100vh]"
            : "items-center justify-start gap-12 px-6 py-12"
        }`}
      >
        {/* For Tablet: FAQ above contact */}
        {(isTablet || isMobile) && (
          <div className="w-full flex flex-col items-center lg:items-start mb-6">
            <h2 className="text-4xl text-purple-700 font-bold mb-6 text-center lg:text-left">
              FAQ
            </h2>
            <Accordion
              type="single"
              collapsible
              className="space-y-4 w-full pb-8"
            >
              {[
                "How does bidding work?",
                "Are items authenticated?",
                "What payment methods do you accept?",
                "Do you ship internationally?",
              ].map((q, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border border-purple-700 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left bg-purple-400/10 hover:bg-purple-400/20 transition-all text-lg font-medium text-purple-900">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 text-purple-800 bg-purple-200/30 text-base leading-relaxed">
                    This is the answer to "{q}". Lorem ipsum dolor sit amet,
                    consectetur adipiscing elit. Vivamus luctus elit nec justo
                    tempor, sit amet ultricies magna posuere.
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Left Side — Contact Column */}
        <div
          className={`flex flex-col items-center lg:items-start justify-start space-y-6 text-center lg:text-left ${
            isDesktop ? "lg:w-1/3" : "w-full"
          }`}
        >
          {/* Placeholder Image */}
          <img
            src="assets/Callcenter.jpg"
            className={`${
              isDesktop
                ? "w-65 h-70"
                : isTablet
                ? "w-[20vh] h-auto mx-auto"
                : "w-[15vh] h-auto mx-auto"
            } bg-purple-300/20 border-2 border-purple-500 rounded-2xl flex items-center justify-center text-purple-800 font-semibold shadow-[0_0_25px_rgba(168,85,247,0.5)] object-cover`}
          />

          {/* Caption */}
          <p className="text-purple-800 text-lg leading-relaxed">
            Still got unanswered questions?
            <br />
            Or still wondering if{" "}
            <span className="text-purple-700 font-semibold">BidHub</span> is
            right for you?
          </p>

          {/* Glowing Button */}
          <a href="/contact">
            <button
              className="px-8 py-4 mt-2 text-lg font-semibold rounded-xl border-2 border-purple-700 bg-purple-600/20 
           hover:bg-purple-600 hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all duration-300 text-white"
            >
              Chat With Us
            </button>
          </a>
        </div>

        {/* Right Side — FAQ for Desktop */}
        {isDesktop && (
          <div className="lg:w-2/3 w-full flex flex-col overflow-visible">
            <h2 className="text-4xl text-purple-700 font-bold mb-8 text-center lg:text-left">
              FAQ
            </h2>
            <Accordion
              type="single"
              collapsible
              className="space-y-4 w-full pb-12"
            >
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border border-purple-700 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left bg-purple-400/10 hover:bg-purple-400/20 transition-all text-lg font-medium text-purple-900">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 text-purple-800 bg-purple-200/30 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
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
