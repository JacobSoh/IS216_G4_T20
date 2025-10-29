'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar02 } from '@/components/ui/shadcn-io/navbar-02';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useModal } from '@/context/ModalContext';
import { toast } from 'sonner';
import Login from '@/components/LR/Login';
import Register from '@/components/LR/Register';
import { supabaseBrowser } from '@/utils/supabase/client';
import { validateRegistration } from '@/lib/validators';
// replaced axiosBrowserClient with fetch

// Navigation items are defined in the Navbar02 component

export default function Navbar({ isAuthed: initialAuthed } = {}) {
  const router = useRouter();
  const autoOpenedRef = useRef(false);
  const { isAuthed, logout } = useSupabaseAuth(initialAuthed);
  const { setModalHeader, setModalState, setModalForm } = useModal();

  // Using defaultNavigationLinks from Navbar02; keep local list for future if needed.

  const openLogin = () => {
    setModalHeader({ title: 'Login', description: 'Welcome back!' });
    setModalForm({
      isForm: true,
      onSubmit: async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = form.get('email')?.toString().trim();
        const password = form.get('password')?.toString().trim();
        const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
        if (error) return toast.error(error.message);
        setModalState({ open: false });
        toast.success('Successfully logged in!');
        try {
          const next = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('next') : null;
          if (next) router.replace(next);
        } catch { }
      },
    });
    setModalState({ open: true, content: <Login /> });
  };

  const openRegister = () => {
    setModalHeader({ title: 'Registration', description: 'Join us today!' });
    setModalForm({
      isForm: true,
      onSubmit: async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = form.get('email')?.toString().trim();
        const password = form.get('password')?.toString().trim();
        const cfmPassword = form.get('cfmPassword')?.toString().trim();
        const username = form.get('username')?.toString().trim();

        if (!validateRegistration(email, username, password, cfmPassword)) return toast.error("Form field isn't accepted. Please recheck requirements.");

        try {
          // Pre-check with server API to see if email/username exists
          const q = new URLSearchParams({ email, username }).toString();
          const res = await fetch(`${window.location.origin}/api/auth?${q}`);
          const data = await res.json();
          console.log(data);
          if (data.exists) return toast.error("Email already exists.");
          if (data.usernameExists) return toast.error("Username already exists.");

          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const { error } = await supabaseBrowser().auth.signUp({
            email,
            password,
            options: {
              data: { username },
            },
          });

          if (error) return toast.error(error.message);
          setModalState({ open: false });
          toast.success('Registration success! Please verify your email.');
        } catch (error) {
          toast.error(error?.message || 'Registration failed');
        }
      },
    });
    setModalState({ open: true, content: <Register /> });
  };

  const signInText = isAuthed ? 'Logout' : 'Login';
  const ctaText = isAuthed ? 'Profile' : 'Join Us';

  const onSignInClick = async () => {
    if (isAuthed) {
      // Instant logout + redirect handled inside hook
      logout({ redirectTo: '/' });
      // Optional: no toast due to immediate navigation; keep UX clean
    } else {
      openLogin();
    }
  };

  const onCtaClick = () => {
    if (isAuthed) {
      router.push('/profile');
    } else {
      openRegister();
    }
  };

  // Note: removed route-based effects to avoid any path-dependent rendering

  // Build nav links with contextual Auction menu
  const auctionMenu = {
    label: 'Auction',
    submenu: true,
    type: 'simple',
    items: [
      { href: '/', label: 'Browse Auctions' },
      ...(isAuthed ? [{ href: '/auction/seller', label: 'Manage Auctions' }] : []),
    ],
  };

  const navigationLinks = [
    auctionMenu,
    { href: '/categories', label: 'Categories', icon: 'BarChart3' },
    {
      label: 'About Us',
      submenu: true,
      type: 'simple',
      items: [
        { href: '/about', label: 'Overview' },
        { href: '/how_it_works', label: 'How It Works' },
        { href: '/contact', label: 'Contact Us' },
      ],
    },
  ];

  return (
    <Navbar02
      className="fixed inset-x-0 top-0 z-50 bg-[var(--nav-bg)] text-white"
      logoHref="/"
      brandText="BidHub"
      navigationLinks={navigationLinks}
      signInText={signInText}
      onSignInClick={onSignInClick}
      ctaText={ctaText}
      ctaHref={isAuthed ? '/profile' : undefined}
      onCtaClick={onCtaClick}
    />
  );
}
