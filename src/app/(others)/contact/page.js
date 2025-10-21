'use client';

import { useState } from "react";
import { supabaseBrowser } from "@/utils/supabase/client";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Insert the form data into the 'enquiry' table
      const { data, error } = await supabaseBrowser()
        .from("enquiry")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
          },
        ]);

      if (error) throw error;

      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Error submitting enquiry:", err);
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Placeholder members list
  const members = [
    { name: "Member One", github: "#", email: "member1@example.com" },
    { name: "Member Two", github: "#", email: "member2@example.com" },
    { name: "Member Three", github: "#", email: "member3@example.com" },
    { name: "Member Four", github: "#", email: "member4@example.com" },
    { name: "Member Five", github: "#", email: "member5@example.com" },
    { name: "Member Six", github: "#", email: "member6@example.com" },
  ];

  return (
    <section className="min-h-screen relative pt-10 bg-gradient-to-b from-[#fff5e1] to-[#ffefea]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">Contact Us</h2>
          <p className="text-lg text-gray-700">Reach out to us for any enquiries or issues</p>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {members.map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition flex flex-col items-center text-center">
              <div className="w-24 h-24 mb-4 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-lg">IMG</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">{m.name}</h3>
              <p className="text-gray-600 mb-1">
                GitHub: <a href={m.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{m.github}</a>
              </p>
              <p className="text-gray-600">
                Email: <a href={`mailto:${m.email}`} className="text-blue-600 hover:underline">{m.email}</a>
              </p>
            </div>
          ))}
        </div>

        {/* Enquiry Form */}
        <div className="w-full sm:w-[calc(100%+1.5rem)] md:w-[calc(100%+3rem)] lg:w-[calc(100%+4.5rem)] max-w-[1600px] mx-auto bg-white p-8 rounded-2xl shadow-md">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">Send Us an Enquiry</h3>

          {success === true && <p className="text-green-600 mb-4">Thank you! Your enquiry has been submitted.</p>}
          {success === false && <p className="text-red-600 mb-4">Oops! Something went wrong. Please try again.</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="flex-1 p-3 border rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="flex-1 p-3 border rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full p-3 border rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              {isSubmitting ? "Sending..." : "Send Enquiry"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
