'use client';

import { Spinner } from '@/components/ui/spinner';

export default function BlockingOverlay({ show, message = 'Loading…', className = '' }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className={`bg-slate-800 border border-slate-700 text-white rounded-md px-6 py-4 flex items-center gap-3 shadow-xl ${className}`}>
        <Spinner className="size-5" />
        <span>{message}</span>
      </div>
    </div>
  );
}

