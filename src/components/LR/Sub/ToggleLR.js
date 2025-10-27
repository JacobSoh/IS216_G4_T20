'use client';

import { useModal } from '@/context/ModalContext';
import { toast } from 'sonner';
import { supabaseBrowser } from '@/utils/supabase/client';

import Login from '@/components/LR/Login';
import Register from '@/components/LR/Register';
import { validateRegistration } from '@/lib/validators';

import { axiosBrowserClient } from '@/utils/axios/client';

export default function ToggleLR({ isLogin }) {
  const { setModalHeader, setModalState, setModalForm } = useModal();

  const handleToggle = () => {
    if (isLogin) {
      // Switch from Login -> Register
      setModalHeader({ title: 'Registration', description: 'Join us today!' });
      setModalForm({
        isForm: true,
        onSubmit: async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const email = f.get('email')?.toString().trim();
          const password = f.get('password')?.toString().trim();
          const cfmPassword = f.get('cfmPassword')?.toString().trim();
          const username = f.get('username')?.toString().trim();

          if (!validateRegistration(email, username, password, cfmPassword)) return toast.error("Form field isn't accepted. Please recheck requirements.");

          try {
            // Pre-check with server API to see if email/username exists
            const data = await axiosBrowserClient('/auth', {
              params: { email, username }
            });
            if (data.exists) return toast.error("Email already exists.");
            if (data.usernameExists) return toast.error("Username already exists.");

            const origin = typeof window !== 'undefined' ? window.location.origin : ''
            const { error } = await supabaseBrowser().auth.signUp({
              email,
              password,
              options: {
                data: { username },
              }
            })
            if (error) return toast.error(error.message);
            setModalState({ open: false });
            toast.success('Registration success! Please verify your email.');
          } catch (error) {
            toast.error(error?.message || 'Registration failed');
          }
        },
      });
      setModalState({ open: true, content: <Register /> });
    } else {
      // Switch from Register -> Login
      setModalHeader({ title: 'Login', description: 'Welcome back!' });
      setModalForm({
        isForm: true,
        onSubmit: async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const email = f.get('email')?.toString().trim();
          const password = f.get('password')?.toString().trim();
          const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
          if (error) return toast.error(error.message);
          setModalState({ open: false });
          toast.success('Successfully logged in!');
        },
      });
      setModalState({ open: true, content: <Login /> });
    }
  };

  return (
    <p className="mt-4 text-center text-sm/6 text-gray-400">
      {isLogin ? 'Not a member' : 'Already have an account'}?&nbsp;
      <button
        type="button"
        className="font-semibold text-indigo-400 hover:text-indigo-300"
        onClick={handleToggle}
      >
        {isLogin ? 'Join us now' : 'Login'}!
      </button>
    </p>
  );
}
