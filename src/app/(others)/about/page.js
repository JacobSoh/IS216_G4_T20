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
          {/* Who We Are */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">Who We Are</h2>
            <p className="leading-relaxed">
              We are a passionate team dedicated to creating meaningful digital
              experiences. Our goal is to empower businesses and individuals
              with innovative solutions that drive growth, creativity, and
              connection.
            </p>
          </div>

          {/* Mission */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">Our Mission</h2>
            <p className="leading-relaxed">
              Our mission is to deliver exceptional value through design,
              technology, and collaboration — while staying true to our values
              of integrity, innovation, and community.
            </p>
          </div>

          {/* Story */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">Our Story</h2>
            <p className="leading-relaxed">
              Founded in 2021, our journey began with a simple idea: to make
              digital spaces more human-centered. Since then, we’ve grown into a
              dynamic team helping brands build their identity and connect
              authentically with their audiences.
            </p>
          </div>

          {/* What We Do */}
          <div>
            <h2 className="text-3xl font-semibold mb-3">What We Do</h2>
            <ul className="list-disc ml-6 leading-relaxed">
              <li>Custom Web & App Development</li>
              <li>Brand Identity & UI/UX Design</li>
              <li>Content Strategy & Marketing</li>
            </ul>
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
                  name: "Alex Rivera",
                  title: "Founder & CEO",
                  img: "/assets/team/alex.jpg",
                },
                {
                  name: "Jamie Lee",
                  title: "Lead Designer",
                  img: "/assets/team/jamie.jpg",
                },
                {
                  name: "Taylor Smith",
                  title: "Developer",
                  img: "/assets/team/taylor.jpg",
                },
                {
                  name: "Morgan Patel",
                  title: "Marketing Lead",
                  img: "/assets/team/morgan.jpg",
                },
                {
                  name: "Jordan Kim",
                  title: "Product Manager",
                  img: "/assets/team/jordan.jpg",
                },
                {
                  name: "Samira Ali",
                  title: "UX Researcher",
                  img: "/assets/team/samira.jpg",
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
