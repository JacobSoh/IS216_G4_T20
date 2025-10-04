'use client';
import ErrorComponent from '@/components/ErrorComponent';

export default function NotFound() {
    return (<ErrorComponent status={'404'} error={{message: 'Looks like you\'re lost'}}/>);
};