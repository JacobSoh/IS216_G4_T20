// components/DashboardPalette.jsx
'use client';

import { ChartTypes } from '@/components/Charts';

const pills = [
    { label: 'Simple Line', type: ChartTypes.SimpleLineChart },
    { label: 'Dashed Line', type: ChartTypes.DashedLineChart },
];


const pillStyles = 'cursor-grab select-none rounded-full px-3 py-1 bg-white/10 text-white hover:bg-white/20';

export default function DashboardPalette() {
    const start = (e, type) => {
        e.dataTransfer.setData('application/widget-type', type);
        // helpful hint for RGL’s drop calc
        e.dataTransfer.setData('text/plain', type);
        e.dataTransfer.effectAllowed = 'copyMove';
    };

    return (
        <div className="flex gap-2 p-2">
            {
                pills.map(p => (
                    <button
                        key={p.type}
                        draggable
                        onDragStart={(e) => start(e, p.type)}
                        className="cursor-grab select-none rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-sm"
                        title="Drag me onto the grid"
                    >
                        {p.label}
                    </button>
                ))
            }
        </div>
    );
}
