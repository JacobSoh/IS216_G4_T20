'use client';

export default function ErrorMsg({ status, error }) {
    return (
        <div className='space-y-3 text-center'>
            {error?.message ? (
                <h1 className="uppercase font-bold text-2xl md:text-3xl lg:text-4xl text-(--custom-cream-yellow) flex gap-15">
                    {error?.message}
                </h1>
            ) : (
                <h1 className="uppercase font-bold text-3xl md:text-4xl lg:text-4xl text-white flex gap-15">
                    Oops! Something went wrong!
                </h1>
            )}

            {status ? (
                <p className="font-bold text-lg md:text-xl lg:text-2xl text-white">
                    {status ? `${status} error` : 'Error?'}
                </p>
            ) : null
            }

        </div>
    );
};