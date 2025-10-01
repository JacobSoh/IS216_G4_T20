'use client';

import { useRouter } from 'next/navigation';
import _eyes from "@/components/error/_eyes";

export default function Error({ status, error, reset }) {
    const router = useRouter();

    const goBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        };
    };

    return (
        <div className="container w-full h-dvh mx-auto px-4">
            <div className="flex flex-col items-center justify-center h-full gap-10">
                <_eyes/>
                <div className='space-y-3 text-center'>
                    <h1 className="uppercase font-bold text-3xl md:text-4xl lg:text-4xl text-(--custom-cream-yellow) flex gap-15">
                        {error?.message ?? ''}
                    </h1>
                    <p className="font-bold text-lg md:text-2xl lg:text-3xl text-white">
                        {status} error
                    </p>
                </div>
                <button
                    type="button" 
                    className="text-xl py-3 px-5 text-black bg-(--custom-cream-yellow) hover:bg-(--custom-cream-yellow-darker) focus:ring-4 focus:ring-yellow-500 rounded-lg focus:outline-none"
                    onClick={goBack}
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};