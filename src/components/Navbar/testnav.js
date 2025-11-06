"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useModal } from "@/context/ModalContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Login from "@/components/LR/Login";
import Register from "@/components/LR/Register";
import { supabaseBrowser } from "@/utils/supabase/client";
import { validateRegistration } from "@/lib/validators";
import { toast } from "sonner";
import getProfile from "@/hooks/getProfile";

export default function BubbleNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false); // mock auth state (unused)
  const { isAuthed, logout } = useSupabaseAuth();
  const { setModalHeader, setModalState, setModalForm } = useModal();
const [userProfile, setUserProfile] = useState(null);


  useEffect(() => {
  const loadProfile = async () => {
    if (!isAuthed) {
      setUserProfile(null);
      return;
    }

    try {
      const user = await getProfile(); // returns a User instance
      setUserProfile(user);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setUserProfile(null);
    }
  };

  loadProfile();
}, [isAuthed]);

  const defaultAvatar =
  "https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/images/profile.jpg";

const avatarUrl =
  userProfile?.avatar_url ||
  (userProfile?.avatar_bucket && userProfile?.object_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${userProfile.avatar_bucket}/${userProfile.object_path}`
    : defaultAvatar);


  const openLogin = () => {
    // Close overlay so modal appears above everything
    setMenuOpen(false);
    setModalHeader({ title: "Login", description: "Welcome back!" });
    setModalForm({
      isForm: true,
      onSubmit: async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = form.get("email")?.toString().trim();
        const password = form.get("password")?.toString().trim();
        const { error } = await supabaseBrowser().auth.signInWithPassword({
          email,
          password,
        });
        if (error) return toast.error(error.message);
        setModalState({ open: false });
        toast.success("Successfully logged in!");
      },
    });
    // Small delay to allow overlay exit animation
    setTimeout(() => setModalState({ open: true, content: <Login /> }), 200);
  };

  const openRegister = () => {
    // Close overlay so modal appears above everything
    setMenuOpen(false);
    setModalHeader({ title: "Registration", description: "Join us today!" });
    setModalForm({
      isForm: true,
      onSubmit: async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = form.get("email")?.toString().trim();
        const password = form.get("password")?.toString().trim();
        const cfmPassword = form.get("cfmPassword")?.toString().trim();
        const username = form.get("username")?.toString().trim();

        if (!validateRegistration(email, username, password, cfmPassword))
          return toast.error(
            "Form field isn't accepted. Please recheck requirements."
          );

        try {
          const q = new URLSearchParams({ email, username }).toString();
          const res = await fetch(`${window.location.origin}/api/auth?${q}`);
          const data = await res.json();
          if (data.exists) return toast.error("Email already exists.");
          if (data.usernameExists)
            return toast.error("Username already exists.");

          const { error } = await supabaseBrowser().auth.signUp({
            email,
            password,
            options: {
              data: { username },
            },
          });
          if (error) return toast.error(error.message);
          setModalState({ open: false });
          toast.success("Registration success! Please verify your email.");
        } catch (error) {
          toast.error(error?.message || "Registration failed");
        }
      },
    });
    // Small delay to allow overlay exit animation
    setTimeout(() => setModalState({ open: true, content: <Register /> }), 200);
  };



  const imageItems = [
  {
    src: "https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/images/Kidshomedrawing.jpg",
    alt: "Home",
  },
  {
    src: "https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/images/gavel.jpg",
    alt: "Auctions",
  },
  {
    src: "https://teiunfcrodktaevlilhm.supabase.co/storage/v1/object/public/images/stuff.jpg",
    alt: "Categories",
  },
  {
    src: avatarUrl, // ← dynamically shows user avatar
    alt: userProfile?.username || "Profile",
  },
];


  const baseLinks = [
    { name: "Home", href: "/" },
    { name: "Auctions", href: "/featured_auctions" },
    { name: "Categories", href: "/categories" },
  ];
  const navLinks = isAuthed
    ? [
        ...baseLinks,
        { name: "Dashboard", href: "/auction/seller" },
        { name: "Profile", href: "/profile" },
      ]
    : baseLinks; // Hide Profile when not logged in

  return (
    <nav className="fixed top-0 right-0 w-auto flex justify-end items-start p-6 z-[9999]">
      {/* Hamburger / Close button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative z-[10000] h-[44px] w-[44px] flex items-center justify-center bg-[var(--nav-bg)] rounded-md text-white hover:bg-[var(--nav-hover-bg)] shadow-xl transition-all duration-300"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Expanding Bubble Background */}
            <motion.div
              key="bubble-bg"
              initial={{ scale: 0 }}
              animate={{ scale: 60 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 70, damping: 15 }}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-[var(--theme-accent)] origin-center z-[9998]"
            />

            {/* Full Menu Overlay */}
            <motion.div
              key="menu-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.25 }}
              className="fixed inset-0 bg-[var(--theme-accent)] flex flex-col md:flex-row items-center justify-between px-10 py-20 z-[9999]"
            >
              {/* TOP-RIGHT — Auth buttons beside close */}
              <motion.div
                className="absolute top-6 right-24 flex items-center gap-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {isAuthed ? (
                  <motion.button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="h-[44px] px-5 inline-flex items-center justify-center rounded-md bg-[var(--theme-gold)] text-[var(--nav-cta-text)] hover:bg-[var(--nav-cta-hover-bg)] shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Logout
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      onClick={openLogin}
                      className="h-[44px] px-5 inline-flex items-center justify-center rounded-md bg-[var(--theme-gold)] text-[var(--nav-cta-text)] hover:bg-[var(--nav-cta-hover-bg)] shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Login
                    </motion.button>
                    <motion.button
                      onClick={openRegister}
                      className="h-[44px] px-5 inline-flex items-center justify-center rounded-md bg-[var(--theme-primary)] text-white hover:bg-[var(--nav-hover-bg)] shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Register
                    </motion.button>
                  </>
                )}
              </motion.div>
              {/* LEFT SIDE — Floating Image Grid */}
             <div className="hidden md:grid grid-cols-2 gap-x-8 gap-y-8 md:w-full lg:w-5/12 justify-items-center items-center px-4 sm:px-6 lg:px-0">
  {/* Left Column */}
  <motion.div
    onMouseEnter={() => setHoveredCol(0)}
    onMouseLeave={() => setHoveredCol(null)}
    className="flex flex-col gap-4 sm:gap-6 lg:gap-8 w-full items-center"
    initial={{ y: -50 }}
    animate={{ y: hoveredCol === 0 ? 30 : -50 }}
    transition={{ type: "spring", stiffness: 100, damping: 14 }}
  >
    {imageItems.slice(0, 2).map((item, i) => {
      const isHovered = hoveredLink === i;
      return (
        <motion.img
          key={i}
          src={item.src}
          alt={item.alt}
          className={`w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-cover rounded-sm shadow-[0_0_40px_rgba(147,51,234,0.5)]
            transition-all duration-500 ease-in-out ${isHovered ? "grayscale-0 scale-105" : "grayscale"}`}
          whileHover={{ y: 10 }}
        />
      );
    })}
  </motion.div>

  {/* Right Column */}
  <motion.div
    onMouseEnter={() => setHoveredCol(1)}
    onMouseLeave={() => setHoveredCol(null)}
    className="flex flex-col gap-4 sm:gap-6 lg:gap-8 w-full items-center"
    initial={{ y: 60 }}
    animate={{ y: hoveredCol === 1 ? 30 : 60 }}
    transition={{ type: "spring", stiffness: 100, damping: 14 }}
  >
    {imageItems.slice(2, 4).map((item, i) => {
      const index = i + 2;
      const isHovered = hoveredLink === index;
      return (
        <motion.img
          key={index}
          src={item.src}
          alt={item.alt}
          className={`w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-cover rounded-sm shadow-[0_0_40px_rgba(147,51,234,0.5)]
            transition-all duration-500 ease-in-out ${isHovered ? "grayscale-0 scale-105" : "grayscale"}`}
          whileHover={{ y: 10 }}
        />
      );
    })}
  </motion.div>
</div>


              {/* RIGHT SIDE — Nav Links */}
              <motion.ul
                className="flex flex-col items-center md:items-end space-y-4 lg:text-7xl md:text-3xl sm:text-4xl font-semibold text-[var(--theme-primary)] md:w-1/2"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {navLinks.map((link, i) => {
                  const isHovered = hoveredLink === i;
                  return (
                    <motion.li
                      key={link.name}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      onMouseEnter={() => setHoveredLink(i)}
                      onMouseLeave={() => setHoveredLink(null)}
                      className="cursor-pointer mr-5 relative flex gap-0"
                    >
                      <a
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="relative flex gap-0"
                      >
                        {link.name.split("").map((char, idx) => (
                          <motion.span
                            key={idx}
                            className={`inline-block transition-colors duration-300 ${
                              isHovered
                                ? "text-white"
                                : "text-[var(--theme-primary)]"
                            }`}
                            animate={
                              isHovered
                                ? { rotateX: [0, 360], y: [0, -5, 0] }
                                : { rotateX: 0, y: 0 }
                            }
                            transition={
                              isHovered
                                ? {
                                    duration: 0.6,
                                    delay: idx * 0.03,
                                    ease: [0.25, 1, 0.5, 1],
                                  }
                                : {}
                            }
                          >
                            {char}
                          </motion.span>
                        ))}
                        <span
                          className={`absolute left-0 -bottom-1 h-[4px] bg-white transition-all duration-300 ${
                            isHovered ? "w-full" : "w-0"
                          }`}
                        />
                      </a>
                    </motion.li>
                  );
                })}
              </motion.ul>

              {/* BOTTOM-RIGHT BUTTONS (About/Contact) */}
              <motion.div
                className="absolute bottom-8 right-23 flex flex-row space-x-5 items-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {["About", "How it works", "Contact"].map((text, i) => {
                  const href = `/${text.toLowerCase().replace(/\s+/g, "_")}`;

                  return (
                    <motion.a
                      key={text}
                      href={href}
                      className="relative cursor-pointer lg:text-12px sm:text-8px font-semibold text-[var(--theme-primary)]"
                      whileHover="hover"
                      initial="rest"
                      animate="rest"
                      variants={{
                        rest: { opacity: 1, y: 0 },
                        hover: { opacity: 1, y: -2 },
                      }}
                    >
                      {/* Rolling letter animation */}
                      {text.split("").map((char, idx) => (
                        <motion.span
                          key={idx}
                          className="inline-block transition-colors duration-300"
                          variants={{
                            rest: {
                              rotateX: 0,
                              y: 0,
                              color: "var(--theme-primary)",
                            },
                            hover: {
                              rotateX: [0, 360],
                              y: [0, -5, 0],
                              color: "#fff",
                              transition: {
                                duration: 0.6,
                                delay: idx * 0.05,
                                ease: [0.25, 1, 0.5, 1],
                              },
                            },
                          }}
                        >
                          {/* ✅ Preserve spaces visually */}
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}

                      {/* Underline effect */}
                      <motion.span
                        className="absolute left-0 -bottom-1 h-[3px] bg-white"
                        variants={{
                          rest: { width: 0 },
                          hover: {
                            width: "100%",
                            transition: { duration: 0.3 },
                          },
                        }}
                      />
                    </motion.a>
                  );
                })}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
