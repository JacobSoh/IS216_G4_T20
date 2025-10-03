"use client";

import { useRouter } from "next/navigation";

export default function ErrorBtn() {
    const router = useRouter();

    const goBack = () => {
        router.push("/");
    };

    return (
        <button
            type="button"
            className="
                lg:text-xl lg:py-3 lg:px-5
                md:text-md md:px-4
                text-sm py-2 px-3
                text-black bg-[var(--custom-cream-yellow)]
                hover:bg-[var(--custom-cream-yellow-darker)]
                focus:ring-4 focus:ring-yellow-500
                rounded-lg focus:outline-none
            "
            onClick={goBack}
        >
            Back to Home
        </button>
    );
}
