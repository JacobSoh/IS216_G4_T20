import Image from "next/image";
import { motion } from "motion/react";
import { Trash } from "lucide-react";
import { ArrowBigRight } from "lucide-react";
import { IconArrowNarrowRight } from "@tabler/icons-react";
import { useState, useRef, useId, useEffect } from "react";

const Slide = ({
  slide,
  index,
  current,
  handleSlideClick
}) => {
  const slideRef = useRef(null);

  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef();

  useEffect(() => {
    const animate = () => {
      if (!slideRef.current) return;

      const x = xRef.current;
      const y = yRef.current;

      slideRef.current.style.setProperty("--x", `${x}px`);
      slideRef.current.style.setProperty("--y", `${y}px`);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event) => {
    const el = slideRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
    yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
  };

  const handleMouseLeave = () => {
    xRef.current = 0;
    yRef.current = 0;
  };

  const imageLoaded = (event) => {
    event.currentTarget.style.opacity = "1";
  };

  const { file, idx, removeAt } = slide;

  return (
    <div className="[perspective:1200px] [transform-style:preserve-3d]">
      <li
        ref={slideRef}
        className="flex flex-1 flex-col items-center justify-center relative text-center text-white opacity-100 transition-all duration-300 ease-in-out w-[70vmin] h-[70vmin] mx-[4vmin] z-10 "
        onClick={() => handleSlideClick(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform:
            current !== index
              ? "scale(0.98) rotateX(8deg)"
              : "scale(1) rotateX(0deg)",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transformOrigin: "bottom",
        }}>
        <div
          className="absolute top-0 left-0 w-full h-full bg-[#1D1F2F] rounded-[1%] overflow-hidden transition-all duration-150 ease-out"
          style={{
            transform:
              current === index
                ? "translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)"
                : "none",
          }}>
          <img
            className="absolute inset-0 w-[120%] h-[120%] object-cover opacity-100 transition-opacity duration-600 ease-in-out"
            style={{
              opacity: current === index ? 1 : 0.5,
            }}
            alt={file.name}
            src={URL.createObjectURL(file)}
            onLoad={imageLoaded}
            loading="eager"
            decoding="sync" />
          {current === index && (
            <div className="absolute inset-0 bg-black/30 transition-all duration-1000" />
          )}
        </div>

        <article
          className={`relative p-[4vmin] transition-opacity duration-1000 ease-in-out ${current === index ? "opacity-100 visible" : "opacity-0 invisible"
            }`}>
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
        </article>

        <article
          className={`relative p-[4vmin] transition-opacity duration-1000 ease-in-out ${current === index ? "opacity-100 visible" : "opacity-0 invisible"
            }`}>
          <h2 className="text-lg md:text-2xl lg:text-4xl font-semibold  relative">
            {title}
          </h2>
          <div className="flex justify-center">
            <button
              className="mt-6  px-4 py-2 w-fit mx-auto sm:text-sm text-black bg-white h-12 border border-transparent text-xs flex justify-center items-center rounded-2xl hover:shadow-lg transition duration-200 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
              {button}
            </button>
          </div>
        </article>
      </li>
    </div>
  );
};

const CarouselControl = ({
  type,
  title,
  handleClick
}) => {
  return (
    <button
      className={`w-10 h-10 flex items-center mx-2 justify-center bg-neutral-200 dark:bg-neutral-800 border-3 border-transparent rounded-full focus:border-[#6D64F7] focus:outline-none hover:-translate-y-0.5 active:translate-y-0.5 transition duration-200 ${type === "previous" ? "rotate-180" : ""
        }`}
      title={title}
      onClick={handleClick}>
      <ArrowBigRight />
      {/* <IconArrowNarrowRight className="text-neutral-600 dark:text-neutral-200" /> */}
    </button>
  );
};

export default function Carousel({
  slides
}) {
  const [current, setCurrent] = useState(0);

  const handlePreviousClick = () => {
    const previous = current - 1;
    setCurrent(previous < 0 ? slides.length - 1 : previous);
  };

  const handleNextClick = () => {
    const next = current + 1;
    setCurrent(next === slides.length ? 0 : next);
  };

  const handleSlideClick = (index) => {
    if (current !== index) {
      setCurrent(index);
    }
  };

  const id = useId();

  return (
    <div
      className="relative w-[70vmin] h-[70vmin] mx-auto"
      aria-labelledby={`carousel-heading-${id}`}>
      <ul
        className="absolute flex mx-[-4vmin] transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translateX(-${current * (100 / slides.length)}%)`,
        }}>
        {slides.map((slide, index) => (
          <Slide
            key={index}
            slide={slide}
            index={index}
            current={current}
            handleSlideClick={handleSlideClick} />
        ))}
      </ul>
      <div className="absolute flex justify-center w-full top-[calc(100%+1rem)]">
        <CarouselControl
          type="previous"
          title="Go to previous slide"
          handleClick={handlePreviousClick} />

        <CarouselControl type="next" title="Go to next slide" handleClick={handleNextClick} />
      </div>
    </div>
  );
}


// export default function FileOverlayCard({ file, idx, removeAt }) {
//   const src = URL.createObjectURL(file);

//   return (
//     <div className="group relative w-full overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10">
//       {/* Make it as tall as you want; 9/16 card by default */}
//       <div className="relative h-40 sm:h-48">
//         <Image
//           src={src}
//           alt={`preview-${file.name}-${file.lastModified}`}
//           fill
//           unoptimized
//           className="object-cover transition-transform duration-500 group-hover:scale-105"
//           onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
//           sizes="(min-width: 640px) 50vw, 100vw"
//         />
//         {/* readability gradient */}
//         <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none" />

//         {/* top-left: type badge */}
//         <motion.span
//           initial={{ y: -8, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           className="absolute top-2 left-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-900 backdrop-blur"
//           title={file.type || "Unknown type"}
//         >
//           {file.type || "Unknown"}
//         </motion.span>

//         {/* top-right: delete */}
//         <motion.button
//           type="button"
//           initial={{ y: -8, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           whileHover={{ scale: 1.05 }}
//           className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md bg-destructive text-white/95 hover:bg-destructive/90 h-8 w-8 shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-destructive"
//           onClick={() => removeAt(idx)}
//           aria-label="Remove file"
//           title="Remove file"
//         >
//           <Trash className="size-4" />
//         </motion.button>

//         {/* bottom content */}
//         <motion.div
//           initial={{ y: 12, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           className="absolute inset-x-2 bottom-2 rounded-lg bg-black/35 p-2 text-white backdrop-blur-sm"
//         >
//           {/* name + size */}
//           <div className="flex items-center gap-2">
//             <p
//               className="truncate text-sm font-medium"
//               title={file.name}
//             >
//               {file.name}
//             </p>
//             <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[11px] bg-white/90 text-gray-900">
//               {(file.size / (1024 * 1024)).toFixed(2)} MB
//             </span>
//           </div>

//           {/* meta row */}
//           <div className="mt-1 flex items-center justify-between text-xs text-white/85">
//             <span className="truncate">{file.type || "—"}</span>
//             <span>
//               modified {new Date(file.lastModified).toLocaleDateString()}
//             </span>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// }


