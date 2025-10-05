'use client';

function WrapDiv({ children }) {
    return (
        <div className='py-2 px-4 my-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400' role='alert'>
            {children}
        </div>
    )
};

export default function Error({ error, rmvDupDiv = false }) {
    return (
        <>
            {rmvDupDiv ? <><span className='font-medium'>Error:</span> {error}</> : <WrapDiv><span className='font-medium'>Error:</span> {error}</WrapDiv>}
        </>
    );
};