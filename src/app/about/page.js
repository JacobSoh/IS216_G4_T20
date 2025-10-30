'use client';

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutAndHowItWorks() {
  const howItWorksSteps = [
    {
      title: "Browse Auctions",
      description: "Explore live auctions, discover trending items, and find your favorites.",
      image: "/assets/browse.png", // placeholder
    },
    {
      title: "Place Bids",
      description: "Bid on items easily and securely with real-time updates.",
      image: "/assets/bid.png",
    },
    {
      title: "Win & Collect",
      description: "Win auctions and collect your items hassle-free.",
      image: "/assets/win.png",
    },
  ];

  const aboutSections = [
    {
      title: "Our Mission",
      description: "To connect bidders and sellers worldwide with a seamless, engaging auction experience.",
      image: "/assets/mission.png",
    },
    {
      title: "Our Vision",
      description: "Become the most trusted and interactive online auction platform.",
      image: "/assets/vision.png",
    },
    {
      title: "Our Team",
      description: "A group of passionate developers, designers, and auction enthusiasts.",
      image: "/assets/team.png",
    },
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen px-6 lg:px-20 py-20 space-y-32">

      {/* How It Works Section */}
      <section>
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold text-center mb-16"
        >
          How It Works
        </motion.h1>

        <div className="flex flex-col space-y-24">
          {howItWorksSteps.map((step, index) => (
            <motion.div
              key={index}
              className={`flex flex-col md:flex-row items-center md:space-x-12 ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1 }}
            >
              <div className="md:w-1/2 space-y-4">
                <h2 className="text-3xl font-bold">{step.title}</h2>
                <p className="text-gray-300 text-lg">{step.description}</p>
              </div>
              <div className="md:w-1/2 relative w-full h-64 md:h-80">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-contain animate-float"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section>
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold text-center mb-16"
        >
          About Us
        </motion.h1>

        <div className="flex flex-col space-y-24">
          {aboutSections.map((section, index) => (
            <motion.div
              key={index}
              className={`flex flex-col md:flex-row items-center md:space-x-12 ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1 }}
            >
              <div className="md:w-1/2 space-y-4">
                <h2 className="text-3xl font-bold">{section.title}</h2>
                <p className="text-gray-300 text-lg">{section.description}</p>
              </div>
              <div className="md:w-1/2 relative w-full h-64 md:h-80">
                <Image
                  src={section.image}
                  alt={section.title}
                  fill
                  className="object-contain animate-float"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
