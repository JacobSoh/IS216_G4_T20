'use client';

import { useState } from 'react';
import { useModal } from '@/context/ModalContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import CreateEvent from '@/components/Auction/Create/Event';
import CreateItem from '@/components/Auction/Create/Item';
import ItemCard from '@/components/Auction/Create/ItemCard';
import { Button } from '@/components/ui/button';

export default function AuctionCreatePage() {
  const router = useRouter();
  const { setModalHeader, setModalState, setModalForm, setModalFooter } = useModal();
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    alert("Please fill in all required item fields");
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

  // Main handler for creating the auction and saving to database
 const handleCreateAuction = async (e) => {
  e.preventDefault();
  
  console.log("🔍 === DEBUGGING FORM SUBMISSION ===");
  
  if (items.length === 0) {
    alert("Please add at least one item to the auction");
    return;
  }

  setIsSubmitting(true);

  try {
    const supabase = createClient();
    const form = new FormData(e.currentTarget);

    // DEBUG: Show ALL form fields
    console.log("📋 All form fields:");
    for (let [key, value] of form.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: "${value}"`);
      }
    }

    // 1. Get form data
    const auctionName = form.get("auctionName")?.toString().trim() || "";
    const auctionDescription = form.get("auctionDescription")?.toString().trim() || "";
    const startDateTime = form.get("startDateTime")?.toString().trim() || "";
    const endDateTime = form.get("endDateTime")?.toString().trim() || "";
    
    console.log("\n📊 Extracted values:");
    console.log("  auctionName:", auctionName || "❌ EMPTY");
    console.log("  auctionDescription:", auctionDescription || "⚠️ EMPTY");
    console.log("  startDateTime:", startDateTime || "❌ EMPTY");
    console.log("  endDateTime:", endDateTime || "❌ EMPTY");
    
    // Validate required fields
    const missing = [];
    if (!auctionName) missing.push("Auction Name");
    if (!startDateTime) missing.push("Start Datetime");
    if (!endDateTime) missing.push("End Datetime");
    
    if (missing.length > 0) {
      console.log("\n❌ Missing fields:", missing);
      alert(`Please fill in the following fields:\n${missing.join('\n')}`);
      setIsSubmitting(false);
      return;
    }

    const fileInput = e.currentTarget.querySelector('input[name="auctionFile"]');
    const auctionFile = fileInput?.files?.[0];

    console.log("\n📁 File check:");
    console.log("  fileInput element:", fileInput ? "✅ Found" : "❌ Not found");
    console.log("  files count:", fileInput?.files?.length || 0);
    console.log("  auctionFile:", auctionFile ? `✅ ${auctionFile.name}` : "❌ No file");

    if (!auctionFile) {
      alert("Please upload an auction thumbnail image");
      setIsSubmitting(false);
      return;
    }

    console.log("\n✅ All validations passed! Proceeding with upload...");

    // 2. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("You must be logged in to create an auction");
      setIsSubmitting(false);
      return;
    }

    console.log("👤 User:", user.id);

    // 3. Upload auction thumbnail to storage
    const fileExt = auctionFile.name.split('.').pop();
    const thumbnailFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    console.log("📤 Uploading thumbnail:", thumbnailFileName);

    const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
      .from('thumbnail')
      .upload(thumbnailFileName, auctionFile);

    if (thumbnailError) {
      console.error('❌ Thumbnail upload error:', thumbnailError);
      alert(`Error uploading thumbnail: ${thumbnailError.message}`);
      setIsSubmitting(false);
      return;
    }

    console.log("✅ Thumbnail uploaded:", thumbnailUpload.path);

    // 4. Insert auction into database
    const auctionPayload = {
      oid: user.id,
      name: auctionName,
      description: auctionDescription || null,
      start_time: startDateTime,
      end_time: endDateTime,
      thumbnail_bucket: 'thumbnail',
      object_path: thumbnailUpload.path,
      time_interval: 60,
    };

    console.log("💾 Creating auction with payload:", auctionPayload);

    const { data: auctionData, error: auctionError } = await supabase
      .from('auction')
      .insert(auctionPayload)
      .select()
      .single();

    if (auctionError) {
      console.error('❌ Auction creation error:', auctionError);
      alert(`Error creating auction: ${auctionError.message}`);
      setIsSubmitting(false);
      return;
    }

    console.log('✅ Auction created:', auctionData);

    // 5. Process each item
    for (const item of items) {
      try {
        console.log(`\n📦 Processing item: ${item.itemName}`);

        // Upload item images to storage
        const uploadedImagePaths = [];
        
        for (const file of item.files) {
          const itemFileExt = file.name.split('.').pop();
          const itemFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${itemFileExt}`;
          
          console.log(`  📤 Uploading image: ${itemFileName}`);

          const { data: itemImageUpload, error: itemImageError } = await supabase.storage
            .from('item')
            .upload(itemFileName, file);

          if (itemImageError) {
            console.error('  ❌ Item image upload error:', itemImageError);
            throw new Error(`Failed to upload image for ${item.itemName}`);
          }

          uploadedImagePaths.push(itemImageUpload.path);
          console.log(`  ✅ Image uploaded: ${itemImageUpload.path}`);
        }

        // Insert item into database
        const itemPayload = {
          aid: auctionData.aid,
          oid: user.id,
          title: item.itemName,
          description: item.itemDescription || '', 
          min_bid: item.minBid,
          bid_increment: item.bidIncrement || null,
          item_bucket: 'item',
          object_path: uploadedImagePaths[0] || '',
          sold: false,
        };

        console.log('  💾 Creating item with payload:', itemPayload);

        const { data: itemData, error: itemError } = await supabase
          .from('item')
          .insert(itemPayload)
          .select()
          .single();

        if (itemError) {
          console.error('  ❌ Item creation error:', itemError);
          throw new Error(`Failed to create item: ${item.itemName}`);
        }

        console.log('  ✅ Item created:', itemData.iid);

        // Link item to category
        if (item.category) {
          console.log(`  🔗 Linking category: ${item.category}`);

          const { error: categoryError } = await supabase
            .from('item_category')
            .insert({
              itemid: itemData.iid,
              category_name: item.category
            });

          if (categoryError) {
            console.error('  ⚠️ Category link error:', categoryError);
            console.warn(`Failed to link category for ${item.itemName}`);
          } else {
            console.log('  ✅ Category linked');
          }
        }

      } catch (itemProcessError) {
        console.error('❌ Error processing item:', itemProcessError);
        alert(`Warning: ${itemProcessError.message}`);
      }
    }

    // 6. Success!
    console.log("\n🎉 AUCTION CREATED SUCCESSFULLY!");
    alert("Auction created successfully!");
    router.push('/auction');
    
  } catch (error) {
    console.error('❌ Unexpected error creating auction:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="container mx-auto p-6">
      <form id="auctionCreate" onSubmit={handleCreateAuction}>
        {/* Auction Details Section */}
        <CreateEvent />

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
              onClick={handleOpenAddItemModal}
              className="flex items-center gap-2"
            >
              <span>+</span>
              Add Item
            </Button>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">Click "Add Item" to start adding items to your auction</p>
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
            disabled={isSubmitting || items.length === 0}
            className="px-8 py-3"
          >
            {isSubmitting ? 'Creating Auction...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
