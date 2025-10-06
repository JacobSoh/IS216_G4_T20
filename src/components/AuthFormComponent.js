'use client';

import { useState, useReducer } from 'react';
import {
    Header,
    InputControl,
    SwitchLink
} from '@/components/authForm/index';
import Spinner from './SpinnerComponent';
import { Button } from '@headlessui/react';


const initialFormData = { email: '', username: '', password: '', cfmPwd: '' };

const formDataReducer = (state, action) => {
    switch (action.type) {
        case 'FIELD':
            return { ...state, [action.field]: action.value };
        case 'RESET':
            return initialForm;
        default:
            return state;
    };
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRe = /^[A-Za-z0-9_]{3,20}$/;

function validateEmail(v) {
    return emailRe.test(v);
};
function validateUsername(v) {
    return usernameRe.test(v);
};

export default function AuthFormComponent({
    showLoading,
    error,
    onSubmit,
    isLogin = true
}) {
    const [form, dispatch] = useReducer(formDataReducer, initialFormData);

    const matchErr =
        !isLogin && form.confirm_password && form.confirm_password !== form.password
            ? 'Passwords don\'t match.'
            : '';
    const emailErr =
        !isLogin && form.email && !validateEmail(form.email)
            ? 'Enter a valid email.'
            : '';
    const usernameErr =
        !isLogin && form.username && !validateUsername(form.username)
            ? '3-20 Characters [a-z/A-Z/0-9/_] only'
            : '';

    const hasErrors = !!(emailErr || usernameErr || matchErr);

    const handleField = (field) => (e) => dispatch({ type: 'FIELD', field, value: e.target.value })

    const handleUsername = (e) => { if (e.key === ' ') e.preventDefault() };

    return (
        <div className='max-w-lg mx-auto px-6 lg:px-8'>
            <div className='flex flex-col justify-center py-10 md:py-15 lg:py-20'>
                <Header isLogin={isLogin} />
                <div className='mt-10 mx-auto w-full'>
                    <form onSubmit={onSubmit} className='space-y-6'>
                        <InputControl
                            labelText="Email"
                            formName="email"
                            type="email"
                            isRequired={true}
                            placeholder="example_email@example.com"
                            value={form.email}
                            onChange={handleField("email")}
                            inputErr={emailErr}
                            isLogin={isLogin}
                        />

                        <InputControl
                            labelText="Password"
                            formName="password"
                            type="password"
                            isRequired={true}
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={handleField("password")}
                            isLogin={isLogin}
                        />

                        {!isLogin && (
                            <>
                                <InputControl
                                    labelText="Confirm Password"
                                    formName="confirm_password"
                                    type="password"
                                    isRequired={true}
                                    placeholder="Re-enter your password"
                                    value={form.confirm_password}
                                    onChange={handleField("confirm_password")}
                                    inputErr={matchErr}
                                />

                                <InputControl
                                    labelText="Username"
                                    formName="username"
                                    type="text"
                                    isRequired={true}
                                    placeholder="Enter your username"
                                    value={form.username}
                                    onChange={handleField("username")}
                                    onKeyDown={handleUsername}
                                    inputErr={usernameErr}
                                />
                            </>
                        )}

                        <Button
                            type="submit"
                            className="mt-5 w-full rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white 
                            hover:bg-indigo-400 focus-visible:outline-2 
                            focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            disabled={hasErrors}
                        >   
                            <div className='flex items-center justify-center gap-2'>
                                {isLogin ? "Login" : "Register"}
                                {showLoading && <Spinner />}
                            </div>
                        </Button>
                    </form>

                    <SwitchLink isLogin={isLogin} />
                </div>
            </div>
        </div>
    );
};