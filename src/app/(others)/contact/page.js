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
      const { data, error } = await supabaseBrowser()
        .from("enquiry")
        .insert([formData]);

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

  return (
    <section className="min-h-screen flex items-center justify-center bg-[var(--theme-primary-darker)] py-20">
      <div className="w-full max-w-3xl bg-[var(--theme-primary)]/90 backdrop-blur-md p-8 rounded-2xl shadow-lg">
        <h2 className="text-4xl font-bold mb-6 text-[var(--theme-cream)] text-center">
          Contact Us
        </h2>
        <p className="text-[var(--theme-cream)] mb-6 text-center">
          Reach out to us for any enquiries or issues
        </p>

        {success === true && (
          <p className="text-green-400 mb-4 text-center">
            Thank you! Your enquiry has been submitted.
          </p>
        )}
        {success === false && (
          <p className="text-red-400 mb-4 text-center">
            Oops! Something went wrong. Please try again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="flex-1 p-3 border border-[var(--theme-cream)] rounded-md bg-[var(--theme-primary-darker)] text-[var(--theme-cream)] placeholder-[var(--theme-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="flex-1 p-3 border border-[var(--theme-cream)] rounded-md bg-[var(--theme-primary-darker)] text-[var(--theme-cream)] placeholder-[var(--theme-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
            />
          </div>

          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full p-3 border border-[var(--theme-cream)] rounded-md bg-[var(--theme-primary-darker)] text-[var(--theme-cream)] placeholder-[var(--theme-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
          />

          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            className="w-full p-3 border border-[var(--theme-cream)] rounded-md bg-[var(--theme-primary-darker)] text-[var(--theme-cream)] placeholder-[var(--theme-cream)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--theme-accent)] text-[var(--theme-primary-darker)] py-3 rounded-md font-semibold hover:opacity-90 transition"
          >
            {isSubmitting ? "Sending..." : "Send Enquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}
