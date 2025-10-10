'use client';
import Error from '@/components/Error/ErrorComponent';

export default function GlobalError({ error, reset }) {
    return (<Error error={error} reset={reset}/>);
};