'use client';
import Error from "@/components/_error";

export default function GlobalError({ error, reset }) {
    return (<Error error={error} reset={reset}/>);
};