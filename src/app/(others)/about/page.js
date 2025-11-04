"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function About() {
  // Motion variants for the link animations
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
      {/* === Main Content === */}
      <div className="relative z-10 flex flex-col items-center">
        {/* === Hero Section === */}
        <section className="w-full py-16 sm:py-20 md:py-24 text-center px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
              About Us
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-[var(--theme-cream)]/90">
              Discover who we are, what we do, and why we do it.
            </p>
          </div>
        </section>

        {/* === About Section === */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto bg-[var(--theme-primary)]/90 backdrop-blur-md rounded-2xl shadow-lg px-4 sm:px-8 md:px-10 py-10 sm:py-12 space-y-16 mb-20"
        >
          {/* Why BidHub Exists */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
              Why BidHub Exists
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              In a world where online marketplaces can be overwhelming and
              opaque, finding affordable goods can feel like a challenge. BidHub
              was created to provide a clear, engaging, and fair real-time
              auction platform that puts transparency and affordability first.
            </p>
          </div>

          {/* Our Inspiration */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
              Our Inspiration
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
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
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
              How BidHub Helps You
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              By merging real-time updates with a visually appealing carousel
              interface, BidHub allows users to browse auctions quickly, track
              bidding activity live, and win items at competitive prices.
            </p>
          </div>

          {/* Mission */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
              Our Mission
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              Our mission is to make online auctions accessible, transparent,
              and enjoyable for everyone. We aim to empower users with a
              reliable platform that blends speed, interactivity, and clarity.
            </p>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
              Our Values
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["Integrity", "We act with honesty and transparency."],
                ["Innovation", "We embrace creativity and improvement."],
                ["Excellence", "We strive to deliver the best."],
                ["Community", "We value people and connections."],
              ].map(([title, desc]) => (
                <li
                  key={title}
                  className="bg-[var(--theme-primary-darker)]/70 p-4 sm:p-5 rounded-2xl shadow-sm text-sm sm:text-base"
                >
                  <strong>{title}:</strong> {desc}
                </li>
              ))}
            </ul>
          </div>

          {/* Team Section */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-center">
              Meet the Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { name: "Benedic", title: "Founder & CEO", img: "/assets/team/benedic.jpg" },
                { name: "Jacob", title: "Lead Designer", img: "/assets/team/jacob.jpg" },
                { name: "Jared", title: "Developer", img: "/assets/team/jared.jpg" },
                { name: "Javen", title: "Marketing Lead", img: "/assets/team/javen.jpg" },
                { name: "Joshua", title: "Product Manager", img: "/assets/team/joshua.jpg" },
                { name: "Kai Wen", title: "UX Researcher", img: "/assets/team/Kaiwen.jpg" },
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
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full mb-4 object-cover"
                  />
                  <h3 className="font-semibold text-[var(--theme-cream)] text-base sm:text-lg">
                    {person.name}
                  </h3>
                  <p className="text-sm text-[var(--theme-cream)]/90">
                    {person.title}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Why Choose Us */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
              Why Choose Us
            </h2>
            <p className="text-sm sm:text-base md:text-lg leading-relaxed">
              We stand out because we care deeply about your success. Our
              approach combines strategy, creativity, and technology to deliver
              results that truly matter.
            </p>
          </div>

          {/* Learn More Buttons */}
          <div className="w-full mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-center">
              Learn More
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
          </div>
        </motion.section>
      </div>
    </div>
  );
}
