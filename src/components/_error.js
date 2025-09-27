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
        <div className="container w-full h-dvh mx-auto">
            <div className="flex flex-col items-center justify-center h-full gap-10">
                <_eyes/>
                <h1 className="capitalize font-bold text-6xl text-(--custom-cream-yellow) flex gap-15">
                    {error?.message ?? ''}
                </h1>
                <p className="font-bold text-3xl text-white flex gap-15">
                    {status} error
                </p>
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