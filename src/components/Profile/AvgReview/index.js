
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

export default function AvgReview({ number }) {
  const outOf = 5;
  // clamp between 0 and outOf
  const raw = Math.max(0, Math.min(outOf, Number(number) || 0));
  // choose whether to allow any fraction or snap to halves
  const rating =  Math.round(raw * 2) / 2;


  return (
    <div className="flex items-center gap-1 py-1 rounded-full">
      <ul className="flex items-center gap-0.5">
        {Array.from({ length: outOf }).map((_, i) => {
          // how much of this star should be filled (0..1)
          const fill = Math.max(0, Math.min(1, rating - i));
          const pct = `${fill * 100}%`;
          return (
            <li key={i} className="list-none relative w-4 h-4">
              {/* base outline */}
              <StarOutline className="absolute inset-0 w-4 h-4 text-amber-300" />
              {/* clipped solid fill */}
              <div className="absolute inset-0 overflow-hidden" style={{ width: pct }}>
                <StarSolid className="w-4 h-4 text-amber-500" />
              </div>
            </li>
          );
        })}
      </ul>
      <span className="font-bold text-sm">{number}</span>
    </div>
  );
};