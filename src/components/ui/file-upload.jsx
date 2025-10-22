import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Upload, Trash } from "lucide-react";
// import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import Image from 'next/image';
import FileCard from '@/components/Auction/Sub/FileCard';

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

export const isRegExp = (x) =>
  Object.prototype.toString.call(x) === "[object RegExp]";

export function applyFilter(files, filterRule) {
  if (!filterRule) return files;
  return files.filter(f =>
    isRegExp(filterRule) ? filterRule.test(f.type) : filterRule(f)
  );
}

export function applySome(files, filterRule) {
  if (!filterRule) return false;
  return files.some(f =>
    isRegExp(filterRule) ? !filterRule.test(f.type) : filterRule(f)
  );
}

export function dedupeFiles(list) {
  const map = new Map();
  for (const f of list) {
    const key = [f.name, f.size, f.lastModified, f.type].join("::");
    if (!map.has(key)) map.set(key, f);
  }
  return [...map.values()];
}

export function syncInputFiles(inputEl, list) {
  if (!inputEl) return;
  const dt = new DataTransfer();
  list.forEach((f) => dt.items.add(f));
  inputEl.files = dt.files;
}

export const FileUpload = ({
  id,
  name,
  maxLength,
  required,
  filterRule
}) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  function handleFileChange(newFiles) {
    const arr = Array.from(newFiles);
    const filtered = applyFilter(arr, filterRule);

    if (applySome(newFiles, filterRule)) toast.error("Some files are rejected");
    if (maxLength && filtered.length > maxLength) {
      toast.error("Exceeded maximum allowed items");
      return;
    };

    setFiles((prev) => {
      const next = dedupeFiles([...prev, ...filtered]);
      syncInputFiles(fileInputRef.current, next); // keep <input> in sync
      return next;
    });
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
    },
  });

  function removeAt(idx) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      syncInputFiles(fileInputRef.current, next);
      onChange?.(next);
      return next;
    });
  };

  return (
    <div className="w-full relative" {...getRootProps()}>
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none
        [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
        <GridPattern />
      </div>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden">
        <input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
          required={required}
          multiple />
        <div className="flex flex-col items-center justify-center">
          <p
            className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            Upload file {maxLength ? `[Max ${maxLength} files]` : ""}
          </p>
          <p
            className="relative text-center z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            Drag or drop your files here or click to upload
          </p>
          {!files.length && (
            <div className="relative w-full mt-10 max-w-xl mx-auto">
              <motion.div
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                )}>
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-neutral-600 flex flex-col items-center">
                    Drop it
                    <Upload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </motion.p>
                ) : (
                  <Upload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                )}
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
      {!!files.length && (
        <div className="relative w-full max-w-xl mx-auto">
          {files.length > 0 &&
            files.map((file, idx) => (
              <motion.div
                key={"file" + idx}
                className={cn(
                  "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 mx-auto rounded-md mx-5",
                  "shadow-sm"
                )}>
                <FileCard file={file} idx={idx} removeAt={removeAt} />
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div
      className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${index % 2 === 0
                ? "bg-gray-50 dark:bg-neutral-950"
                : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
                }`} />
          );
        }))}
    </div>
  );
}
