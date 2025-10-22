// components/FileOverlayCard.jsx
import Image from "next/image";
import { motion } from "motion/react";
import { Trash } from "lucide-react";

export default function FileCard({ file, idx, removeAt }) {
  return (
    <motion.div className="w-full">
      <div className="flex justify-between w-full items-center gap-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          layout
          className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
          {file.name}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          layout
          className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input">
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </motion.p>
      </div>

      <div className="flex w-full justify-between items-center">
        <div
          className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            layout
            className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 ">
            {file.type}
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
            modified{" "}
            {new Date(file.lastModified).toLocaleDateString()}
          </motion.p>
        </div>
        <motion.button
          type='button'
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 h-9 px-4 py-2 has-[>svg]:px-3"
          onClick={() => removeAt(idx)}>
          <Trash />
        </motion.button>
      </div>
    </motion.div>
  );
}
