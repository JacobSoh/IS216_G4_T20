import React, { useReducer, useRef, useState } from 'react';
import { CustomInput } from '@/components/Form/CustomInput';
import { CustomFileInput } from '@/components/Form/CustomFileInput';
import { FieldGroup } from '@/components/ui/field';

const initial = {
  itemName: '',
  minBid: '',
  bidIncrement: '',
};

const reducer = (s, a) => {
  switch (a.type) {
    case "FIELD": return { ...s, [a.f]: a.value };
    case "RESET": return initial;
    default: return s;
  };
};

export default function AddItemModal({
  maxLength = 10
}) {
  const [form, setForm] = useReducer(reducer, initial);
  const handleField = (f) => (e) => {
    if (f === 'minBid' && e.target.value <= 0) return;
    return setForm({ type: "FIELD", f, value: e.target.value });
  };

  const filterRule = /^image\//i;

  // function handleFileChange(e) { handleFiles(e.target.files); }
  // function handleDrop(e) { e.preventDefault(); handleFiles(e.dataTransfer.files); }
  // function handleDragEnter(e) { e.preventDefault(); setIsDrag(true); }
  // function handleDragLeave(e) { e.preventDefault(); setIsDrag(false); }
  // function removeImage(idx) { setImages(images.filter((_, i) => i !== idx)); setCarouselIndex(0); }
  // function nextImage() { setCarouselIndex((carouselIndex + 1) % images.length); }
  // function prevImage() { setCarouselIndex((carouselIndex - 1 + images.length) % images.length); }

  // function handleBidFieldChange(e, setter, label) {
  //   const value = e.target.value;
  //   if (/^\d*\.?\d{0,2}$/.test(value)) {
  //     setter(value);
  //     setError('');
  //   } else {
  //     setError(`${label} must be a number with up to two decimals.`);
  //   }
  // }

  // Red error popup overlay (animated)
  // const errorPopup = (
  //   <div className="fixed inset-0 z-60 flex justify-center pt-12 items-start bg-black/20" style={{ backdropFilter: "blur(2px)" }}>
  //     <div className="relative max-w-xs w-full bg-[var(--custom-accent-red)] border-2 border-[var(--custom-cream-yellow)] rounded-xl shadow-xl p-5 animate-popup-in animate-border-pulse">
  //       <button
  //         className="absolute top-2 right-2 bg-white hover:bg-[var(--custom-cream-yellow)] text-[var(--custom-accent-red)] rounded-full px-3 py-0.5 text-lg font-bold shadow"
  //         onClick={() => setError("")}
  //       >×</button>
  //       <span className="block font-bold text-white mb-2">Input Error</span>
  //       <span className="text-white">{error}</span>
  //     </div>
  //   </div>
  // );

  // const modalGlass = "bg-gradient-to-br from-[var(--custom-bg-secondary)] to-[var(--custom-bg-primary)] bg-opacity-70 rounded-2xl shadow-2xl border-2 border-[var(--custom-ocean-blue)]";
  // const modalAnim = "animate-fadeIn";
  // const blurOverlay = "backdrop-blur-[4px] bg-black/40";
  // const glowingBorder = isDrag ? "border-[var(--custom-cream-yellow)] shadow-[0_0_14px_4px_var(--custom-cream-yellow)]" : "border-[var(--custom-ocean-blue)]";

  return (
    <FieldGroup>
      <CustomInput
        type="itemName"
        required={true}
      />
      <CustomInput
        type="minBid"
        required={true}
      />
      <CustomInput
        type="bidIncrement"
      />
      <CustomFileInput
        type="itemFile"
        label="Upload Item Images"
        filterRule={filterRule}
        required={true}
        maxLength={maxLength}
      />
    </FieldGroup>
  );

  // return (
  //   <div className={`fixed inset-0 z-50 flex items-center justify-center ${blurOverlay} ${modalAnim}`}
  //     onClick={error ? undefined : onClose}
  //   >
  //     {/* Error popup (on top, must be closed before interacting with modal) */}
  //     {error && errorPopup}

  //     <div
  //       className={`relative w-full max-w-xl px-8 py-10 ${modalGlass} transition-all duration-300`}
  //       style={{ boxShadow: "0 8px 40px 0 rgba(33,47,78,0.85)", overflow: 'hidden' }}
  //       onClick={e => e.stopPropagation()}
  //     >

  //       <h2 className="text-3xl font-bold text-[var(--custom-ocean-blue)] tracking-tight mb-6 text-center shadow-[var(--custom-shadow)] animate-slideDown">Add Auction Item</h2>
  //       {/* Image upload/preview */}
  //       <label className="block mb-3 font-semibold text-[var(--custom-ocean-blue)] text-base">Upload Images</label>
  //       <div
  //         className={`relative mb-4 min-h-[150px] rounded-xl border-2 border-dashed transition-all duration-300 ${glowingBorder} bg-[var(--custom-bg-tertiary)] flex flex-col items-center justify-center group cursor-pointer select-none shadow-inner`}
  //         onClick={() => !error && fileInputRef.current.click()}
  //         onDrop={handleDrop}
  //         onDragOver={handleDragEnter}
  //         onDragLeave={handleDragLeave}
  //         style={isDrag ? { boxShadow: "0 0 32px 4px var(--custom-cream-yellow)" } : {}}
  //       >
  //         {images.length === 0 && (
  //           <div className="py-7 flex flex-col items-center animate-fadeIn">
  //             <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[var(--custom-ocean-blue)] mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  //             </svg>
  //             <span className="text-[var(--custom-text-secondary)] font-medium text-lg">Drag images or <span className="underline">click to upload</span></span>
  //             <span className="text-xs text-[var(--custom-text-muted)] mt-1">Max 10. More than 4 shows carousel.</span>
  //           </div>
  //         )}
  //         {images.length > 0 &&
  //           <div className="w-full flex items-center justify-center gap-1 py-2 animate-fadeIn">
  //             {images.length > 4 ?
  //               (
  //                 <div className="flex flex-row items-center w-full justify-between animate-fadeIn overflow-hidden max-w-full" style={{maxHeight: "60vh"}}>
  //                   <button
  //                     className="bg-[var(--custom-ocean-blue)]/90 hover:bg-[var(--custom-cream-yellow)] text-white hover:text-[var(--custom-ocean-blue)] rounded-full p-2 shadow transition-all duration-200 z-10"
  //                     onClick={e => { e.stopPropagation(); prevImage(); }}
  //                     disabled={!!error}
  //                   >
  //                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  //                     </svg>
  //                   </button>
  //                   <div className="flex-1 flex items-center justify-center overflow-hidden">
  //                     <img
  //                       src={URL.createObjectURL(images[carouselIndex])}
  //                       alt="Uploaded Preview"
  //                       className="w-full h-full max-h-[56vh] max-w-full mx-2 rounded-xl border-2 border-[var(--custom-ocean-blue)] shadow-lg animate-fadeIn object-contain"
  //                     />
  //                   </div>
  //                   <button
  //                     className="bg-[var(--custom-ocean-blue)]/90 hover:bg-[var(--custom-cream-yellow)] text-white hover:text-[var(--custom-ocean-blue)] rounded-full p-2 shadow transition-all duration-200 z-10"
  //                     onClick={e => { e.stopPropagation(); nextImage(); }}
  //                     disabled={!!error}
  //                   >
  //                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  //                     </svg>
  //                   </button>
  //                   {/* Remove */}
  //                   <button className="absolute right-3 top-3 bg-[var(--custom-accent-red)] text-white w-6 h-6 rounded-full flex items-center justify-center shadow hover:bg-[var(--custom-cream-yellow)] hover:text-[var(--custom-accent-red)] transition"
  //                     onClick={e => { e.stopPropagation(); removeImage(carouselIndex); }}
  //                     disabled={!!error}
  //                   >
  //                     ×
  //                   </button>
  //                   {/* Dots */}
  //                   <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
  //                     {images.map((_, idx) => (
  //                       <span
  //                         key={idx}
  //                         className={`inline-block h-2 w-6 rounded-full ${carouselIndex === idx ? 'bg-[var(--custom-ocean-blue)]' : 'bg-[var(--custom-text-muted)]/60'} transition-all`}
  //                         style={{ opacity: carouselIndex === idx ? 1 : 0.4 }}
  //                       />
  //                     ))}
  //                   </div>
  //                 </div>
  //               )
  //               :
  //               <div className="flex gap-4 flex-wrap items-center justify-center w-full animate-fadeIn">
  //                 {images.map((img, idx) => (
  //                   <div
  //                     key={idx}
  //                     className="relative inline-block rounded-lg shadow ring-2 ring-[var(--custom-ocean-blue)] transition-all duration-300 hover:scale-110 hover:ring-[var(--custom-cream-yellow)]"
  //                     style={{ display: 'inline-block' }}
  //                   >
  //                     <img
  //                       src={URL.createObjectURL(img)}
  //                       alt="Preview"
  //                       className="object-contain max-h-36 max-w-60 rounded-lg transition-all duration-300"
  //                     />
  //                     <button
  //                       type="button"
  //                       className="absolute -top-2 -right-2 bg-[var(--custom-accent-red)] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold shadow"
  //                       title="Remove"
  //                       onClick={e => { e.stopPropagation(); removeImage(idx); }}
  //                       disabled={!!error}
  //                     >×</button>
  //                   </div>
  //                 ))}
  //               </div>
  //             }
  //           </div>
  //         }

  //       </div>
  //       {/* Item Info with floating labels */}
  //       <div className="w-full flex flex-col gap-4">
  //         <div className="relative mt-1">
  //           <input
  //             type="text"
  //             id="itemName"
  //             className="peer w-full px-4 pt-4 h-12 text-lg text-[var(--custom-text-primary)] rounded-xl bg-[var(--custom-bg-tertiary)] border border-[var(--custom-ocean-blue)] focus:ring-2 focus:ring-[var(--custom-ocean-blue)] outline-none transition"
  //             value={itemName}
  //             onChange={e => setItemName(e.target.value)}
  //             maxLength={80}
  //             disabled={!!error}
  //           />
  //           <label
  //             htmlFor="itemName"
  //             className="absolute left-4 top-3 text-[var(--custom-ocean-blue)] font-semibold pointer-events-none transition-all duration-200 peer-focus:top-1 peer-focus:text-xs peer-valid:top-1 peer-valid:text-xs"
  //             style={{ top: itemName ? "0.3rem" : "1.0rem", fontSize: itemName ? "0.8rem" : "1.03rem"}}
  //           >
  //             Item Name
  //           </label>
  //         </div>
  //         <div className="flex gap-2">
  //           <div className="relative flex-1">
  //             <input
  //               type="text"
  //               inputMode="numeric"
  //               pattern="[0-9]*"
  //               id="minBid"
  //               min={0}
  //               className="peer h-12 px-4 pt-4 w-full text-lg rounded-xl bg-[var(--custom-bg-tertiary)] text-[var(--custom-text-primary)] border border-[var(--custom-ocean-blue)] focus:ring-2 focus:ring-[var(--custom-ocean-blue)] outline-none transition"
  //               value={minBid}
  //               onChange={e => handleBidFieldChange(e, setMinBid, "Minimum Bid")}
  //               disabled={!!error}
  //             />
  //             <label
  //               htmlFor="minBid"
  //               className="absolute left-4 top-3 text-[var(--custom-ocean-blue)] font-semibold pointer-events-none transition-all duration-200 peer-focus:top-1 peer-focus:text-xs peer-valid:top-1 peer-valid:text-xs"
  //               style={{top: minBid ? "0.3rem" : "1.0rem", fontSize: minBid ? "0.8rem" : "1.03rem"}}
  //             >
  //               Min Bid ($)
  //             </label>
  //           </div>
  //           <div className="relative flex-1">
  //             <input
  //               type="text"
  //               inputMode="numeric"
  //               pattern="[0-9]*"
  //               id="bidIncrement"
  //               min={1}
  //               className="peer h-12 px-4 pt-4 w-full text-lg rounded-xl bg-[var(--custom-bg-tertiary)] text-[var(--custom-text-primary)] border border-[var(--custom-ocean-blue)] focus:ring-2 focus:ring-[var(--custom-ocean-blue)] outline-none transition"
  //               value={bidIncrement}
  //               onChange={e => handleBidFieldChange(e, setBidIncrement, "Bid Increment")}
  //               disabled={!!error}
  //             />
  //             <label
  //               htmlFor="bidIncrement"
  //               className="absolute left-4 top-3 text-[var(--custom-ocean-blue)] font-semibold pointer-events-none transition-all duration-200 peer-focus:top-1 peer-focus:text-xs peer-valid:top-1 peer-valid:text-xs"
  //               style={{top: bidIncrement ? "0.3rem" : "1.0rem", fontSize: bidIncrement ? "0.8rem" : "1.03rem"}}
  //             >
  //               Bid Increment ($)
  //             </label>
  //           </div>
  //         </div>
  //       </div>
  //       {/* Actions */}
  //       <div className="flex gap-4 w-full mt-6">
  //         <button
  //           type="button"
  //           className="flex-1 px-6 py-3 transition-colors text-lg bg-[var(--custom-ocean-blue)] hover:bg-[var(--custom-cream-yellow)] text-white hover:text-[var(--custom-ocean-blue)] rounded-full shadow-lg font-bold duration-200 focus:ring-2 focus:ring-[var(--custom-ocean-blue)]"
  //           onClick={() => !error && onAdd()}
  //           disabled={!!error}
  //         >Add Item</button>
  //         <button
  //           type="button"
  //           className="flex-1 px-6 py-3 text-lg bg-[var(--custom-accent-red)] hover:bg-[var(--custom-cream-yellow)] text-white hover:text-[var(--custom-accent-red)] rounded-full shadow-lg font-bold focus:ring-2 focus:ring-[var(--custom-accent-red)] transition"
  //           onClick={() => !error && onClose()}
  //           disabled={!!error}
  //         >Cancel</button>
  //       </div>
  //     </div>
  //   </div>
  // );
}
