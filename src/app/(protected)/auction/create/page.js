'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreateEvent,
  CreateItem,
  ItemCard
} from '@/components/Auction/Create';

import { useModal } from '@/context/ModalContext';

export default function AuctionCreate() {
  const [items, setItems] = useState([]);
  const { setModalHeader, setModalState, setModalForm, setModalFooter } = useModal();

  // Handle adding a new item
  const handleAddItem = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const itemName = form.get("itemName")?.toString().trim() || "";
    const minBid = form.get("minBid")?.toString().trim() || "0";
    const bidIncrement = form.get("bidIncrement")?.toString().trim() || "0";
    
    // Get all files from the FileList
    const fileInput = e.currentTarget.querySelector('input[name="itemFile"]');
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    
    // Create preview URLs for the files
    const filePreviews = files.map(file => URL.createObjectURL(file));

    const newItem = {
      id: Date.now(), // Unique ID for each item
      itemName,
      minBid: parseFloat(minBid) || 0,
      bidIncrement: parseFloat(bidIncrement) || 0,
      files,
      filePreviews
    };

    setItems((prev) => [...prev, newItem]);
    
    // Close modal after adding
    setModalState({ open: false });
  };

  // Handle editing an existing item
  const handleEditItem = (item) => {
    setModalForm({ 
      isForm: true, 
      onSubmit: (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        const itemName = form.get("itemName")?.toString().trim() || "";
        const minBid = form.get("minBid")?.toString().trim() || "0";
        const bidIncrement = form.get("bidIncrement")?.toString().trim() || "0";
        
        const fileInput = e.currentTarget.querySelector('input[name="itemFile"]');
        const files = fileInput?.files && fileInput.files.length > 0 
          ? Array.from(fileInput.files) 
          : item.files;
        
        // Create new preview URLs only if new files were uploaded
        let filePreviews;
        if (fileInput?.files && fileInput.files.length > 0) {
          // Clean up old preview URLs
          item.filePreviews.forEach(url => URL.revokeObjectURL(url));
          filePreviews = files.map(file => URL.createObjectURL(file));
        } else {
          filePreviews = item.filePreviews;
        }

        // Update the item
        setItems(prev => prev.map(i => 
          i.id === item.id 
            ? { 
                ...i, 
                itemName, 
                minBid: parseFloat(minBid) || 0, 
                bidIncrement: parseFloat(bidIncrement) || 0, 
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

  // Handle deleting an item
  const handleDeleteItem = (itemId) => {
    setItems(prev => {
      const itemToDelete = prev.find(item => item.id === itemId);
      // Clean up object URLs to prevent memory leaks
      if (itemToDelete?.filePreviews) {
        itemToDelete.filePreviews.forEach(url => URL.revokeObjectURL(url));
      }
      return prev.filter(item => item.id !== itemId);
    });
  };

  // Handle creating the auction event
  const handleAddAuction = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const auctionName = form.get("auctionName")?.toString().trim() || "";
    const auctionDescription = form.get("auctionDescription")?.toString().trim() || "";
    const startDateTime = form.get("startDateTime")?.toString().trim() || "";
    const endDateTime = form.get("endDateTime")?.toString().trim() || "";
    
    const fileInput = e.currentTarget.querySelector('input[name="auctionFile"]');
    const auctionFile = fileInput?.files?.[0];

    // Prepare data for submission
    const auctionData = {
      auctionName,
      auctionDescription,
      startDateTime,
      endDateTime,
      auctionFile,
      items: items.map(item => ({
        itemName: item.itemName,
        minBid: item.minBid,
        bidIncrement: item.bidIncrement,
        files: item.files
      }))
    };

    console.log('Auction Data:', auctionData);
    
    // TODO: Submit to your API
    // Example:
    // const formData = new FormData();
    // formData.append('auctionName', auctionName);
    // formData.append('auctionDescription', auctionDescription);
    // formData.append('startDateTime', startDateTime);
    // formData.append('endDateTime', endDateTime);
    // formData.append('auctionFile', auctionFile);
    // formData.append('items', JSON.stringify(items));
    // 
    // fetch('/api/auctions', {
    //   method: 'POST',
    //   body: formData
    // }).then(response => response.json())
    //   .then(data => console.log(data))
    //   .catch(error => console.error(error));
  };

  return (
    <>
      {/* Header Section */}
      <div className="w-full flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-brand">Auction Creation</h2>
        <Button
          type='submit'
          form="auctionCreate"
          variant="brand"
        >
          Create Event
        </Button>
      </div>

      {/* Auction Event Form */}
      <CreateEvent onSubmit={handleAddAuction} />

      {/* Auction Items Section */}
      <div className="w-full flex justify-between items-center mt-8 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-brand">
            Auction Items
          </h2>
          <Badge variant="brand" className="text-lg px-3 py-1">
            {items.length}
          </Badge>
        </div>
        <Button 
          type="button" 
          variant="brand" 
          onClick={() => {
            setModalForm({ isForm: true, onSubmit: handleAddItem });
            setModalHeader({ title: 'Add Auction Item' });
            setModalState({ open: true, content: <CreateItem maxLength={5} /> });
            setModalFooter({ submitText: "Add Item" });
          }}
        >
          <Plus className="w-5 h-5" /> Add Item
        </Button>
      </div>

      {/* Display Items */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 mt-6">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => handleEditItem(item)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-[#2d3139] rounded-lg bg-[#1a1d24]/30">
          <svg 
            className="mx-auto h-16 w-16 text-gray-500 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
            />
          </svg>
          <p className="text-lg font-medium mb-2">No items added yet</p>
          <p className="text-sm text-gray-500">Click "Add Item" to start adding items to your auction</p>
        </div>
      )}
    </>
  );
}
