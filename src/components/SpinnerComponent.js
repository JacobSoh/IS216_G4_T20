// Optional: remove this if you want it to be a Server Component in Next.js
"use client";

export default function Spinner({
    size = "sm",
    srLabel = "Loading",
    className = "",   // e.g. "text-indigo-600"
}) {
    const sizeMap = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        '10xl': "h-30 w-30",
        'sssxl': "h-50 w-50"
    };
    const svgClasses = `motion-safe:animate-spin ${sizeMap[size] ?? sizeMap.sm} ${className}`;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="inline-block"
        >
            <svg
                aria-hidden="true"
                focusable="false"
                className={svgClasses}
                viewBox="0 0 24 24"
                fill="none"
            >
                {/* track */}
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    className="opacity-25"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                {/* head */}
                <path
                    d="M22 12a10 10 0 0 1-10 10"
                    className="opacity-75"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>
            <span className="sr-only">{srLabel}</span>
        </div>
    );
}
