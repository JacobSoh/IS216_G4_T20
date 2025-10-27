'use client';

import { useState, useReducer } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreateEvent,
  CreateItem
} from '@/components/Auction/Create';

import { useModal } from '@/context/ModalContext';

export default function AuctionCreate() {
  const [items, setItems] = useState([]);
  const { setModalHeader, setModalState, setModalForm, setModalFooter } = useModal();

  const handleAddItem = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const itemName = form.get("itemName").trim();
    const minBid = form.get("minBid").trim();
    const bidIncrement = form.get("bidIncrement").trim();
    const files = form.get("itemFile");

    setItems((prev) => {
      const next = {
        itemName: itemName,
        minBid: minBid,
        bidIncrement: bidIncrement,
        files: files
      };
      return [...prev, next];
    });
  };

  const handleAddAuction = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const auctionName = form.get("auctionName").trim();
    const auctionDescription = form.get("auctionDescription").trim();
    const auctionFile = form.get("auctionFile").trim();
    const startDateTime = form.get("startDateTime").trim();
    const endDateTime = form.get("endDateTime").trim();
    
  };
  return (
    <>
      <div className="w-full flex justify-between items-center">
        <h2 className="text-3xl font-bold text-brand">Auction Creation</h2>
        <Button
          type='submit'
          form="auctionCreate"
          variant="brand"
        >
          Create Event
        </Button>
      </div>
      <CreateEvent onSubmit={handleAddAuction} />
      <div className="w-full flex justify-between items-center">
        <h2 className="text-3xl font-bold text-brand ">
          Auction Items
          <Badge variant="brand">
            {items.length}
          </Badge>
        </h2>
        <Button type="button" variant="brand" onClick={() => {
          setModalForm({ isForm: true, onSubmit: handleAddItem });
          setModalHeader({ title: 'Add Auction Item' });
          setModalState({ open: true, content: <CreateItem maxLength={5} /> });
          setModalFooter({ submitText: "Add Item" });
        }}>
          <Plus /> Add Item
        </Button>
      </div>
      {items.length > 0 && items.map(v => (
        <>
        
        </>
      ))}
    </>

  );
}
