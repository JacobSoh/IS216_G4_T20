'use client';
import Error from "@/components/_error";

export default function NotFound() {
    return (<Error status={"404"} error={{message: 'Looks like you\'re lost'}}/>);
};