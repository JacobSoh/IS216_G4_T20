'use client';
import { useState } from 'react';
import { Button } from '@headlessui/react';
import Image from 'next/image';
import _AuthFormControl from '@/components/form/AuthFormControl';
import { supabaseBrowser } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export async function re(email, password, metadata) {
    const sb = supabaseServer();
    const { data, error } = await (await sb).auth.signUp({
        email, 
        password,
        options: {
            data: metadata
        }
    });
    if ( error ) throw error;
    return data ?? null;
};

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const sb = supabaseBrowser();

    async function onSubmit(e) {
        setError('');
        e.preventDefault();

        const form = new FormData(e.currentTarget);
        const { data, error } = await (await sb).auth.signInWithPassword({
            email: form.get('email'),
            password: form.get('password')
        });
        if (error) return setError(error.message);
        router.push('/');
    }

    return (
        <div className='max-w-lg mx-auto min-h-full px-6 lg:px-8'>
            <div className='flex flex-col justify-center py-10 md:py-15 lg:py-20'>
                <div className='text-center space-y-7'>
                    <h3 className='text-5xl font-bold tracking-tight text-(--custom-cream-yellow)'>BidHub</h3>
                    <h2 className='text-center text-2xl/9 font-bold tracking-tight text-white'>Login to your account!</h2>
                </div>
                <div className='mt-10 mx-auto w-full'>
                    <form onSubmit={onSubmit} className='space-y-6'>
                        <_AuthFormControl labelText='Email' formName='email' type='email' isRequired={true} placeholder='example_email@example.com' />
                        <_AuthFormControl labelText='Password' formName='password' type='password' isRequired={true} placeholder='Enter your password' />
                        <Button type='submit'
                            className='mt-5 w-full rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
                        >
                            Login
                        </Button>
                    </form>

                    {error? (
                        <div className='p-4 my-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400' role='alert'>
                            <span className='font-medium'>Error:</span> {error}
                        </div>
                    ): null}
                    

                    <p className='mt-10 text-center text-sm/6 text-gray-400'>
                        Not a member?&nbsp;
                        <a href='/register' className='font-semibold text-indigo-400 hover:text-indigo-300'>Join us now!</a>
                    </p>
                </div>
            </div>
        </div>
    );
}