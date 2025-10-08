'use client';
import { useEffect, useId, useState } from 'react';
import { Input, Field, Label, Transition } from '@headlessui/react';

import {
    Error,
    PasswordCriteria
} from '@/components/authForm/index';

export default function InputControl({
    labelText='',
    formName='',
    type='input',
    value='',
    isRequired=true,
    onKeyDown,
    onChange,
    placeholder='',
    inputErr='',
    isLogin=false
}) {
    const id = useId();
    const [showPwdCriteria, setShowPwdCriteria] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const handleFocus = () => {
        if (isLogin) return false;
        if (formName === 'password') setShowPwdCriteria(true);
    };
    const handleBlur = () => {
        if (isLogin) return false;
        if (formName === 'password') setShowPwdCriteria(false);
    };

    const showError = !!(!`isLogin` && inputErr && inputErr.length > 0);

    return (
        <Field
            className='space-y-2'
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            <Label className='block text-sm/6 font-medium text-white' htmlFor={id}>
                {labelText}
                {isRequired && !isLogin && <span className='ms-2 items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 inset-ring inset-ring-red-400/20'>Required</span>}
                :
            </Label>
            <Input
                id={id}
                name={formName}
                type={type}
                className={'block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6'}
                required={isRequired}
                onKeyDown={onKeyDown}
                onChange={onChange}
                placeholder={placeholder}
                value={value ?? ''}
            />
            {mounted && <Transition
                show={showPwdCriteria}
                enter='transition ease-out duration-200'
                enterFrom='opacity-0 translate-y-1'
                enterTo='opacity-100 translate-y-0'
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-1"
            >
                <div className='py-2 px-4 my-4 text-sm text-red-800 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-red-400'>
                    <PasswordCriteria pwd={value} />
                </div>
            </Transition>}
            {mounted && <Transition
                show={showError}
                enter='transition ease-out duration-200'
                enterFrom='opacity-0 translate-y-1'
                enterTo='opacity-100 translate-y-0'
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-1"
            >
                <div className='py-2 px-4 my-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400' role='alert'>
                    <Error error={inputErr} />
                </div>
            </Transition>}
        </Field>
    );
};