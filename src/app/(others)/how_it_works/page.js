"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const steps = [
  {
    number: 1,
    title: "Discover",
    desc: "We start by understanding your vision, goals, and challenges. Through research and collaboration, we define a clear path forward.",
    icon: "🔍",
  },
  {
    number: 2,
    title: "Design & Build",
    desc: "Our team creates tailored designs and transforms them into interactive, user-friendly digital experiences that work beautifully.",
    icon: "⚙️",
  },
  {
    number: 3,
    title: "Deliver & Support",
    desc: "Once everything is perfect, we launch and provide ongoing support to ensure lasting success and continuous improvement.",
    icon: "🚀",
  },
];

export default function HowItWorks() {
  const [flipped, setFlipped] = useState(Array(steps.length).fill(false));

  const handleFlip = (index) => {
    const newFlipped = [...flipped];
    newFlipped[index] = !newFlipped[index];
    setFlipped(newFlipped);
  };

  // Motion variants for domino rolling effect
  const letterVariants = {
    rest: { y: 0, rotateX: 0, color: "var(--theme-cream)" },
    hover: (i) => ({
      rotateX: [0, 360],
      y: [0, -5, 0],
      color: "#fff",
      transition: { duration: 0.6, delay: i * 0.05, ease: [0.25, 1, 0.5, 1] },
    }),
  };

  return (
    <div className="relative min-h-screen text-[var(--theme-cream)] bg-[var(--theme-primary-darker)] flex flex-col items-center">
      {/* Page Header */}
      <header className="w-full py-8 pt-28 text-center shadow-md">
        <h2 className="text-3xl md:text-4xl font-bold tracking-wide">
          How BidHub Works
        </h2>
      </header>

      {/* Hero Section */}
      <section className="w-full py-10 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg leading-tight">
            Bidding is as easy as 1, 2, 3
          </h1>
          <p className="text-md md:text-lg drop-shadow-md">
            Click on each number to reveal the steps and see how simple it is to
            participate.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="max-w-6xl mx-auto px-6 pt-25 pb-35 grid md:grid-cols-3 gap-16 justify-items-center">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="w-64 h-64 cursor-pointer perspective"
            onClick={() => handleFlip(i)}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ rotateY: flipped[i] ? 180 : 0 }}
              transition={{ duration: 0.8 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front: Number */}
              <div className="absolute w-full h-full border-2 border-[var(--theme-accent)] bg-[var(--theme-primary)] rounded-2xl drop-shadow-[0_0_25px_rgba(168,85,247,0.9)] flex justify-center items-center text-6xl font-bold backface-hidden">
                {step.number}
              </div>

              {/* Back: Step Info */}
              <div className="absolute w-full h-full border-2 border-[var(--theme-accent)] bg-[var(--theme-primary)] rounded-2xl drop-shadow-[0_0_25px_rgba(168,85,247,0.9)] p-6 flex flex-col justify-center items-center text-center rotate-y-180 backface-hidden">
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </section>

      {/* Main Button */}
      <Link href="/featured_auctions">
        <motion.div
          whileHover="hover"
          initial="rest"
          className="relative inline-block"
        >
          <motion.button className="text-[4vh] font-semibold px-4 py-2 rounded-xl shadow-none text-[var(--theme-cream)] bg-transparent">
            {"Ready to get started?".split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                className="inline-block"
              >
                {char === " " ? "\u00A0" : char} {/* preserve spaces */}
              </motion.span>
            ))}
          </motion.button>

          {/* Underline directly under text */}
          <motion.span
            className="absolute left-0 -bottom-0.5 h-[2px] bg-white rounded"
            variants={{
              rest: { width: 0 },
              hover: { width: "100%", transition: { duration: 0.3 } },
            }}
          />
        </motion.div>
      </Link>

      {/* Secondary Buttons */}
      <div className="flex flex-col md:flex-row gap-4 mt-4 mb-15 items-center">
        {[
          { text: "Contact", href: "/contact" },
          { text: "About", href: "/about" },
        ].map((btn) => (
          <Link key={btn.text} href={btn.href}>
            <motion.div
              whileHover="hover"
              initial="rest"
              className="relative inline-block"
            >
              <motion.button className="text-lg font-medium px-4 py-2 rounded-xl shadow-none text-[var(--theme-cream)] bg-transparent">
                {btn.text.split("").map((char, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={letterVariants}
                    className="inline-block"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.button>

              <motion.span
                className="absolute left-0 -bottom-0.5 h-[2px] bg-white rounded"
                variants={{
                  rest: { width: 0 },
                  hover: { width: "100%", transition: { duration: 0.3 } },
                }}
              />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* 3D Flip Styles */}
      <style jsx>{`
        .perspective {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
