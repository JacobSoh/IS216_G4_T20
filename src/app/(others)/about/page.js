"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function About() {
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
    <div className="relative min-h-screen text-[var(--theme-cream)] bg-[var(--theme-primary-darker)]">
      {/* === Scrollable Content === */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full py-24 text-center">
          <div className="max-w-5xl mx-auto px-6">
            <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">About Us</h1>
            <p className="text-lg text-[var(--theme-cream)]">
              Discover who we are, what we do, and why we do it.
            </p>
          </div>
        </section>

        {/* Main Content Container */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto bg-[var(--theme-primary)]/90 backdrop-blur-md rounded-2xl shadow-lg px-6 py-12 space-y-16 mb-20"
        >
          {/* About BidHub */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">Why BidHub Exists</h2>
            <p className="leading-relaxed">
              In a world where online marketplaces can be overwhelming and
              opaque, finding affordable goods can feel like a challenge. BidHub
              was created to provide a clear, engaging, and fair real-time
              auction platform that puts transparency and affordability first.
            </p>
          </div>

          {/* Inspiration */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">Our Inspiration</h2>
            <p className="leading-relaxed">
              BidHub draws inspiration from both traditional online carousels
              and Telegram-style auctions, combining the best of both worlds.
              Our goal is to create an intuitive, fast-paced auction experience
              where users can easily discover deals, participate in live
              bidding, and feel confident that the system is fair and
              transparent.
            </p>
          </div>

          {/* How It Works */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">
              How BidHub Helps You
            </h2>
            <p className="leading-relaxed">
              By merging real-time updates with a visually appealing carousel
              interface, BidHub allows users to browse auctions quickly, track
              bidding activity live, and win items at competitive prices. Every
              interaction is designed to be intuitive and trustworthy, ensuring
              that everyone has a fair chance to find affordable goods they
              love.
            </p>
          </div>

          {/* Our Mission */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">Our Mission</h2>
            <p className="leading-relaxed">
              Our mission is to make online auctions accessible, transparent,
              and enjoyable for everyone. We aim to empower users with a
              reliable platform that blends speed, interactivity, and clarity,
              so finding great deals is no longer a guessing game — it’s a
              seamless, exciting experience.
            </p>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">Our Values</h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              <li className="bg-[var(--theme-primary-darker)]/70 p-4 rounded-2xl shadow-sm">
                <strong>Integrity:</strong> We act with honesty and
                transparency.
              </li>
              <li className="bg-[var(--theme-primary-darker)]/70 p-4 rounded-2xl shadow-sm">
                <strong>Innovation:</strong> We embrace creativity and
                continuous improvement.
              </li>
              <li className="bg-[var(--theme-primary-darker)]/70 p-4 rounded-2xl shadow-sm">
                <strong>Excellence:</strong> We strive to deliver the best in
                everything we do.
              </li>
              <li className="bg-[var(--theme-primary-darker)]/70 p-4 rounded-2xl shadow-sm">
                <strong>Community:</strong> We value people and connections.
              </li>
            </ul>
          </div>
          {/* Team */}
          <div>
            <h2 className="text-3xl font-semibold mb-3 text-[var(--theme-cream)]">
              Meet the Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  name: "Benedic",
                  title: "Founder & CEO",
                  img: "/assets/team/benedic.jpg",
                },
                {
                  name: "Jacob",
                  title: "Lead Designer",
                  img: "/assets/team/jacob.jpg",
                },
                {
                  name: "Jared",
                  title: "Developer",
                  img: "/assets/team/jared.jpg",
                },
                {
                  name: "Javen",
                  title: "Marketing Lead",
                  img: "/assets/team/javen.jpg",
                },
                {
                  name: "Joshua",
                  title: "Product Manager",
                  img: "/assets/team/joshua.jpg",
                },
                {
                  name: "Kai Wen",
                  title: "UX Researcher",
                  img: "/assets/team/Kaiwen.jpg",
                },
              ].map((person) => (
                <motion.div
                  key={person.name}
                  className="bg-[var(--theme-primary-darker)]/70 border-2 border-[var(--theme-secondary)] rounded-2xl shadow-sm p-6 text-center hover:shadow-md transition-shadow backdrop-blur"
                  whileHover={{ y: -5, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 120 }}
                >
                  <img
                    src={person.img}
                    alt={person.name}
                    className="w-20 h-20 mx-auto rounded-full mb-4 object-cover"
                  />
                  <h3 className="font-semibold text-[var(--theme-cream)]">
                    {person.name}
                  </h3>
                  <p className="text-sm text-[var(--theme-cream)]">
                    {person.title}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Why Choose Us */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">Why Choose Us</h2>
            <p className="leading-relaxed">
              We stand out because we care deeply about your success. Our
              approach combines strategy, creativity, and technology to deliver
              results that truly matter.
            </p>
          </div>

          {/* Contact */}
          {/* Learn More Header */}
          <div className="w-full mb-6">
            <h2 className="text-3xl font-semibold text-[var(--theme-cream)]">
              Learn More
            </h2>
          </div>

          {/* Buttons Section */}
          <div className="flex flex-col md:flex-row gap-4 mt-4 mb-15 items-center">
            {[
              { text: "Contact", href: "/contact" },
              { text: "How it Works", href: "/how_it_works" },
            ].map((btn) => (
              <Link key={btn.text} href={btn.href}>
                <motion.div
                  whileHover="hover"
                  initial="rest"
                  className="relative inline-block"
                >
                  <motion.button className="text-lg font-medium pr-2 pb-2 rounded-xl shadow-none text-[var(--theme-cream)] bg-transparent">
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
        </motion.section>
      </div>
    </div>
  );
}
