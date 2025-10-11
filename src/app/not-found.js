'use client';
import Error from '@/components/Error/ErrorComponent';

export default function NotFound() {
    return (<Error status={'404'} error={{message: 'Looks like you\'re lost'}}/>);
};