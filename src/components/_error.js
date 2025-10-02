'use client';

import {
    _eyes,
    _errorMsg,
    _errorBtn
} from '@/components/error/index';

export default function Error({ status, error, reset }) {
    

    return (
        <div className="container w-full h-dvh mx-auto px-4">
            <div className="flex flex-col items-center justify-center h-full gap-10">
                <_eyes/>
                <_errorMsg error={error} status={status}/>
                <_errorBtn/>
            </div>
        </div>
    );
};