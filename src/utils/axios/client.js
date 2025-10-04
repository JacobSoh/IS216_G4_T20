'use client';
import axios from 'axios';

export const axiosBrowserClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false
});

axiosBrowserClient.interceptors.response.use(
    (res) => res.data,
    (err) => Promise.reject(
        err?.response?.data?.error || err?.message || 'Request failed'
    )
);