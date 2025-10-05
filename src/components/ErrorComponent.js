'use client';

import {
    Eyes,
    ErrorMsg,
    ErrorBtn
} from '@/components/error/index';

export default function Error({ status, error, reset }) {
    

    return (
        <div className='container w-full h-dvh mx-auto px-4'>
            <div className='flex flex-col items-center justify-center h-full gap-10'>
                <Eyes/>
                <ErrorMsg error={error} status={status}/>
                <ErrorBtn/>
            </div>
        </div>
    );
};