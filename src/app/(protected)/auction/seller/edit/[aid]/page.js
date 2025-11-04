'use client';

import { useEffect, useState } from 'react';
import { useModal } from '@/context/ModalContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import CreateEvent from '@/components/Auction/Create/Event';
import CreateItem from '@/components/Auction/Create/Item';
import ItemCard from '@/components/Auction/Create/ItemCard';
import { Button } from '@/components/ui/button';
import { ArrowBigLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AuctionEditPage() {
  const { aid } = useParams();

  const router = useRouter();
  const { setModalHeader, setModalState, setModalForm, setModalFooter } = useModal();
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadAuction() {
      try {
        // Fetch auction core data
        const res = await fetch(`/api/auctions/${aid}`, { cache: 'no-store' });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to fetch auction');
        }
        const payload = await res.json();
        if (!ignore) setAuction(payload.record);

        // Fetch items via live snapshot
        const liveRes = await fetch(`/api/auctions/${aid}/live`, { cache: 'no-store' });
        if (liveRes.ok) {
          const live = await liveRes.json();
          const serverItems = live?.record?.items ?? [];
          const mapped = serverItems.map((it) => ({
            id: it.iid,
            itemName: it.title ?? '',
            itemDescription: it.description ?? '',
            minBid: Number(it.min_bid ?? 0),
            bidIncrement: Number(it.bid_increment ?? 0),
            category: it.category ?? '',
            files: [], // existing images are represented via filePreviews only
            filePreviews: it.imageUrl ? [it.imageUrl] : []
          }));
          if (!ignore) setItems(mapped);
        }
      } catch (e) {
        if (!ignore) setLoadError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    if (aid) loadAuction();
    return () => { ignore = true; };
  }, [aid]);

  // Handler for adding a new item
  const handleAddItem = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const itemName = form.get("itemName")?.toString().trim() || "";
    const itemDescription = form.get("itemDescription")?.toString().trim() || ""; // Add this
    const minBid = form.get("minBid")?.toString().trim() || "0";
    const bidIncrement = form.get("bidIncrement")?.toString().trim() || "0";
    const category = form.get("category")?.toString().trim() || "";

    const fileInput = e.currentTarget.querySelector('input[name="itemFile"]');
    const files = fileInput?.files ? Array.from(fileInput.files) : [];

    if (!itemName || !minBid || !category || files.length === 0) {
      toast.warning("Please fill in all required item fields");
      return;
    }

    const filePreviews = files.map(file => URL.createObjectURL(file));

    const newItem = {
      id: Date.now(),
      itemName,
      itemDescription, // Add this
      minBid: parseFloat(minBid) || 0,
      bidIncrement: parseFloat(bidIncrement) || 0,
      category,
      files,
      filePreviews
    };

    setItems((prev) => [...prev, newItem]);
    setModalState({ open: false });
  };


  // Handler for editing an existing item
  const handleEditItem = (item) => {
    setModalForm({
      isForm: true,
      onSubmit: (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        const itemName = form.get("itemName")?.toString().trim() || "";
        const itemDescription = form.get("itemDescription")?.toString().trim() || ""; // Add this
        const minBid = form.get("minBid")?.toString().trim() || "0";
        const bidIncrement = form.get("bidIncrement")?.toString().trim() || "0";
        const category = form.get("category")?.toString().trim() || "";

        const fileInput = e.currentTarget.querySelector('input[name="itemFile"]');
        const files = fileInput?.files && fileInput.files.length > 0
          ? Array.from(fileInput.files)
          : item.files;

        let filePreviews;
        if (fileInput?.files && fileInput.files.length > 0) {
          item.filePreviews.forEach(url => URL.revokeObjectURL(url));
          filePreviews = files.map(file => URL.createObjectURL(file));
        } else {
          filePreviews = item.filePreviews;
        }

        setItems(prev => prev.map(i =>
          i.id === item.id
            ? {
              ...i,
              itemName,
              itemDescription, // Add this
              minBid: parseFloat(minBid) || 0,
              bidIncrement: parseFloat(bidIncrement) || 0,
              category,
              files,
              filePreviews
            }
            : i
        ));

        setModalState({ open: false });
      }
    });

    setModalHeader({ title: 'Edit Auction Item' });
    setModalState({
      open: true,
      content: <CreateItem maxLength={5} initialData={item} />
    });
    setModalFooter({ submitText: "Update Item" });
  };

  // Handler for deleting an item
  const handleDeleteItem = (itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(prev => {
        const itemToDelete = prev.find(i => i.id === itemId);
        if (itemToDelete) {
          itemToDelete.filePreviews.forEach(url => URL.revokeObjectURL(url));
        }
        return prev.filter(i => i.id !== itemId);
      });
    }
  };

  // Handler for opening the Add Item modal
  const handleOpenAddItemModal = () => {
    setModalForm({
      isForm: true,
      onSubmit: handleAddItem
    });
    setModalHeader({ title: 'Add Auction Item' });
    setModalState({
      open: true,
      content: <CreateItem maxLength={5} />
    });
    setModalFooter({ submitText: "Add Item" });
  };

  // Main handler for updating the auction via API
  const handleUpdateAuction = async (e) => {
    e.preventDefault();
    if (!auction) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const form = new FormData(e.currentTarget);

      // 1. Get form data
      const auctionName = form.get("auctionName")?.toString().trim() || "";
      const auctionDescription = form.get("auctionDescription")?.toString().trim() || "";
      const startDateTime = form.get("startDateTime")?.toString().trim() || "";
      // const timeInterval = Number(form.get("timeInterval") || 0) * 60;

      // Validate required fields
      const missing = [];
      if (!auctionName) missing.push("Auction Name");
      if (!startDateTime) missing.push("Start Datetime");
      if (missing.length > 0) {
        toast.warning(`Please fill in the following fields:\n${missing.join('\n')}`);
        setIsSubmitting(false);
        return;
      }

      const fileInput = e.currentTarget.querySelector('input[name="auctionFile"]');
      const auctionFile = fileInput?.files?.[0];

      // 2. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.warning("You must be logged in to update an auction");
        setIsSubmitting(false);
        return;
      }

      // 3. Optionally upload new thumbnail to storage if provided
      let thumbnailBucket = auction?.thumbnail_bucket ?? 'thumbnail';
      let objectPath = auction?.object_path ?? null;
      if (auctionFile) {
        const fileExt = auctionFile.name.split('.').pop();
        const thumbnailFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
          .from('thumbnail')
          .upload(thumbnailFileName, auctionFile);
        if (thumbnailError) {
          toast.warning(`Error uploading thumbnail: ${thumbnailError.message}`);
          setIsSubmitting(false);
          return;
        }
        thumbnailBucket = 'thumbnail';
        objectPath = thumbnailUpload.path;
      }

      // 4. Submit update via API
      const updatePayload = {
        oid: auction?.oid ?? user.id,
        name: auctionName,
        description: auctionDescription || null,
        start_time: startDateTime,
        thumbnail_bucket: thumbnailBucket,
        object_path: objectPath
      };

      const res = await fetch(`/api/auctions/${aid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update auction');
      }

      toast.success('Auction updated successfully!');
      router.replace('/auction/seller');

    } catch (error) {
      console.error('❌ Unexpected error updating auction:', error);
      toast.warning(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className='flex flex-row justify-start items-center gap-4'>
        <Button
          variant="brand"
          onClick={() => window.location.href = '/auction/seller'}
        >
          <ArrowBigLeft /> Back
        </Button>
        <h1 className={`text-4xl font-bold text-[var(--theme-gold)]`}>
        Edit Auction
      </h1>
      </div>
      
      {loading ? (
        <p className="mt-6">Loading auction...</p>
      ) : loadError ? (
        <p className="mt-6 text-red-500">{loadError}</p>
      ) : (
      <form id="auctionEdit" onSubmit={handleUpdateAuction}>
        {/* Auction Details Section */}
        <CreateEvent initialData={{
          auctionName: auction?.name ?? '',
          auctionDescription: auction?.description ?? '',
          startDateTime: auction?.start_time ?? null,
          timeIntervalMinutes: auction?.time_interval ? Math.max(1, Math.floor(Number(auction.time_interval) / 60)) : 1,
          existingFiles: auction?.thumbnailUrl ? [auction.thumbnailUrl] : null,
        }} />

        {/* Auction Items Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Auction Items</h2>
              {items.length > 0 && (
                <span className="bg-brand text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {items.length}
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="brand"
              onClick={handleOpenAddItemModal}
              className="flex items-center gap-2"
            >
              <Plus />
              Add Item
            </Button>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-12 ring-2 ring-[var(--theme-primary)] border-gray-300 rounded-lg">
              <p className="text-gray-500">Click &quot;Add Item&quot; to start adding items to your auction</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEditItem(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            variant="brand"
            disabled={isSubmitting}
            className="px-8 py-3"
          >
            {isSubmitting ? 'Updating Auction...' : 'Save Changes'}
          </Button>
        </div>
      </form>
      )}
    </>
  );
}
