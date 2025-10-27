import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
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
  const radius = 120;
  const [hoverVisible, setHoverVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

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
      <motion.div
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${hoverVisible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
              var(--theme-secondary),
              transparent 80%
            )
          `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHoverVisible(true)}
        onMouseLeave={() => setHoverVisible(false)}
        className="group/upload rounded-md p-[2px] transition duration-300">
        <div className={cn(
          "p-8 group/file block cursor-pointer w-full relative rounded-md z-10",
          "bg-[var(--theme-surface)] border border-[var(--theme-border)]",
          isDragActive && "ring-[3px] ring-[color:var(--theme-secondary)]"
        )}
          onClick={handleClick}
        >
        <input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
          required={required}
          multiple />
        {!files.length && (
          <div
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none [mask-image:radial-gradient(ellipse_at_center,white,transparent)] rounded-md">
            <GridPattern />
          </div>
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-[var(--theme-surface-contrast)]">
          <p
            className="relative z-20 font-sans font-bold text-[var(--theme-surface-contrast)] text-base">
            Upload file {maxLength ? `[Max ${maxLength} files]` : ""}
          </p>
          <p
            className="relative text-center z-20 font-sans font-normal text-[var(--theme-placeholder)] text-base mt-2">
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
                  "relative z-40 flex items-center justify-center h-28 mt-2 w-full max-w-[7rem] mx-auto rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)]",
                  "shadow-[0px_4px_18px_rgba(0,0,0,0.15)] group-hover/file:shadow-[0px_8px_26px_rgba(0,0,0,0.25)]"
                )}>
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[var(--theme-placeholder)] flex flex-col items-center">
                    Drop it
                    <Upload className="h-4 w-4 text-[var(--theme-placeholder)]" />
                  </motion.p>
                ) : (
                  <Upload className="h-4 w-4 text-[var(--theme-placeholder)]" />
                )}
              </motion.div>
            </div>
          )}
        </div>
        {!!files.length && (
        <div className="relative w-full max-w-xl mx-auto z-10">
          {files.length > 0 &&
            files.map((file, idx) => (
              <motion.div
                key={"file" + idx}
                className={cn(
                  "relative overflow-hidden z-40 flex flex-col items-start justify-start md:h-24 p-4 mt-4 mx-auto rounded-md mx-5 border border-[var(--theme-border)] bg-[var(--theme-surface)]",
                  "shadow-[0px_2px_10px_rgba(0,0,0,0.12)]"
                )}>
                <FileCard file={file} idx={idx} removeAt={removeAt} />
              </motion.div>
            ))}
        </div>
      )}
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div
      className="flex bg-white/60 dark:bg-neutral-900/60 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${index % 2 === 0
                ? "bg-white/70 dark:bg-neutral-950"
                : "bg-white/80 dark:bg-neutral-950 shadow-[0px_0px_1px_2px_rgba(255,255,255,0.9)_inset] dark:shadow-[0px_0px_1px_2px_rgba(0,0,0,1)_inset]"
                }`} />
          );
        }))}
    </div>
  );
}
