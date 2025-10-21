'use client';

import AuctionCreateForm from '../../../components/auctionCreate/AuctionCreateForm';

export default function AuctionCreatePage() {
  return (
    <div className="h-screen w-screen bg-[var(--custom-bg-primary)] flex items-center justify-center">
      <AuctionCreateForm />
    </div>
  );
}
