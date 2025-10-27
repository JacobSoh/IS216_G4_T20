// components/FileOverlayCard.jsx
import Image from "next/image";
import { motion } from "motion/react";
import { Trash } from "lucide-react";

export default function FileCard({ file, idx, removeAt }) {
  return (
    <motion.div className="w-full text-[var(--theme-surface-contrast)]">
      <div className="flex justify-between w-full items-center gap-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          layout
          className="text-base truncate max-w-xs">
          {file.name}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          layout
          className="rounded-md px-2 py-1 w-fit shrink-0 text-sm bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-surface-contrast)] shadow-input">
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </motion.p>
      </div>

      <div className="flex w-full justify-between items-center">
        <div
          className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-[var(--theme-placeholder)]">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            layout
            className="px-1 py-0.5 rounded-md bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-surface-contrast)]">
            {file.type}
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
            modified{" "}
            {new Date(file.lastModified).toLocaleDateString()}
          </motion.p>
        </div>
        <motion.button
          type='button'
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 h-9 px-4 py-2 has-[>svg]:px-3"
          onClick={() => removeAt(idx)}>
          <Trash />
        </motion.button>
      </div>
    </motion.div>
  );
}
