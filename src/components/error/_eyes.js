'use client';

export default function _eyes() {
    return (
        <div id='eyes' className='flex gap-8 z-10'>
            {[1,2].map(v => (
                <div key={v + '_eyes'} className="flex items-center justify-center w-40 h-40 rounded-full bg-(--custom-cream-yellow)">
                    <div className="animate-eyes will-change-transform w-17 h-17 rounded-full bg-black"></div>
                </div>
            ))}
        </div>
    )
}; 