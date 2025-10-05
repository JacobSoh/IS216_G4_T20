// components/AlertBanner.jsx
'use client';

const VARIANTS = {
    success: 'text-green-800 bg-green-50 dark:bg-gray-800 dark:text-green-400',
    error: 'text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-400',
    info: 'text-blue-800 bg-blue-50 dark:bg-gray-800 dark:text-blue-400',
    warning: 'text-yellow-800 bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300',
    danger: 'text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-300',
};

export default function AlertBanner({ children, variant = 'info', onClose }) {
    return (
        <div role="alert"
            className={`py-2 px-4 my-4 text-sm rounded-lg shadow flex items-start justify-between gap-4 ${VARIANTS[variant]}`}>
            <div>{children}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    aria-label="Close alert"
                    className="shrink-0 inline-flex rounded-md px-2 py-1 text-xs opacity-70 hover:opacity-100 border">
                    ✕
                </button>
            )}
        </div>
    );
}
