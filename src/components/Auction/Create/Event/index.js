import { useRef, useState, useEffect, useReducer } from 'react';
import { useModal } from '@/context/ModalContext';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import { FieldGroup } from '@/components/ui/field';
import { CustomInput } from '@/components/Form/CustomInput';
import { CustomFileInput } from '@/components/Form/CustomFileInput';
import { CustomerDatePicker } from '@/components/Form/CustomDatePicker';
import { CustomTextarea } from '@/components/Form/CustomTextarea';

const intial = {
  auctionName: "",
  auctionDescription: "",
  startDateTime: new Date(Date.now()),
  endDateTime: new Date(Date.now()),
};

function reducer(s, a) {
  switch (a.type) {
    case "FIELD":
      return { ...s, [a.f]: a.value };
    case "RESET":
      return a.value;
    default:
      return s;
  };
};

export default function AuctionCreateForm({
  onSubmit
}) {
  const { setModalHeader, setModalState, setModalForm } = useModal();
  const [showLoading, setShowLoading] = useState(false);

  const handleField = (f) => (e) => {
    return setForm({ type: "FIELD", f, value: e.target.value });
  };

  // const fileInputRef = useRef();
  // const startRef = useRef();
  // const endRef = useRef();
  // const [modalOpen, setModalOpen] = useState(false);
  // const [items, setItems] = useState([]);
  // const [thumbnail, setThumbnail] = useState(null);

  // // States for AddItemModal
  // const [itemImages, setItemImages] = useState([]);
  // const [itemName, setItemName] = useState('');
  // const [minBid, setMinBid] = useState('');
  // const [bidIncrement, setBidIncrement] = useState('');

  // // For per-item carousels
  // const [carouselIndexes, setCarouselIndexes] = useState([]);

  // useEffect(() => {
  //   setCarouselIndexes(items.map(() => 0));
  // }, [items.length]);

  // useEffect(() => {
  //   if (items.length === 0) return;
  //   const interval = setInterval(() => {
  //     setCarouselIndexes(prev =>
  //       prev.map((currIdx, idx) => {
  //         const arrLen = items[idx]?.images?.length || 1;
  //         if (arrLen <= 1) return 0;
  //         return (currIdx + 1) % arrLen;
  //       })
  //     );
  //   }, 2500);
  //   return () => clearInterval(interval);
  // }, [items]);

  // function handleDrop(e) {
  //   e.preventDefault();
  //   if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
  //     setThumbnail(e.dataTransfer.files[0]);
  //     fileInputRef.current.files = e.dataTransfer.files;
  //   }
  // }

  // function handleFileChange(e) {
  //   if (e.target.files && e.target.files[0]) {
  //     setThumbnail(e.target.files[0]);
  //   }
  // }

  // function removeThumbnail() {
  //   setThumbnail(null);
  //   if (fileInputRef.current) fileInputRef.current.value = "";
  // }

  // // Edit item handler (opens modal pre-filled with item)
  // function handleEditItem(idx) {
  //   const item = items[idx];
  //   setItemName(item.itemName);
  //   setMinBid(item.minBid);
  //   setBidIncrement(item.bidIncrement);
  //   setItemImages(item.images);
  //   setModalOpen({ edit: true, idx });
  // }

  // // Delete item handler
  // function handleDeleteItem(idx) {
  //   setItems(items.filter((_, i) => i !== idx));
  //   setCarouselIndexes(prev => prev.filter((_, i) => i !== idx));
  // }

  // // Save item, for add or edit
  // function handleSaveItem() {
  //   if (modalOpen && modalOpen.edit === true) {
  //     setItems(items.map((item, idx) =>
  //       idx === modalOpen.idx
  //         ? { itemName, minBid, bidIncrement, images: itemImages }
  //         : item
  //     ));
  //     setCarouselIndexes(indexes =>
  //       indexes.map((ci, idx) => (idx === modalOpen.idx ? 0 : ci))
  //     );
  //   } else {
  //     setItems([...items, { itemName, minBid, bidIncrement, images: itemImages }]);
  //     setCarouselIndexes(arr => [...arr, 0]);
  //   }
  //   setItemName('');
  //   setMinBid('');
  //   setBidIncrement('');
  //   setItemImages([]);
  //   setModalOpen(false);
  // }

  // const badgeColorClass = items.length === 0 ? 'bg-[var(--custom-accent-red)] ring-[var(--custom-accent-red)]' : 'bg-[var(--custom-bright-blue)] ring-[var(--custom-bright-blue)]';

  const filterRule = /^image\//i;

  return (
    <form id="auctionCreate" onSubmit={onSubmit}>
      <FieldGroup>
        <div className='grid lg:grid-cols-2 justify-center items-center gap-2'>
          <FieldGroup>
            <CustomInput
              type='auctionName'
              required={true}
            />
            <CustomTextarea
              type="auctionDescription"
              required={true}
            />
            <div className='flex gap-2'>
              <CustomerDatePicker
                type="startDateTime"
                required={true}
              />
              <CustomerDatePicker
                type="endDateTime"
                required={true}
              />
            </div>
          </FieldGroup>
          <FieldGroup>
            <CustomFileInput
              type="auctionFile"
              label="Upload Auction Image"
              filterRule={filterRule}
              maxLength={1}
              required={true}
            />
          </FieldGroup>
        </div>

      </FieldGroup>
    </form>
  );

  // return (
  //   <>
  //     <form className="w-full min-h-screen p-10 flex flex-col justify-center items-center bg-[var(--custom-bg-primary)]" style={{ color: 'var(--custom-text-primary)' }}>
  //       {/* Header */}
  //       <div className="w-full flex justify-between items-center mb-8 max-w-4xl">
  //         <h2 className="text-3xl font-bold text-[var(--custom-bright-blue)]">Auction Creation</h2>
  //         <button
  //           type="submit"
  //           className="px-6 py-3 bg-[var(--custom-cream-yellow)] text-[var(--custom-navy-blue)] rounded-full shadow-md font-semibold hover:bg-[var(--custom-cream-yellow-darker)] transition"
  //         >
  //           Create event
  //         </button>
  //       </div>
  //       {/* Main Grid: Left (fields), Right (thumbnail) */}
  //       <div className="w-full max-w-4xl grid grid-cols-2 gap-8 mb-10">
  //         <div className="flex flex-col gap-6 justify-start">
  //           <div>
  //             <label className="block text-lg mb-2 font-semibold text-[var(--custom-bright-blue)]">Event Name</label>
  //             <input
  //               type="text"
  //               className="border-b-2 border-[var(--custom-bright-blue)] bg-transparent text-2xl font-semibold outline-none p-2 w-full"
  //               placeholder="The Great Singapore Auction"
  //               style={{ color: 'var(--custom-text-primary)' }}
  //             />
  //           </div>
  //           <div>
  //             <label className="block text-lg mb-3 font-semibold text-[var(--custom-bright-blue)]">Description</label>
  //             <textarea
  //               className="block w-full rounded-lg p-4 min-h-[70px] bg-[var(--custom-bg-secondary)] border-b-2 border-[var(--custom-border-color)] text-[var(--custom-text-primary)] resize-none focus:outline-none focus:border-[var(--custom-bright-blue)]"
  //               placeholder="Briefly describe your auction event..."
  //             />
  //           </div>
  //           <div className="flex gap-6">
  //             <div className="flex-1 relative">
  //               <label className="block mb-2 text-md font-semibold text-[var(--custom-bright-blue)]">Start Date & Time</label>
  //               <input
  //                 type="datetime-local"
  //                 ref={startRef}
  //                 className="rounded bg-[var(--custom-bg-secondary)] border border-[var(--custom-border-color)] w-full p-3 text-[var(--custom-text-secondary)] pr-12"
  //               />
  //               <button type="button"
  //                 className="absolute right-3 top-1/2 -translate-y-1/2 p-0 m-0 flex items-center bg-transparent border-none outline-none shadow-none"
  //                 tabIndex={-1}
  //                 onClick={() => startRef.current && startRef.current.showPicker && startRef.current.showPicker()}
  //                 style={{ cursor: "pointer" }}>
  //                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--custom-bright-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                   <rect x="3" y="4" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
  //                   <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
  //                 </svg>
  //               </button>
  //             </div>
  //             <div className="flex-1 relative">
  //               <label className="block mb-2 text-md font-semibold text-[var(--custom-bright-blue)]">End Date & Time</label>
  //               <input
  //                 type="datetime-local"
  //                 ref={endRef}
  //                 className="rounded bg-[var(--custom-bg-secondary)] border border-[var(--custom-border-color)] w-full p-3 text-[var(--custom-text-secondary)] pr-12"
  //               />
  //               <button type="button"
  //                 className="absolute right-3 top-1/2 -translate-y-1/2 p-0 m-0 flex items-center bg-transparent border-none outline-none shadow-none"
  //                 tabIndex={-1}
  //                 onClick={() => endRef.current && endRef.current.showPicker && endRef.current.showPicker()}
  //                 style={{ cursor: "pointer" }}>
  //                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--custom-bright-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                   <rect x="3" y="4" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
  //                   <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
  //                 </svg>
  //               </button>
  //             </div>
  //           </div>
  //         </div>
  //         <div className="flex flex-col justify-start items-center">
  //           <label className="block text-lg mb-4 font-semibold text-[var(--custom-bright-blue)]">Thumbnail</label>
  //           <div
  //             className="w-full h-56 rounded-xl border-2 border-dashed border-[var(--custom-bright-blue)] bg-[var(--custom-bg-secondary)] flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--custom-bg-tertiary)] transition group relative"
  //             onClick={() => fileInputRef.current.click()}
  //             onDrop={handleDrop}
  //             onDragOver={e => { e.preventDefault(); }}
  //             style={{ overflow: 'hidden' }}
  //           >
  //             {thumbnail ? (
  //               <div className="relative w-full h-full flex justify-center items-center">
  //                 <img
  //                   src={URL.createObjectURL(thumbnail)}
  //                   alt="Preview"
  //                   className="object-contain max-h-full max-w-full rounded"
  //                 />
  //                 <button
  //                   type="button"
  //                   onClick={e => { e.stopPropagation(); removeThumbnail(); }}
  //                   className="absolute top-1 right-1 bg-[var(--custom-accent-red)] text-white rounded-full w-7 h-7 flex items-center justify-center font-bold"
  //                   title="Remove"
  //                 >×</button>
  //               </div>
  //             ) : (
  //               <>
  //                 <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-[var(--custom-bright-blue)] mb-4 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
  //                 </svg>
  //                 <span className="text-[var(--custom-text-secondary)] font-medium text-center text-md group-hover:text-[var(--custom-bright-blue)]">
  //                   Drag & drop image here<br />or click to select
  //                 </span>
  //               </>
  //             )}
  //             <input
  //               type="file"
  //               accept="image/*"
  //               ref={fileInputRef}
  //               className="hidden"
  //               onChange={handleFileChange}
  //             />
  //           </div>
  //         </div>
  //       </div>
  //       <div className="w-full max-w-4xl mt-10">
  //         <div className="flex items-center justify-between mb-4">
  //           <div className="flex items-center gap-2">
  //             <h3 className="text-xl font-semibold text-[var(--custom-bright-blue)]">Auction Items</h3>
  //             {/* Changed badge color based on count, no longer blinking */}
  //             <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-lg font-bold shadow-xl ring-2 ${badgeColorClass}`}>
  //               {items.length}
  //             </span>
  //           </div>
  //           <Button type="button" variant="default" onClick={() => {
  //             setModalForm({ isForm: true, onSubmit: () => {} });
  //             setModalHeader({ title: 'Add Auction Item' });
  //             setModalState({ open: true, content: <AddItemModal/> });
  //           }}> 
  //             <Plus/> Create Item
  //           </Button>
  //         </div>
  //         <div className="flex flex-col gap-4">
  //           {items.map((item, idx) => {
  //             const currentIdx = carouselIndexes[idx] || 0;
  //             return (
  //               <div
  //                 key={idx}
  //                 className="relative group flex gap-6 bg-[var(--custom-bg-secondary)] rounded-2xl shadow p-5 mb-2 items-center transition"
  //               >
  //                 {/* Center overlay with dim on hover */}
  //                 <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition">
  //                   <div className="flex gap-6">
  //                     <button
  //                       className="flex items-center gap-2 px-4 py-3 bg-[var(--custom-ocean-blue)] text-white rounded-xl shadow hover:bg-[var(--custom-cream-yellow)] hover:text-[var(--custom-ocean-blue)] font-semibold text-base transition"
  //                       onClick={() => handleEditItem(idx)}
  //                       type="button"
  //                     >
  //                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-1.172a4 4 0 011.172-2.828z" />
  //                       </svg>
  //                       Edit
  //                     </button>
  //                     <button
  //                       className="flex items-center gap-2 px-4 py-3 bg-[var(--custom-accent-red)] text-white rounded-xl shadow hover:bg-[var(--custom-cream-yellow)] hover:text-[var(--custom-accent-red)] font-semibold text-base transition"
  //                       onClick={() => handleDeleteItem(idx)}
  //                       type="button"
  //                     >
  //                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2zm5 4v10M9 9v10" />
  //                       </svg>
  //                       Delete
  //                     </button>
  //                   </div>
  //                 </div>
  //                 {/* Carousel image preview */}
  //                 <div className="flex-shrink-0 w-[160px] h-[100px] rounded-xl overflow-hidden border border-[var(--custom-ocean-blue)] p-0 m-0 flex items-center justify-center bg-black/10">
  //                   {item.images && item.images.length > 0 && (
  //                     <img
  //                       src={URL.createObjectURL(item.images[currentIdx])}
  //                       alt="item"
  //                       className="w-full h-full object-cover rounded-xl transition-all duration-700"
  //                     />
  //                   )}
  //                 </div>
  //                 {/* Info with 3 columns, themed color pairs */}
  //                 <div className="flex-1 grid grid-cols-3 items-center">
  //                   <div className="flex flex-col items-center">
  //                     <div className="font-bold text-[var(--custom-ocean-blue)] text-xl truncate">{item.itemName}</div>
  //                   </div>
  //                   <div className="flex flex-col items-center">
  //                     <div className="text-[var(--custom-cream-yellow)] text-xs font-bold mb-1 uppercase tracking-wide">Price</div>
  //                     <div className="text-[var(--custom-cream-yellow)] text-lg font-bold">${item.minBid || '0.00'}</div>
  //                   </div>
  //                   <div className="flex flex-col items-center">
  //                     <div className="text-[var(--custom-bright-blue)] text-xs font-bold mb-1 uppercase tracking-wide">Increment</div>
  //                     <div className="text-[var(--custom-bright-blue)] text-base font-bold">+${item.bidIncrement || '0.00'}</div>
  //                   </div>
  //                 </div>
  //               </div>
  //             );
  //           })}
  //         </div>
  //       </div>
  //     </form>
  //   </>
  // );
}
