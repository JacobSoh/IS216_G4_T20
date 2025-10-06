'use client';

import { useEffect } from "react";
import { useAlert } from "@/context/AlertContext";

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
          Testing
        </div>
      </div>
    </div>
  );
};
