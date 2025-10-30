'use client';

export default function Eyes() {
    return (
        <div id='eyes' className='flex gap-8 z-10'>
            {[1,2].map(v => (
                <div key={v + '_eyes'} className="flex items-center justify-center w-20 h-20 md:w-30 md:h-30 lg:w-40 lg:h-40 rounded-full bg-(--custom-cream-yellow)">
                    <div className="animate-eyes will-change-transform w-8 h-5 md:w-13 lg:w-22 rounded-full bg-black"></div>
                </div>
            ))}
        </div>
    )
}; 