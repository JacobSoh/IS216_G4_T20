'use client';

import { useState, useEffect } from "react";
import {
    Header,
    InputControl,
    Error,
    SwitchLink
} from '@/components/authForm/index';
import { Button } from '@headlessui/react';

export default function AuthFormComponent({
    error,
    onSubmit,
    isLogin = true
}) {
    const [pwd, setPwd] = useState('');
    const [cfmPwdErr, setCfmPwdErr] = useState('');

    const items = [
        { key: "minLen" }
    ]

    const handleUsername = (e) => {
        return e.key === ' ' ? e.preventDefault() : null
    };

    const handlePwd = (e) => {
        setPwd(e.target.value);
    };

    const handleCfmPwd = (e) => {
        e.target.value !== pwd ? setCfmPwdErr('Passwords don\'t match.') : setCfmPwdErr('')
    };

    return (
        <div className='max-w-lg mx-auto px-6 lg:px-8'>
            <div className="flex flex-col justify-center py-10 md:py-15 lg:py-20">
                <Header isLogin={isLogin} />
                <div className='mt-10 mx-auto w-full'>
                    <form onSubmit={onSubmit} className='space-y-6'>
                        <InputControl labelText='Email'
                            formName='email' type='email'
                            isRequired={true} placeholder='example_email@example.com'
                        />
                        <InputControl labelText='Password'
                            formName='password' type='password'
                            isRequired={true} placeholder='Enter your password'
                            onChange={handlePwd} value={pwd}
                        />
                        {!isLogin && (
                            <>
                                <InputControl labelText='Confirm Password'
                                    formName='confirm_password' type='password'
                                    isRequired={true} placeholder='Re-enter your password'
                                    onChange={handleCfmPwd}
                                    error={cfmPwdErr}
                                />
                                <InputControl labelText='Username'
                                    formName='username' type='text'
                                    isRequired={true} placeholder="Enter your username"
                                    onkeypress={handleUsername}
                                />
                            </>
                        )}
                        <Button type='submit'
                            className='mt-5 w-full rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500'
                        >
                            {isLogin ? 'Login' : 'Register'}
                        </Button>
                    </form>
                    {error ? <Error error={error} /> : null}
                    <SwitchLink isLogin={isLogin} />
                </div>
            </div>
        </div>
    );
};