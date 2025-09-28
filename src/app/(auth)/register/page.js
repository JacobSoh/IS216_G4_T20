"use client";
import { useState } from "react";
import { Button } from "@headlessui/react";
import Image from "next/image";
import _AuthFormControl from "@/components/_authFormControl";
import { axiosBrowserClient } from "@/utils/axios/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');

    async function onSubmit(e) {
        setError('');
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        try {
            const res = await axiosBrowserClient.post("/auth/register", {
                email: form.get('email'),
                password: form.get('password'),
                metadata: {
                    username: form.get('username'),
                    first_name: form.get('first_name'),
                    middle_name: form.get('middle_name'),
                    last_name: form.get('last_name'),
                }
            });
            if (res.status !== 200) return setError("Unable to login!");
            router.push("/login");
        } catch (err) {
            return setError(err);
        };
    }

    return (
        <div className="max-w-2xl mx-auto px-6 lg:px-8 mt-16">
            <div className="flex flex-col justify-center sm:py-10 md:py-15 lg:py-20">
                <div className="text-center space-y-7">
                    <h3 className="text-5xl font-bold tracking-tight text-(--custom-cream-yellow)">BidHub</h3>
                    <h2 className="text-center text-2xl/9 font-bold tracking-tight text-white">Register your account today!</h2>
                </div>
                <div className="mt-10 mx-auto w-full">
                    <form onSubmit={onSubmit} className="space-y-6">
                        <_AuthFormControl labelText="Email" formName="email" type='email' isRequired={true} placeholder="example_email@example.com" />
                        <_AuthFormControl labelText="Username" formName="username" type='text' isRequired={true} onkeypress={(event) => {event.key === " "?event.preventDefault():null}} />
                        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-8">
                            <_AuthFormControl labelText="Password" formName="password" type='password' isRequired={true} placeholder="Enter your password" />
                            <_AuthFormControl labelText="Confirm Password" formName="confirm_password" type='password' isRequired={true} placeholder="Re-enter your password" />
                        </div>
                        
                        <_AuthFormControl labelText="First Name" formName="first_name" type='text' isRequired={true} />
                        <_AuthFormControl labelText="Middle Name" formName="middle_name" type='text' />
                        <_AuthFormControl labelText="Last Name" formName="last_name" type='text' isRequired={true} />
                        <Button type="submit"
                            className="mt-5 w-full rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            Register
                        </Button>
                    </form>

                    {error? (
                        <div className="p-4 my-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                            <span className="font-medium">Error:</span> {error}
                        </div>
                    ): null}
                    

                    <p className="mt-10 text-center text-sm/6 text-gray-400">
                        Already have an account?&nbsp;
                        <a href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">Login!</a>
                    </p>
                </div>
            </div>
        </div>
    );
}