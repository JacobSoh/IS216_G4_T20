'use client';

import { useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import Link from "next/link";
import {
  Login
} from '@/components/LR/index';
import ProtectedLink from "@/components/AuthLink/AuthLink";

export default function Home() {
  const { showAlert } = useAlert();

  useEffect(() => {
    const raw = sessionStorage.getItem('flash');
    if (raw) {
      const { message, variant = 'info' } = JSON.parse(raw);
      showAlert({ message, variant });
      sessionStorage.removeItem('flash');
    };
  }, [showAlert]);

  return (
    <div className='container mx-auto'>
      <div className='mt-16'>
        <div className='flex items-center justify-center'>
          <ProtectedLink
            href="/auction/eba4b077-7107-4f3a-97b5-a9005423974a"
            ModalComponent={<Login/>}
          >
            <button className="bg-[var(--custom-bright-blue)] hover:bg-[var(--custom-ocean-blue)] text-[var(--custom-text-primary)] px-8 py-4 rounded-lg text-lg font-bold transition-all duration-300 shadow-[var(--custom-shadow)] hover:scale-105">
              🏛️ Enter 3D Auction House
            </button>
          </ProtectedLink>
        </div>
      </div>
    </div>
  );
};
